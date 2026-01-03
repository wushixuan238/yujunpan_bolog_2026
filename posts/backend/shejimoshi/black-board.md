---
title: "黑板模式（Blackboard Design Pattern）"
description: "设计模式"
date: "2025-11-12"
tags: ["design-pattern"]
category: "general"
slug: "blackboard-design-pattern"
published: true
---

黑板模式（Blackboard Design Pattern），通常对外表现为数据存储类。但其实是一种处理复杂、非确定性问题的协作架构风格。


为了解释清楚黑板模式，专家通常会使用“谋杀案谜题”或“医生会诊”的隐喻：

想象一群不同领域的专家（指纹专家、弹道专家、心理侧写师）在一个房间里试图破案。
1.  黑板（The Blackboard）：房间中央有一块巨大的黑板。目前已知的所有线索（受害者照片、时间、地点）都贴在上面。
2.  知识源（Knowledge Sources / KS）：就是那些专家。他们**互不交谈**，只看黑板。
    * 指纹专家看到黑板上有了凶器，就走上去，对比指纹，把嫌疑人A的名字写在黑板上，然后坐下。
    * 心理侧写师看到嫌疑人A上榜，走上去分析其动机，写下作案可能性高，然后坐下。
3.  控制组件（Control Shell）：会议主持人。他决定谁什么时候可以走上去写字（调度策略）。


---

### 二、 专家视角：为什么要用它？（The Why）

如果我看到你在做 AI Agent 或者复杂的规则引擎，我会大力支持你使用黑板模式，理由如下：

#### 1. 应对“非确定性” (Handling Non-determinism)
这是黑板模式诞生的初衷。在 AI 流程中，你往往不知道第一步的结果是什么。
* *传统流程*：输入 -> A -> B -> 输出（线性，死板）。
* *黑板流程*：A 算出结果写在黑板上，B 看到黑板有了数据才触发，或者 C 看到数据发现不对将其修正。**解决方案是“涌现”出来的，而不是预先写死的。**

#### 2. 极致解耦 (Extreme Decoupling)
在你的代码中，`IntentionLLmNode` 不需要知道 `JudgeLLmNode` 的存在。它们只需要约定好在 `CustomerProcessContext` 里读写什么字段。
这使得你可以随时新增一个“风险控制专家（RiskControlNode）”，只要它能读懂黑板上的数据即可，无需修改其他节点的代码。

#### 3. 支持异构系统 (Heterogeneity)
黑板模式允许“专家”是完全不同的物种。
* 专家 A 可以是 Java 写的正则匹配。
* 专家 B 可以是 Python 写的神经网络。
* 专家 C 可以是调用 OpenAI 的 API。
  只要他们都能往黑板（Context）上写字，系统就能跑通。

---

### 三、 专家视角的批评：黑板模式的“阴暗面”

虽然黑板模式在 Agent 领域复兴了，但作为架构师，我必须警告你它带来的**工程噩梦**（这也是你当前代码展现出的风险）：

#### 1. “垃圾场”效应 (The Dumpster Fire Anti-pattern)
* **现象**：`CustomerProcessContext` 很容易变成一个巨大的垃圾场。开发人员为了图省事，把所有临时变量、配置、甚至大段的 HTML 都往里塞。
* **专家批评**：你代码中的 `CustomerProcessContext` 已经有这个苗头了。字段之间没有逻辑分组，且全都急切初始化。
* **后果**：这个类会变得几千行长，没人敢删里面的字段，因为不知道哪个犄角旮旯的节点在用它。

#### 2. 状态变更的不可追踪性 (Traceability Hell)
* **现象**：黑板上的数据变了，但不知道是谁改的。
* **场景**：`intention` 字段本来是 "REFUND"（退款），突然变成了 "COMPLAINT"（投诉）。是意图识别改的？还是裁判节点改的？还是预处理改的？
* **专家建议**：工业级的黑板模式通常要求**Blackboard 提供审计日志（Audit Trail）**。
    * *Bad:* `context.setIntent("REFUND")`
    * *Good:* `context.write("intent", "REFUND", source="IntentionNode")`

#### 3. 并发噩梦 (Concurrency Issues)
* **现象**：如果你的流程是并行的（例如同时调用 Google 搜索和 内部数据库检索），两个节点同时试图修改 `CustomerProcessContext`。
* **专家批评**：你当前的代码是基于简单的 Getter/Setter，在多线程环境下是不安全的。
* **建议**：使用 `ConcurrentHashMap` 或者通过流程引擎确保同一时间只有一个节点在“写”黑板。

---

### 四、 现代 AI 架构中的进化

如果我们在 2024 年讨论这个问题，我会告诉你：**大模型（LLM）本质上就是一个极其强大的“黑板控制系统”。**

在 LangChain 或 AutoGPT 等框架中：
1.  **Context (黑板)**：包含了历史对话（Memory） + 当前工具执行结果（Observations）。
2.  **LLM (主控)**：它不断地看黑板，决定下一个调用什么工具（Tool/KS）。
3.  **Tools (知识源)**：搜索、计算器、数据库。

**对你代码的终极建议：**

目前的 `CustomerProcessContext` 只是一个**被动的**数据容器（Passive Data Container）。
要升级为**真正的黑板架构**，它应该具备“智能”：

1.  **订阅/发布机制**：节点应该能订阅黑板的变化（例如：“一旦 `intention` 被确认为 `refund`，立刻触发 `FinanceNode`”）。
2.  **数据清理**：黑板应该知道哪些数据是“脏”的，或者过期的。

**总结：**
你的代码正确地使用了黑板模式的**形**（共享上下文），但尚未掌握其**神**（动态调度与解耦）。目前的实现更像是一个**Pipeline Payload（管道载荷）**，而非真正的智能黑板。


-----

### 一、 通俗解释：重案组的白板

想象一个警察局的重案组会议室。

1.  **黑板（Blackboard）**：
    房间正中央有一块巨大的白板。上面贴着嫌疑人照片、作案时间、凶器类型等线索。它是所有信息的**唯一来源**。

2.  **专家（Knowledge Sources / Workers）**：
    房间里坐着一群互不说话的专家：

    * **法医**：只懂验尸。
    * **弹道专家**：只懂枪械。
    * **心理侧写师**：只懂分析动机。
    * **巡警**：只负责根据指示去抓人。

3.  **流程（Controller）**：
    大家盯着白板看，一旦发现自己能处理的信息，就冲上去写下新结论。

    * *步骤1*：白板上出现“子弹壳”。**弹道专家**看到后，上去写：“这是由 Glock 17 手枪发射的”。
    * *步骤2*：**心理侧写师**看到“Glock 17”和“受害者是黑帮”，上去写：“这是仇杀，嫌疑人可能是职业杀手”。
    * *步骤3*：**巡警**看到“职业杀手”，决定去调查城里的黑市名单。

**核心逻辑**：专家们不需要认识彼此（解耦），他们只关心黑板上有没有自己能用的数据。问题是一步步被“凑”出答案的。

-----

### 二、 代码演示：智能写作助手

为了演示，我们写一个简单的 **“AI 文本润色系统”**。
目标：用户输入一句话，系统要自动纠正错别字、润色语气、加标点。

#### 1\. 定义黑板（存放句子的地方）

```java
import java.util.ArrayList;
import java.util.List;

// 这就是那块“白板”
class Blackboard {
    public String sentence;          // 当前的句子
    public List<String> logs = new ArrayList<>(); // 记录谁修改了它

    public Blackboard(String sentence) {
        this.sentence = sentence;
    }

    // 在白板上更新信息
    public void update(String newSentence, String expertName) {
        this.sentence = newSentence;
        this.logs.add(expertName + " 修改成了: " + newSentence);
    }
}
```

#### 2\. 定义专家接口（所有专家的标准）

```java
interface Expert {
    // 我能处理吗？（比如法医看有没有尸体，没尸体就不工作）
    boolean canHandle(Blackboard board);
    
    // 处理逻辑（上去写白板）
    void process(Blackboard board);
}
```

#### 3\. 实现具体的专家（不同的逻辑）

```java
// 专家A：专门负责把“骂人”的话变礼貌
class PoliteExpert implements Expert {
    @Override
    public boolean canHandle(Blackboard board) {
        return board.sentence.contains("滚");
    }

    @Override
    public void process(Blackboard board) {
        String newText = board.sentence.replace("滚", "请离开");
        board.update(newText, "【礼貌专家】");
    }
}

// 专家B：专门负责加句号
class PunctuationExpert implements Expert {
    @Override
    public boolean canHandle(Blackboard board) {
        // 如果最后没有句号，我就要工作
        return !board.sentence.endsWith("。");
    }

    @Override
    public void process(Blackboard board) {
        board.update(board.sentence + "。", "【标点专家】");
    }
}
```

#### 4\. 控制器（主持人）

```java
public class WorkflowController {
    public static void main(String[] args) {
        // 1. 初始化黑板，写上原始线索
        Blackboard board = new Blackboard("你给我滚");

        // 2. 召集专家组
        List<Expert> experts = new ArrayList<>();
        experts.add(new PoliteExpert());
        experts.add(new PunctuationExpert());

        // 3. 循环让专家工作（简单模拟）
        for (Expert expert : experts) {
            if (expert.canHandle(board)) {
                expert.process(board);
            }
        }

        // 4. 查看最终结果
        System.out.println("最终结果: " + board.sentence);
        System.out.println("处理过程: " + board.logs);
    }
}
```

-----

### 三、 运行结果

程序运行后，你会看到这样的输出：

```text
最终结果: 你给我请离开。
处理过程: [
    "【礼貌专家】 修改成了: 你给我请离开", 
    "【标点专家】 修改成了: 你给我请离开。"
]
```

### 四、 总结：为什么要这么写？

如果别人问你这段代码好在哪，你可以这样说：

1.  **各司其职**：`礼貌专家`不需要知道`标点专家`的存在。如果明天老板说要加一个“翻译专家”，我只需要写个新类，完全不用改旧代码。
2.  **动态解决**：问题的解决路径不是写死的。如果输入的句子本来就很礼貌，`礼貌专家`就会自动跳过（`canHandle` 返回 false），只有`标点专家`会工作。
3.  **可扩展性**：这就是现代 AI Agent 的雏形。黑板就是 Context，专家就是各种 Tool 或 LLM 节点。