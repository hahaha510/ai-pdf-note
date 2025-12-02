# 工程规范设置指南

## 快速开始

### 1. 安装依赖

```bash
npm install
```

这将安装所有必需的依赖，包括：

- ESLint（代码检查）
- Prettier（代码格式化）
- Husky（Git hooks）
- lint-staged（预提交检查）

### 2. 初始化 Git Hooks

```bash
npm run prepare
```

这将设置 Husky Git hooks，在提交代码前自动运行检查。

### 3. VS Code 设置（推荐）

安装推荐的扩展：

1. ESLint
2. Prettier
3. EditorConfig

VS Code 会自动提示安装推荐扩展。

### 4. 格式化现有代码

```bash
npm run format
```

## 日常使用

### 开发流程

```bash
# 1. 启动开发服务器
npm run dev

# 2. 编写代码（自动保存时格式化）

# 3. 提交前检查
npm run lint
npm run format:check

# 4. Git 提交
git add .
git commit -m "feat: your message"
# Husky 会自动运行 lint-staged 检查
```

### 常用命令

```bash
# 格式化所有文件
npm run format

# 只检查格式问题（不修改）
npm run format:check

# ESLint 检查
npm run lint

# ESLint 自动修复
npm run lint:fix
```

## Git Hooks 说明

### Pre-commit Hook

在每次 `git commit` 前自动运行：

1. ESLint 检查并修复
2. Prettier 格式化
3. 只处理暂存区的文件

如果检查失败，提交会被阻止。

### 跳过 Hooks（不推荐）

```bash
git commit --no-verify
```

## 文件说明

- `.prettierrc.json` - Prettier 配置
- `.prettierignore` - Prettier 忽略文件
- `.eslintrc.json` - ESLint 配置
- `.eslintignore` - ESLint 忽略文件
- `.editorconfig` - 编辑器配置
- `.lintstagedrc.json` - lint-staged 配置
- `.vscode/settings.json` - VS Code 设置
- `.vscode/extensions.json` - VS Code 推荐扩展

## 常见问题

### Q: 提交时检查失败？

A: 运行 `npm run lint:fix` 和 `npm run format` 修复问题。

### Q: VS Code 不自动格式化？

A: 检查是否安装了 Prettier 扩展，并在设置中启用 "Format On Save"。

### Q: 如何临时禁用某行的 ESLint？

A: 使用注释：

```javascript
// eslint-disable-next-line rule-name
const code = "here";
```
