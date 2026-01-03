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

1. 打开 `components/Blog.tsx` 文件。
2. 找到 `blogPosts` 数组。
3. 按照以下格式在数组中添加一个新的对象：

```typescript
{
  id: 'unique-id', // 例如：'5'
  title: '英文标题',
  titleJp: '日文或副标题',
  date: 'YYYY.MM.DD', // 日期格式
  excerpt: '列表页显示的简短摘要。',
  content: `在这里写博客正文。
  
  如果你想分段，请敲两次回车。`,
  tags: ['标签1', '标签2'],
}
```
4. 保存文件，网站会自动更新。
