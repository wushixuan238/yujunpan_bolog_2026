---
title: "Event"
description: "解释ADK 事件"
date: "2025-11-06"
tags: ["langchain"]
category: "general"
slug: "google-adk"
published: true
---

# Event

笔者在阅读完官方文档这部分内容时，首先的一个困惑点就是，通篇阅读下来，`Event`（事件）这个概念，不过是信息传递而已，为什么 Google 要设计得如此复杂？

先带着这个问题，过一遍这个文档，等看完再回过头来思考这个问题。

您看到的这套 `Event` 系统，是我们在设计一个**可调试、可扩展、高并发**的智能体（Agent）框架时，必须采用的“**健壮性设计**”。它看起来复杂，是因为它在**同时解决三个核心的工程难题**。如果它只解决一个，系统就会在另外两个上“爆掉”。

---

### 难题一：“黑匣子”灾难 (The "Black Box" Disaster)

- **简单的设计：** AI 和工具之间传来传去的就是“字符串”（String）。
- **灾难：** 您的智能体出错了。它给了一个牛头不对马嘴的答案。
  - **您：** “怎么回事？”
  - **AI (LLM)：** “我不知道，工具传给我的就是这个。”
  - **工具 (Tool)：** “我也不知道，AI 传给我的就是这个。”
  - **您：** “你们的*状态*（State）是什么？”
  - **系统：** “状态是对的，但不知道是谁在什么时候改错了。”

**这就是“黑匣子”灾难。** 智能体（尤其是 LLM）本身就具有不确定性，如果它的执行过程也是一个“黑匣子”，那么**调试（Debug）将成为不可能**。

#### 💡 我们的设计 (`Event`)：AI 的“飞行数据记录仪”

`Event` 的首要设计目标是**“可观测性”（Observability）**。

我们规定，系统中的**任何**动作——用户的提问、AI 的思考（`function_call`）、工具的执行（`function_response`）、状态的变更（`state_delta`）——都**必须**被封装成一个**不可变的 `Event` 记录**。

然后，我们把这些 `Event` **按时间顺序**串联起来，存入 `session.events`。

**这为什么至关重要？**
当智能体出错了，您（开发者）不再是“猜”。您可以像检查“飞行数据记录仪”一样，**完美复现**整个灾难过程：

1.  `19:01:00` (User): "去伦敦"
2.  `19:01:01` (Agent): (Event: `function_call: find_airports(city="London")`)
3.  `19:01:03` (Tool): (Event: `function_response: ["LHR", "LGW"]`)
4.  `19:01:05` (Agent): (Event: `actions: {"state_delta": {"booking_id": "T123"}}`)

如果第 4 步出错了，您可以**精确地**看到是第 3 步的`function_response`导致的。**没有这个不可变的历史记录，调试复杂智能体根本无从谈起。**

---

### 难题二：“中央集权”灾难 (The "Centralized" Disaster)

- **简单的设计：** 写一个巨大的“主函数”（God Function），它按顺序 1、2、3 调用 LLM、调用工具、更新状态……
- **灾难：**
  1.  **无法解耦：** `LLM` 模块和 `State` 模块紧紧绑在一起。
  2.  **无法扩展：** 您想加一个“错误处理”逻辑，就得改“主函数”；您想加一个“新工具”，还得改“主函数”。
  3.  **无法异步：** 当一个工具（`Tool`）需要执行 10 秒钟时，整个系统（“主函数”）都卡住了。

#### 💡 我们的设计 (`Event`)：“发布-订阅”的“消息总线”

`Event` 是我们实现**“系统解耦”**的武器。

我们不写一个“上帝函数”，而是把系统设计成一个“**消息总线**”。`Runner`（运行器）是“总线”，而 `Event` 就是在总线上流动的“**标准消息包**”。

**这为什么至关重要？**

- **AI (LLM)** 不再需要“知道”谁会执行工具。它只需要**发布**一个“工具调用 `Event`”。
- **工具 (Tool)** 也不需要“知道”AI。它只需要**订阅**“工具调用 `Event`”，执行完，再**发布**一个“工具结果 `Event`”。
- **状态 (SessionService)** 也不需要“知道”AI。它只需要**订阅**“`Event` 包里的 `actions` 字段”，然后更新数据库。

**这就是“解耦”的力量。**
这个设计，让我们可以轻松地在“总线”上挂载新功能（比如挂载一个“长任务处理器”专门处理 `event.actions().transferToAgent()`），而**完全不需要**改动 `LLM` 或 `Tool` 的代码。

---

### 难题三：“状态不一致”灾难 (The "Inconsistency" Disaster)

- **简单的设计：** 我们在上一节聊过的：多线程时，我直接 `session.state["key"] = "value"`。
- **灾难：** **竞态条件 (Race Condition)**。`State` 和 `History` 变得**不一致**。您（开发者）会看到 `History` 里记录的是“A”，但 `State` 里的值却是“B”。系统坏了，而且您永远不知道是怎么坏的。

#### 💡 我们的设计 (`Event`)：“原子化”的“变更指令”

这是 `Event` 设计**最精妙、最核心**的一点，它与 `State` 管理紧密相连。

我们**禁止**系统中的任何组件“直接修改”状态。
我们强制规定：**您（AI）不能“修改”状态，您只能“申请”修改状态。**

这个“申请”就是 `EventActions`（`state_delta`）。

**这为什么至关重要？**
`Event` 把“**意图**”（`content`，比如“我回答了 XXX”）和“**副作用**”（`actions`，比如“请把 `state` 里的 `login_count` 加 1”）**捆绑成一个原子化的、不可变的包**。

当 `SessionService` 收到这个 `Event` 包时，它会执行一个**事务性**操作：

1.  **锁定** (Lock)
2.  **应用变更** (`event.actions.state_delta`)
3.  **记录历史** (`session.events.append(event)`)
4.  **解锁** (Unlock)

这个“**先申报、后处理**”的模式（即“事件溯源” Event Sourcing）是**唯一**能保证**“状态”和“历史”在并发环境下永远 100%一致**的方案。

---

### 总结：“复杂”是为“健壮”付出的代价

所以，当您看到 `Event` 这个“复杂”的设计时，它必须经得起推敲，因为它在用一个统一的对象，同时扮演三个“救火队长”的角色：

1.  **它是“飞行记录仪”** （解决“可观测性”难题）
2.  **它是“标准消息包”** （解决“系统解耦”难题）
3.  **它是“原子变更单”** （解决“状态一致性”难题）

我们把“复杂性”封装在框架（ADK）内部，就是为了让您（开发者）在构建应用时，可以**安全、简单**地只关心 `is_final_response()`（我该给用户看什么）和 `context.state["key"] = ...`（我该改什么），而**无需**担心我们担心的那三大灾难。

---

### 代码实战：构建一个会“记住”你的智能体

理论讲完了，让我们用一个最简单的例子，来亲身体会 `Event` 是如何在代码中流动的。

**目标：** 我们要创建一个 `GreeterAgent`。

- 第一次和用户打招呼时，它会问用户的名字。
- 用户回答后，它会记住用户的名字，并记录打招呼的次数。
- 下一次用户再来，它会直接称呼用户的名字，并更新打招呼次数。

这个例子完美地展示了 **读取状态 (`state`)、生成内容 (`content`) 和申请修改状态 (`actions.state_delta`)** 的完整流程。

#### 1. 编写 `GreeterAgent` (Python 示例)

```python
from adk.api.agents import BaseAgent, AgentContext
from adk.api.events import Event, EventContent, EventPart, EventActions
from typing import AsyncGenerator, Dict, Any

class GreeterAgent(BaseAgent):
    def __init__(self, agent_name: str = "GreeterAgent"):
        super().__init__(name=agent_name)

    async def run(
        self, context: AgentContext, **kwargs: Any
    ) -> AsyncGenerator[Event, None]:
        # 从上下文中读取当前状态
        user_name = context.state.get("user_name")
        visit_count = context.state.get("visit_count", 0)

        # 获取用户最新的输入
        last_user_event = context.get_last_user_event()
        user_input = last_user_event.content.parts[0].text if last_user_event else ""

        response_text = ""
        state_changes: Dict[str, Any] = {}

        if user_name:
            # --- 场景2: 已经知道名字了 ---
            new_visit_count = visit_count + 1
            response_text = f"你好, {user_name}! 这是我们第 {new_visit_count} 次见面了。"
            state_changes["visit_count"] = new_visit_count
        else:
            # --- 场景1: 还不知道名字 ---
            if visit_count == 0:
                # 第一次交互，主动询问
                response_text = "你好! 我是 GreeterAgent。请问你的名字是？"
                state_changes["visit_count"] = 1 # 记录第一次访问
            else:
                # 用户已经回答了名字
                user_name_from_input = user_input # 简化处理，假设用户直接回答了名字
                response_text = f"很高兴认识你, {user_name_from_input}!"
                state_changes["user_name"] = user_name_from_input
                state_changes["visit_count"] = 1 # 重置为正式的第一次

        # *** 核心步骤: 构建 Event ***
        # 我们将“意图”（回复内容）和“副作用”（状态变更）打包到同一个 Event 中
        yield Event(
            author=self.name,
            content=EventContent(parts=[EventPart(text=response_text)]),
            actions=EventActions(state_delta=state_changes),
            turn_complete=True,
        )

```

#### 2. 运行智能体并观察 Events

现在，我们模拟一下 `Runner` 和 `SessionService` 的工作，看看 `Event` 是如何流转的。

**第一次交互**

1.  **用户输入:**

    ```
    (Input) -> Event(author="user", content={"parts": [{"text": "你好"}]})
    ```

2.  **`GreeterAgent` 处理:**

    - `context.state` 为空。`user_name` 是 `None`，`visit_count` 是 `0`。
    - 进入 `if user_name:` 的 `else` 分支。
    - `visit_count == 0` 为 `True`。
    - `response_text` = "你好! 我是 GreeterAgent。请问你的名字是？"
    - `state_changes` = `{"visit_count": 1}`
    - `yield` 一个新的 `Event`。

3.  **Agent 输出的 Event (飞行记录 #1):**
    ```json
    {
      "author": "GreeterAgent",
      "content": {
        "parts": [{ "text": "你好! 我是 GreeterAgent。请问你的名字是？" }]
      },
      "actions": {
        "state_delta": { "visit_count": 1 }
      },
      "turn_complete": true
    }
    ```
    > `SessionService` 收到此 `Event` 后，会**原子性地**将 `{"visit_count": 1}` 应用到会话状态，并把这个 `Event` 存入历史记录。

**第二次交互**

1.  **用户输入:**

    ```
    (Input) -> Event(author="user", content={"parts": [{"text": "我叫小明"}]})
    ```

2.  **`GreeterAgent` 处理:**

    - `SessionService` 提供了最新的状态：`context.state` 是 `{"visit_count": 1}`。
    - `user_name` 仍然是 `None`。
    - 进入 `if user_name:` 的 `else` 分支。
    - `visit_count == 0` 为 `False`。
    - 进入第二个 `else`，处理用户对名字的回答。
    - `response_text` = "很高兴认识你, 小明!"
    - `state_changes` = `{"user_name": "小明", "visit_count": 1}`
    - `yield` 一个新的 `Event`。

3.  **Agent 输出的 Event (飞行记录 #2):**
    ```json
    {
      "author": "GreeterAgent",
      "content": {
        "parts": [{ "text": "很高兴认识你, 小明!" }]
      },
      "actions": {
        "state_delta": {
          "user_name": "小明",
          "visit_count": 1
        }
      },
      "turn_complete": true
    }
    ```
    > `SessionService` 再次收到此 `Event`，原子性地将 `state_delta` 合并到状态中。现在的状态是 `{"user_name": "小明", "visit_count": 1}`。

**第三次交互**

1.  **用户输入:**

    ```
    (Input) -> Event(author="user", content={"parts": [{"text": "又见面了"}]})
    ```

2.  **`GreeterAgent` 处理:**

    - `SessionService` 提供了最新状态: `{"user_name": "小明", "visit_count": 1}`。
    - `user_name` 是 `"小明"`。
    - 进入 `if user_name:` 的 `True` 分支。
    - `new_visit_count` = 1 + 1 = 2。
    - `response_text` = "你好, 小明! 这是我们第 2 次见面了。"
    - `state_changes` = `{"visit_count": 2}`
    - `yield` 一个新的 `Event`。

3.  **Agent 输出的 Event (飞行记录 #3):**
    ````json
    {
      "author": "GreeterAgent",
      "content": {
        "parts": [{"text": "你好, 小明! 这是我们第 2 次见面了。"}]
      },
      "actions": {
        "state_delta": {"visit_count": 2}
      },
      "turn_complete": true
    }
    ```    > `SessionService` 更新状态为 `{"user_name": "小明", "visit_count": 2}`。
    ````

通过这个简单的例子，您可以看到，`Event` 不仅仅是一条消息。它是一个结构化的、承载着“意图”和“副作用”的原子单元，是整个 ADK 框架健壮、可观测、可扩展的基石。希望这次的深入剖析能帮助您建立对 `Event` 系统的深刻理解，欢迎来到 ADK 的世界！

## 扩展

笔者在阅读完官网这部分文档的时候，想到了领域驱动设计（DDD）中的领域事件（Domain Event），他们之间的精髓是相通的：事件溯源（Event Sourcing）和 CQRS（命令查询责任分离）等相关模式。

在 DDD 中，一个领域事件，它记录了领域中已经发生的、对业务有意义的事情。例如 `OrderPlaced`（订单已下）、`CustomerRelocated`（客户已搬迁）。

这和 ADK 的 `Event` 思想上是一致的：

- **不可变性** (Immutability): 一旦一个 `Event` 被创建并记录下来，它就不能被修改。它代表了一个历史事实。`user_sent_message`, `agent_called_tool`, `tool_returned_result` 都是板上钉钉的历史。
- **都是事实的载体** (Fact Carrier): ADK 的 `Event` 记录了谁（`author`）在什么时间（`timestamp`）做了什么（`content`/`actions`）”。

第二点就是系统的解耦方面，都是使用发布-订阅模式。

在 DDD 中，当一个聚合（Aggregate，如一个订单对象）的状态发生变化时，它会发布一个领域事件。其他关心这个变化的限界上下文（Bounded Context）或聚合可以**订阅**这个事件，并做出相应的反应。

ADK 的**消息总线**模型恰好也是这个思路：

- `LlmAgent` 完成思考后，它发布一个 `function_call` 事件。它不关心谁去执行，怎么执行。
- `ToolExecutor` 订阅了 `function_call` 事件，执行后发布一个 `function_response` 事件。
- `SessionService` 订阅了所有包含 `state_delta` 的事件，并更新状态。

这种模式的好处是完全一样的：给我们开发者带来了极低的耦合度和极高的扩展性。使我们可以随时在总线上增加新的订阅者，来处理日志、监控、错误通知等，而无需改动核心的 Agent 逻辑。

最后一点，就是理解这个：事件溯源，即用事件历史重构当前状态。

在传统的 CRUD 系统中，我们只关心数据的最终状态。比如，用户的账户余额是`$100`。我们不知道这`$100`是怎么来的。

而在事件溯源模式中，我们**不存储最终状态**，而是存储导致该状态的**所有事件的完整序列**。例如，我们会存储：`AccountCreated(balance=0)`, `Deposit(amount=150)`, `Withdrawal(amount=50)`。

当前的状态是通过从头到尾重放（replay）所有历史事件计算出来的。现在回头看 ADK 的设计：

- `session.state` 就相当于那个当前状态。
- `session.events` 列表就是那个完整的事件序列。
- `SessionService` 的核心工作，就是每当接收到一个新的 `Event`，就将其中的 `state_delta` “应用”到当前 `session.state` 上，从而计算出新的当前状态。

这个事件溯源机制，可以带给我们审计日志来详细记录每一次交互和状态变更的来龙去脉。这对于调试、审计和分析用户行为至关重要。我们可以轻易地回溯到历史上的任意一个时间点，查看当时的状态，这对于复现复杂的 Bug 是无价的。

ADK 的 `Event` 系统并不是一个凭空创造的概念，而是将事件溯源这些经过数十年验证的、成熟的企业级软件架构思想，巧妙地应用到了 AI 智能体这个新兴领域。
