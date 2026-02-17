---
title: 'Supabase'
titleJp: ''
date: '2025-12-02'
excerpt: ''
tags: ["vibe-coding"]
---
# Supabase实践



### Supabase 到底火在哪里？它解决了什么？

#### **A. 解决了后端消失术（BaaS - Backend as a Service）**
在 Vibe Coding 的语境下，我们追求的是“想法瞬间变现实”。
Supabase 自动为你建好的表生成了 **RESTful API**。你不需要写任何 Java Controller，不需要配置 JSON 解析。你只需要把注意力放在前端 UI 和业务逻辑上。

#### **B. 解决了登录注册的噩梦**
做过 Java 的人都知道，Spring Security 或 Shiro 配置起来有多痛苦。
Supabase 内置了 **GoTrue (Auth)** 系统：
*   想用邮箱登录？自带。
*   想用 GitHub、微信登录？点一下开关。
*   想控制谁能看哪行数据？在网页上写一句 SQL 策略（RLS）就行。

#### **C. 解决了实时性问题**
如果你想做一个“有人评论了，网页立刻跳出弹窗”的功能。
*   **Java 做法**：搞 WebSocket，写消息处理器，处理连接断开重连。
*   **Supabase 做法**：一行代码 `supabase.channel().on('INSERT').subscribe()`。它基于 PostgreSQL 的 WAL 日志，原生支持实时推送。

#### **D. 解决了“文件上传”**
以前 Java 需要对接 OSS（如阿里云）或者写文件流。Supabase 自带 **Storage**，传图片、存头像，几个 API 调用搞定。

---

### 3. 一个 Java 小白最容易理解的类比

你可以把 **Supabase** 想象成：
> **一个自带 Spring Boot + Spring Security + Hibernate + 数据库连接池 + 腾讯云存储 + 极速部署环境的“超级全家桶”。**

而且，这个全家桶是**云端托管**的，你不需要维护。

---