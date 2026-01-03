---
title: "Skill-SubAgent"
description: "Skill&SubAgent"
date: "2025-12-24"
tags: ["vibe-coding"]
category: "general"
slug: "sub-agent-vs-skill"
published: true
---

skills 重点在Prompt 发现&懒加载，改变当前 agent 能力，有当前完整上下文，我觉得适合的场景是当前任务复合程度不高的情况（载入多个 skills 就会出现性能下降问题），比如主 Agent 是入口当做路由，然后通过 skills 载入场景能力，进入到 YouTube-summary，写 ppt 模式；
sub-agent 也有发现过程，但重点是过程压缩，执行过程在当前 agent 之外，他对于当前 agent 就是一个 tool（function call），只有 req/res；

还有一个把两种结合在一起的方式，在一个节点发现需要 skills，载入执行拿到 skills 的结果后，把需要 skills 的节点到结果的节点的 tool use 过程进行压缩，也是一种方式。