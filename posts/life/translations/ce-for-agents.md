---
title: 'Context Engineering for AI Agents'
titleJp: ''
date: '2025-12-09'
excerpt: ''
tags: ["Translate"]
---
> Weaviate AI Database : https://weaviate.io/blog/context-engineering




### Context Engineering vs. Prompt Engineering

简单来说，prompt engineering指的是如何提出问题，而 context engineering 则确保模型在开始思考之前能够访问正确的教科书、计算器，甚至是你之前对话中的笔记/记忆。

LLM 的质量和有效性很大程度上取决于它们接收到的提示，但如果没有精心设计的上下文，你提出提示的方式也只能发挥有限的作用。诸如“思维链”、“少样本学习”和“ReAct”等提示技巧，
与检索到的文档、用户历史记录或特定领域的数据结合使用时，效果最佳。

