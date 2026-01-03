<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1mpbChWMD2FKbeFWImTDBiGd0Ti1nVppf

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 如何添加新文章

1. 在项目根目录下找到 `posts` 文件夹。
2. 创建一个新的 `.md` 文件（例如 `my-new-post.md`）。
3. 在文件开头添加此时所需的元数据（Front Matter），格式如下：

```markdown
---
id: 'unique-id'       # 唯一标识符
title: '文章标题'
titleJp: '日文或副标题'
date: 'YYYY.MM.DD'    # 发布日期
excerpt: '文章摘要，将显示在列表页。'
tags: ['标签1', '标签2']
---

在这里开始写您的文章正文...

支持 **Markdown** 语法。
```
4. 保存文件，网站会自动检测并显示新文章。
