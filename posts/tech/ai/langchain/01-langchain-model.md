---
title: 'LangChain 1.0(一)'
titleJp: ''
date: '2025-11-06'
excerpt: ''
tags: ["langchain"]
---
## Model

LangChain 自 2024 年初发布 1.0 版本以来，接入各类模型的方法也变得更加统一和规范。

它的核心思想其实就是：**将核心的 LangChain 逻辑 (`langchain-core`) 与具体的模型实现 (`langchain-community`, `langchain-openai`, `langchain-anthropic` , `langchain-deepseek` 等) 分离开**。

从 1.0 版本开始，LangChain 迎来了重要的架构升级，其核心思想是**模块化**和**标准化**。`langchain-core` 提供了核心的抽象和运行逻辑，而与具体模型、数据库或工具的集成则被拆分到独立的包中（如 `langchain-community`, `langchain-openai`, `langchain-deepseek` 等）。

这种架构使得开发者可以按需安装，并且让不同模型的接入方式变得高度统一。接下来，我们将通过几个实例，演示如何将国内外主流的大模型接入到 LangChain 1.0 的开发流程中。

下面详细介绍接入不同类型模型的方法。

> 环境要求：
>
> - LangChain >= 1.0.0
> - Python >= 3.11
> - _请使用 `pip install --upgrade <包名称>` 确保您的库是最新版本。_

### 1. 接入 DeepSeek 模型

DeepSeek 是一个性能优异且备受欢迎的国产大模型。我们首先以它为例，展示完整的接入流程。

**步骤 1：获取并设置 API Key**

1. **注册账号**：访问 [DeepSeek 官方平台](https://platform.deepseek.com/usage) 注册并创建一个新的 API Key。
2. **环境变量配置**：为了安全和方便地管理密钥，推荐使用 `.env` 文件。

   - 在你的项目根目录下创建一个名为 `.env` 的文件。
   - 在文件中写入你的密钥，格式如下：
     ```
     DEEPSEEK_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
     ```

3. **加载环境变量**：使用 `python-dotenv` 库来读取 `.env` 文件并加载到当前环境中。

   ```python
   # 安装依赖
   # ! pip install python-dotenv

   import os
   from dotenv import load_dotenv

   # 加载 .env 文件，override=True 表示如果已存在同名环境变量则覆盖它
   load_dotenv(override=True)

   # 从环境中读取 API Key
   DeepSeek_API_KEY = os.getenv("DEEPSEEK_API_KEY")
   # print(DeepSeek_API_KEY) # 可以打印出来确认是否加载成功
   ```

**步骤 2：(可选) 原生 API 连通性测试**

在接入 LangChain 之前，先用模型官方推荐的 SDK 测试一下网络和 Key 是否可用，这是一个很好的习惯。DeepSeek 的 API 兼容 OpenAI 的格式，所以我们可以直接使用 `openai` 库进行测试。

```python
# 安装 openai 库
# ! pip install openai

from openai import OpenAI

# 初始化DeepSeek的API客户端
# 注意：需要指定 base_url 为 DeepSeek 的 API 地址
client = OpenAI(api_key=DeepSeek_API_KEY, base_url="https://api.deepseek.com")

# 调用DeepSeek的API，生成回答
response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[
        {"role": "system", "content": "你是乐于助人的助手，请根据用户的问题给出回答"},
        {"role": "user", "content": "你好，请你介绍一下你自己。"},
    ],
)

# 打印模型最终的响应结果
print(response.choices[0].message.content)
```

**预期输出：**

```text
你好！我是乐于助人的智能助手，很高兴认识你！😊

**关于我：**
- 我是一个基于人工智能的语言模型，旨在为你提供信息、解答问题和协助完成各种任务
- 我的知识涵盖广泛领域，包括科学、技术、文学、历史、日常生活等
...
```

如果能看到类似上面的回复，说明你的网络和 API Key 都没有问题。

**步骤 3：使用 LangChain 接入 DeepSeek**

现在，我们正式将其接入 LangChain。得益于模块化的设计，这个过程非常简单。

1. **安装 DeepSeek 集成包**：

   ```bash
   pip install langchain-deepseek
   # 或者
   uv add langchain-deepseek
   ```

2. **实例化并调用模型**：

   ```python
   from langchain_deepseek import ChatDeepSeek

   # 实例化模型，会自动从环境变量中寻找 DEEPSEEK_API_KEY
   model = ChatDeepSeek(model="deepseek-chat")

   # 准备问题
   question = "你好，请你介绍一下你自己。"

   # 调用模型，LangChain 1.0 统一使用 invoke 方法
   result = model.invoke(question)

   # 打印返回内容
   print(result.content)
   ```

**LangChain 返回对象解析**

调用 `invoke` 方法返回的是一个 `AIMessage` 对象，而不仅仅是文本。这个对象包含了丰富的信息。

```python
# 查看完整的返回对象
result
```

**输出：**

```
AIMessage(
    content='你好！很高兴认识你！...',
    additional_kwargs={'refusal': None},
    response_metadata={
        'token_usage': {'completion_tokens': 240, 'prompt_tokens': 10, 'total_tokens': 250, ...},
        'model_provider': 'deepseek',
        'model_name': 'deepseek-chat',
        ...
    },
    id='lc_run--...'
)
```

你可以从 `result.content` 获取文本回复，从 `response_metadata` 获取 Token 用量等元数据，这对于我们之后的成本控制和应用监控非常有用。

### 2. 接入本地模型 (通过 Ollama)

除了调用云端 API，LangChain 也完美支持通过 Ollama、vLLM 等框架在本地运行的开源模型。这里以 Ollama 为例。

1. **准备本地 Ollama 环境**：

   - 确保你已经在本地安装并成功运行了 Ollama 服务。
   - 通过 `ollama list` 命令查看已下载并可用的模型。

   <center><img src="https://ml2022.oss-cn-hangzhou.aliyuncs.com/img/202506121701138.png" alt="ollama list" style="zoom:33%;" /></center>

2. **安装 Ollama 集成包**：

   ```bash
   ! pip install langchain-ollama
   ```

3. **实例化并调用模型**：

   ```python
   from langchain_ollama import ChatOllama

   # 实例化模型，通过 model 参数指定 Ollama 中已有的模型名称
   model = ChatOllama(model="llama3") # 假设你本地有 llama3 模型

   question = "你好，请你介绍一下你自己。"

   result = model.invoke(question)
   print(result.content)
   ```

### 总结与更多资源

通过以上示例，我们可以清晰地看到 LangChain 1.0 的设计哲学：**为不同的模型提供统一、简洁的调用接口**。无论使用的是国内的 DeepSeek、阿里的通义千问，还是海外的 OpenAI，或是本地的 Ollama，接入 LangChain 的核心代码几乎都是一样的三步：

1. `pip install langchain-<provider>`
2. `from langchain_<provider> import Chat<Provider>`
3. `model = Chat<Provider>(model="...")`
4. `result = model.invoke(question)`

这种一致性极大地降低了开发者的学习成本和模型切换成本。

想要探索更多模型的接入方法，请访问 LangChain 官方的集成文档，那里有上百种模型的接入指南：
[_LangChain Chat Model Integrations_](<[https://python.langchain.com/v0.2/docs/integrations/chat/](https://docs.langchain.com/oss/python/integrations/providers/overview)>)

## MiddleWare

**LangChain v1.0** 的最大架构升级之一，就是引入了 ​**Middleware**（中间件）机制 ​。

### 场景一：实现模型动态选择

这个需求很常见，比如有时候我们需要根据对话复杂度选择模型，根据用户权限选择不同能力的模型，\* 根据成本控制动态切换模型。

### 内置 Middleware

其实没有必要一上来就自定义`Middleware`，大部分需求，都可以通过组合框架提供给我们内置的就能解决。

## Structured Output

### Response Format Strategy
