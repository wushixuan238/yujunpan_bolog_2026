---
title: 'How to write a great agents.md: Lessons from over 2,500 repositories'
titleJp: ''
date: '2025-12-09'
excerpt: ''
tags: ["Translate"]
---
# How to write a great agents.md: Lessons from over 2,500 repositories


> https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/


**The challenge?**

大多数 agent files都失败了，因为它们过于模糊。“你是一位乐于助人的编码助手”行不通。“你是一位测试工程师，负责为 React 组件编写测试，遵循这些示例，并且从不修改源代码”则行得通。


我分析了公共代码库中超过 2500 个 `agents.md` 文件，以了解开发者如何使用 `agents.md` 文件。分析结果清晰地揭示了有效做法的模式：为代理提供特定的任务或角色、要运行的确切命令、明确的边界以及清晰的优秀输出示例供代理参考。

**以下是成功者与众不同的做法。**


- **请具体说明您的技术栈**: 例如，要说 “React 18，搭配 TypeScript、Vite 和 Tailwind CSS”，而不是 “React 项目”。要包含版本信息和关键依赖项。
- **涵盖六个核心领域**：掌握这些领域将使你跻身顶尖行列：命令、测试、项目结构、代码风格、git 工作流和边界。

### 优秀 agent.md 文件示例


