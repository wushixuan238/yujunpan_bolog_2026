


2025.10 月，Anthropic 发布了 Agent Skills，旨在将重复性工作流程打包成可复用的指令，让 Agent 能自动、可靠地完成任务，无需每次都重复提醒。



### 实操指南

#### 1. 什么是 Agent Skill？
简单来说，它就是一个 Markdown 文件（`SKILL.md`），用来教会 Claude 如何按照我们指定的格式、工具或标准来完成特定任务。





#### 2. 技能文件的结构
一个标准的技能包需要包含一个 `SKILL.md` 文件。

**文件内容示例 (`SKILL.md`):**
```markdown
---
name: my-skill-name
description: 这里写清楚技能是干嘛的，以及在什么场景下应该被触发。（关键！Claude 靠这个决定是否使用它）
allowed-tools: Read, Grep (可选：限制该技能只能使用哪些工具)
---
# 技能名称
## 指令 (Instructions)
这里写详细的 Prompt，告诉 Claude 第一步做什么，第二步做什么。

## 示例 (Examples)
提供具体的输入输出案例，让 Claude 照猫画虎（Few-shot prompting）。
```

#### 3. 如何创建与使用
1.  **创建目录**：
    *   个人通用技能：`mkdir -p ~/.claude/skills/generate-commit-msg`
    *   项目专用技能：在项目根目录下建 `.claude/skills/lint-check`
2.  **编写规则**：在刚才的目录里创建 `SKILL.md`，填入 YAML 头信息和 Markdown 正文。
3.  **触发使用**：
    *   重启 Claude Code（以加载新技能）。
    *   使用自然语言提问（命中 `description` 中的意图）。
    *   Claude 会自动识别意图，加载技能，并按规矩办事。

#### 4. 最佳实践 (避坑指南)
*   描述要写好：`description` 字段不要写得太抽象，要包含用户自然对话中会用到的关键词（例如写“用于 PR 代码审查”比写“PR 助手”更容易被准确触发）。
*   渐进式披露 (Progressive Disclosure)：如果规则很复杂，不要把几千字都塞进 `SKILL.md`。应该建立 `reference.md` 或 `examples.md`，然后在主文件中引用它们。Claude 只有在觉得“信息不够”时才会去读取这些外部文件，从而节省 Token。
*   利用脚本：你可以在技能目录下建一个 `scripts/` 文件夹，放入 Python 或 Bash 脚本。Claude 可以直接调用这些脚本来处理数据或验证结果，而不需要把脚本源码读到上下文中（Token 友好型操作）。



### **输入 (原始信息)**
*   **来源**: [Claude Code Docs: Agent Skills](https://code.claude.com/docs/en/skills)
*   **核心主题**: 技能的定义、`SKILL.md` 文件结构、基于语义的自动触发机制、存储路径、YAML 配置以及“渐进式披露”的最佳实践。

---

### **洞察 (核心逻辑)**
**Agent Skills** 的本质是一次**交互范式的转变**：从“显式编写 Prompt”转向“环境上下文植入”。你不再需要每次都把规则粘贴到聊天框里，而是将指令、参考资料和工具链直接“挂载”到 Claude 的工作环境中。

1.  **触发机制是“语义化”的 (Semantic Triggering)**：
    *   传统的 CLI 工具依赖死板的“斜杠命令”（如 `/help`）。
    *   Claude 的技能则是**模型驱动**的。它会实时扫描你的对话内容，将其与所有可用技能的 `description`（描述字段）进行语义匹配。
    *   *例子*：你不需要输入 `/debug`，只要在对话中问“为什么这段代码报错了？”，如果存在一个描述为“解释代码 Bug”的技能，Claude 就会自动激活它。

2.  **渐进式加载 (Progressive Loading)**：
    *   为了节省 Token（上下文窗口），Claude 初始化时**只加载技能的名称和描述**。
    *   只有当技能被真正触发时，它才会读取完整的 `SKILL.md` 指令内容。这是一种非常高效的资源管理策略。

3.  **上下文层级 (Hierarchy of Context)**：
    *   技能可以在不同层级定义，形成规则的继承与覆盖：
        *   **全局/企业级**：公司统一的代码规范。
        *   **个人级** (`~/.claude/skills`)：你自己独有的工作流偏好。
        *   **项目级** (`.claude/skills`)：特定仓库的特殊规则（如特定项目的 Lint 配置）。

---

