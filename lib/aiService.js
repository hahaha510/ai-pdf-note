import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * AI 服务类 - 封装所有 AI 功能
 */
class AIService {
  constructor() {
    // 文本生成模型 (gemini-2.0-flash-exp 更快更便宜)
    this.textModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    // Embedding 模型
    this.embeddingModel = genAI.getGenerativeModel({
      model: "text-embedding-004",
    });

    this.generationConfig = {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 2048,
    };
  }

  /**
   * 生成文本 Embedding（向量）
   * @param {string} text - 要向量化的文本
   * @returns {Promise<number[]>} - 向量数组
   */
  async generateEmbedding(text) {
    try {
      const result = await this.embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error("生成 Embedding 失败:", error);
      throw error;
    }
  }

  /**
   * 批量生成 Embedding
   * @param {string[]} texts - 文本数组
   * @returns {Promise<number[][]>} - 向量数组
   */
  async generateBatchEmbeddings(texts) {
    try {
      const results = await Promise.all(texts.map((text) => this.generateEmbedding(text)));
      return results;
    } catch (error) {
      console.error("批量生成 Embedding 失败:", error);
      throw error;
    }
  }

  /**
   * 计算余弦相似度
   * @param {number[]} vecA - 向量 A
   * @param {number[]} vecB - 向量 B
   * @returns {number} - 相似度 (0-1)
   */
  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * 语义搜索笔记（多因素加权）
   * @param {string} query - 搜索查询
   * @param {Array} notes - 笔记数组 [{noteId, title, content, embedding}]
   * @param {number} topK - 返回前 K 个结果
   * @returns {Promise<Array>} - 排序后的笔记数组
   */
  async semanticSearch(query, notes, topK = 5) {
    try {
      console.log("开始 AI 搜索，笔记数量:", notes.length);

      // 1. 生成查询的 Embedding
      const queryEmbedding = await this.generateEmbedding(query);
      console.log("查询 embedding 生成完成");

      // 2. 为没有 embedding 的笔记生成（分别处理标题和内容）
      const notesWithEmbeddings = await Promise.all(
        notes.map(async (note) => {
          // 如果已有完整 embedding（PDF 笔记），直接使用
          if (note.embedding) {
            return { ...note, titleEmbedding: null, contentEmbedding: null };
          }

          try {
            // 分别生成标题和内容的 embedding
            const titleEmbedding = await this.generateEmbedding(note.title);
            const contentText = (note.content || "").substring(0, 1000); // 增加到前 1000 字
            const contentEmbedding = contentText
              ? await this.generateEmbedding(contentText)
              : titleEmbedding;

            console.log("为笔记生成 embedding:", note.title);
            return { ...note, titleEmbedding, contentEmbedding };
          } catch (error) {
            console.error("生成 embedding 失败:", error);
            return { ...note, titleEmbedding: null, contentEmbedding: null };
          }
        })
      );

      // 3. 计算综合得分（多因素加权）
      const notesWithScores = notesWithEmbeddings.map((note) => {
        // 如果是 PDF 笔记（有 embedding）
        if (note.embedding) {
          const semanticScore = this.cosineSimilarity(queryEmbedding, note.embedding);
          return { ...note, score: semanticScore, breakdown: { semantic: semanticScore } };
        }

        // 如果没有 embedding，返回 0 分
        if (!note.titleEmbedding || !note.contentEmbedding) {
          return { ...note, score: 0, breakdown: {} };
        }

        // 计算标题相似度（权重 50%）
        const titleScore = this.cosineSimilarity(queryEmbedding, note.titleEmbedding);

        // 计算内容相似度（权重 30%）
        const contentScore = this.cosineSimilarity(queryEmbedding, note.contentEmbedding);

        // 计算关键词匹配度（权重 20%）
        const keywordScore = this.calculateKeywordMatch(query, note.title, note.content || "");

        // 综合得分
        const finalScore = titleScore * 0.5 + contentScore * 0.3 + keywordScore * 0.2;

        return {
          ...note,
          score: finalScore,
          breakdown: {
            title: titleScore,
            content: contentScore,
            keyword: keywordScore,
            final: finalScore,
          },
        };
      });

      // 4. 排序并返回前 K 个
      const results = notesWithScores
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .filter((note) => note.score > 0.25); // 适度提高阈值

      console.log("搜索完成，找到结果:", results.length);
      console.log(
        "结果详情:",
        results.map((r) => ({
          title: r.title,
          score: r.score?.toFixed(3),
          breakdown: r.breakdown,
        }))
      );

      return results;
    } catch (error) {
      console.error("语义搜索失败:", error);
      throw error;
    }
  }

  /**
   * 计算关键词匹配度
   * @param {string} query - 搜索查询
   * @param {string} title - 标题
   * @param {string} content - 内容
   * @returns {number} - 匹配分数 (0-1)
   */
  calculateKeywordMatch(query, title, content) {
    const queryLower = query.toLowerCase();
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();

    // 提取查询中的关键词（简单分词，按空格和常见标点分割）
    const keywords = queryLower.split(/[\s,，。.、]+/).filter((k) => k.length > 1);

    if (keywords.length === 0) return 0;

    let matchCount = 0;

    keywords.forEach((keyword) => {
      // 标题完全匹配（加倍加分）
      if (titleLower.includes(keyword)) {
        matchCount += 2;
      }
      // 内容匹配
      else if (contentLower.includes(keyword)) {
        matchCount += 1;
      }
    });

    // 归一化到 0-1
    const maxPossibleScore = keywords.length * 2; // 所有关键词都在标题中匹配
    return Math.min(matchCount / maxPossibleScore, 1);
  }

  /**
   * 生成笔记摘要
   * @param {string} content - 笔记内容
   * @param {number} maxLength - 最大长度（字）
   * @returns {Promise<string>} - 摘要文本
   */
  async summarize(content, maxLength = 150) {
    try {
      const prompt = `请为以下笔记内容生成一个简洁的摘要（不超过${maxLength}字）。只返回摘要内容，不要添加任何前缀或解释。

笔记内容：
${content}

摘要：`;

      const result = await this.textModel.generateContent(prompt);
      const summary = result.response.text().trim();
      return summary;
    } catch (error) {
      console.error("生成摘要失败:", error);
      throw error;
    }
  }

  /**
   * 批量生成摘要
   * @param {Array} notes - 笔记数组 [{title, content}]
   * @returns {Promise<string>} - 综合摘要
   */
  async summarizeBatch(notes) {
    try {
      const notesText = notes
        .map((note, i) => `${i + 1}. ${note.title}\n${note.content.substring(0, 500)}...`)
        .join("\n\n");

      const prompt = `以下是多篇笔记的内容，请生成一个综合摘要，概括这些笔记的主要主题和关键点：

${notesText}

综合摘要：`;

      const result = await this.textModel.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error("批量生成摘要失败:", error);
      throw error;
    }
  }

  /**
   * 提取笔记主题
   * @param {Array} notes - 笔记数组 [{title, content}]
   * @param {number} topK - 返回前 K 个主题
   * @returns {Promise<Array>} - 主题数组 [{topic, count, noteIds}]
   */
  async extractTopics(notes, topK = 5) {
    try {
      const notesText = notes.map((note, i) => `笔记${i + 1}: ${note.title}`).join("\n");

      const prompt = `分析以下笔记标题，提取出${topK}个主要主题。每个主题用一个简短的词或短语表示。
以 JSON 格式返回，格式如下：
{"topics": ["主题1", "主题2", "主题3"]}

笔记标题：
${notesText}

JSON:`;

      const result = await this.textModel.generateContent(prompt);
      const text = result.response.text().trim();

      // 尝试解析 JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);

        // 为每个主题分配笔记
        const topicsWithNotes = data.topics.map((topic) => {
          const relatedNotes = notes.filter(
            (note) =>
              note.title.toLowerCase().includes(topic.toLowerCase()) ||
              note.content.toLowerCase().includes(topic.toLowerCase())
          );

          return {
            topic,
            count: relatedNotes.length,
            noteIds: relatedNotes.map((n) => n.noteId),
          };
        });

        return topicsWithNotes.sort((a, b) => b.count - a.count);
      }

      return [];
    } catch (error) {
      console.error("提取主题失败:", error);
      throw error;
    }
  }

  /**
   * 智能问答（基于笔记内容）
   * @param {string} question - 用户问题
   * @param {Array} relevantNotes - 相关笔记数组
   * @returns {Promise<string>} - 答案
   */
  async answerQuestion(question, relevantNotes) {
    try {
      const context = relevantNotes
        .map((note, i) => `笔记${i + 1}《${note.title}》：\n${note.content.substring(0, 1000)}`)
        .join("\n\n");

      const prompt = `基于以下笔记内容，回答用户的问题。如果笔记中没有相关信息，请明确说明。

笔记内容：
${context}

用户问题：${question}

回答：`;

      const result = await this.textModel.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error("回答问题失败:", error);
      throw error;
    }
  }

  /**
   * 为笔记生成标签建议
   * @param {string} content - 笔记内容
   * @param {number} maxTags - 最多生成几个标签
   * @returns {Promise<string[]>} - 标签数组
   */
  async suggestTags(content, maxTags = 5) {
    try {
      const prompt = `分析以下笔记内容，生成${maxTags}个最相关的标签。标签应该简洁、准确。
以 JSON 数组格式返回：["标签1", "标签2", "标签3"]

笔记内容：
${content.substring(0, 1000)}

标签：`;

      const result = await this.textModel.generateContent(prompt);
      const text = result.response.text().trim();

      // 尝试解析 JSON
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return [];
    } catch (error) {
      console.error("生成标签失败:", error);
      throw error;
    }
  }
}

// 导出单例
export const aiService = new AIService();
