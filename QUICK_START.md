# 快速启动指南

## 启动应用

### 1. 安装依赖（如果还没安装）

```bash
npm install
```

### 2. 启动 Convex 开发服务器

在一个终端窗口中运行：

```bash
npx convex dev
```

### 3. 启动 Next.js 开发服务器

在另一个终端窗口中运行：

```bash
npm run dev
```

### 4. 访问应用

打开浏览器访问：http://localhost:3000

## 使用 Online Notes 功能

### 第一次使用

1. 在主页点击 "Get Started"
2. 如果未登录，会跳转到登录页面
3. 登录后，会显示选择对话框
4. 选择 "Online Note" 进入在线笔记

### 创建第一个笔记

1. 点击 "New Note" 按钮
2. 输入笔记标题，例如："我的第一个笔记"
3. 点击 "Create"
4. 开始编辑笔记内容

### 使用 Markdown

在编辑器中输入：

```markdown
# 我的第一个笔记

这是一个**重要**的笔记。

## 待办事项

- [ ] 学习 Markdown
- [ ] 创建更多笔记
- [ ] 添加标签

## 代码示例

\`\`\`javascript
console.log('Hello, Notes!');
\`\`\`
```

### 添加标签和分类

1. 在 "Tags" 部分输入标签，例如："学习"、"工作"
2. 按 Enter 或点击 + 按钮添加
3. 在 "Category" 部分输入分类，例如："个人"

### 查看预览

点击 "Show Preview" 按钮查看 Markdown 渲染效果

### 保存笔记

- 自动保存：编辑停止 2 秒后自动保存
- 手动保存：点击 "Save" 按钮

## 功能测试清单

- [ ] 创建新笔记
- [ ] 编辑笔记内容
- [ ] 添加标签
- [ ] 设置分类
- [ ] 查看 Markdown 预览
- [ ] 搜索笔记
- [ ] 按标签筛选
- [ ] 按分类筛选
- [ ] 删除笔记
- [ ] 返回主页

## 故障排除

### 问题：无法创建笔记

- 确保已登录
- 检查 Convex 服务是否正常运行
- 查看浏览器控制台是否有错误

### 问题：搜索无结果

- 确保已创建笔记
- 尝试使用不同的关键词
- 清除所有筛选条件

### 问题：预览不显示

- 确保内容是有效的 Markdown
- 尝试刷新页面
- 检查是否点击了 "Show Preview" 按钮

## 开发调试

### 查看 Convex 数据

访问 Convex Dashboard：

```
https://dashboard.convex.dev
```

### 查看数据库中的笔记

在 Convex Dashboard 中：

1. 选择你的项目
2. 进入 "Data" 标签
3. 查看 "onlineNotes" 表

### 测试 API

在 Convex Dashboard 的 "Functions" 标签中可以测试所有 API 函数

## 下一步

查看 `ONLINE_NOTES_GUIDE.md` 了解更多功能详情。
