---
title: "[Landing日记 MONTH 1]"
description: "Landing日记"
date: "2025-12-03"
tags: ["yzf"]
category: "general"
slug: "landing-1"
published: true
---
我先帮你把这张表里的要求拆解成更清晰的任务，然后结合你现在做的邮寄资料 / 银行回单相关工作，给你一个可执行的学习和实践路线，让你知道“接下来一两个月具体该做什么、怎么做才能对得起自己对自己的要求”。我先把 mentor 的要求用“程序员可执行任务”的方式翻译一下，再给你一套可以落地的行动方案，你可以看下哪些适合现在就做。

---

## 1. 先把表里的要求翻成人话

从图里能看出来，大概分两块：**学习任务** 和 **工作任务**。

### 学习任务

- **授课学堂、部门融入**
    - 目标：
        - 授课内容学完 → 具备入职初期的基本技能。
        - 能够尽快熟悉团队成员、氛围、协作方式。

- **开发环境搭建 / 系统账号申请 / 熟悉系统操作 / 熟悉开发指引和规范**
    - 目标：
        - 能独立搭建 &运行项目。
        - 了解企业内部各种系统账号、权限、使用场景。
        - 熟悉公司内部开发规范，写代码不“出格”。

- **熟悉流程会计相关需求内容、交互、代码**
    - 目标：
        - 看得懂业务流程、需求文档。
        - 能够**在现有需求基础上做简单需求或者改 bug**。

### 工作任务

- **邮寄资料提醒流程会计需求，代码阅读、熟悉**
    - 目标：
        - 能找到这块代码在哪里。
        - 能说清楚关键流程：谁调谁、怎么入库、怎么提醒。
        - 有能力改简单需求 / 修 bug（比如你刚刚查的账期 bug、银行回单链路）。

- **工资确认流程会计需求，代码阅读、熟悉**
    - 目标类似：
        - 能定位工资确认相关模块。
        - 能做小改动和 bug 修复。

---

## 2. 结合你现在的进度，你已经在做什么

从我们刚才一起查 `/mail/mailDataInfo/page`、银行回单资料的代码来看，你**已经在做的，其实就是“邮寄资料提醒流程会计需求”的一部分**：

- 你已经能：
    - 找到 controller（[MailDataInfoController](cci:2://file:///d:/projects/company/process-accounting-payment/pap-application/src/main/java/com/yzf/pap/business/mail/controller/MailDataInfoController.java:55:0-344:1)）。
    - 顺藤摸瓜找到 service / agent / mapper / 下游服务。
    - 读懂一条相对复杂的业务调用链（AI 识别 → 写库 → 银行流水同步）。
- 你开始补单测、看 mentor 要求，说明你希望从“能改代码”提升到“能系统性掌控模块”。

这很符合你说的“对自己有比较高的要求”。

---

## 3. 建议你接下来 1–2 个月的实践路线（踩在 mentor 要求上）

我建议你按**优先级 + 难度阶梯**来：

### 阶段 1：打基础（1–2 周）

- **[学习] 授课学堂 / 内训材料**
    - 把公司统一的培训（技术栈、业务背景）过一遍，边看边记：
        - 系统有哪些：比如 process-accounting-payment、relation-query、fund、consultant 等。
        - 每个系统的大致职责一行话写下来。
- **[环境 & 规范]**
    - 总结一份你个人的《项目启动笔记》：
        - 怎么启动本地环境（哪些服务要开、哪些配置要改）。
        - 常用命令：`mvn`、启动配置、调试方式。
        - 规范：命名、异常处理、日志、接口返回结构等。
    - 这个文档可以直接给 mentor 看，体现你是“可维护型选手”。

### 阶段 2：深挖“邮寄资料 / 银行回单”模块（2–3 周）

拿你现在正在看、也刚刚 debug 过的这条链路做主战场：

1. **画一张“邮寄资料 + 银行回单”系统流程图**（非常推荐）
    - 从“客户在群里发票/回单图片”开始，到：
        - 大模型识别 → [MailDataFilesAgentServiceImpl](cci:2://file:///d:/projects/company/process-accounting-payment/pap-application/src/main/java/com/yzf/pap/business/agent/service/impl/MailDataFilesAgentServiceImpl.java:62:0-560:1) → [MailDataFilesServiceImpl](cci:2://file:///d:/projects/company/process-accounting-payment/pap-service/src/main/java/com/yzf/pap/business/mail/service/impl/MailDataFilesServiceImpl.java:49:0-520:1) → 数据入库 → 同步到财云/银行流水系统。
    - 图上标出：
        - 用到的主要类/接口（controller、service、client）。
        - 关键实体：`MailDataInfo`、`MailDataFiles`。
        - 关键状态：`MailFileBizTypeEnum`、`MailFileConfirmStatusEnum` 等。
    - 这张图可以拿给 mentor 过一遍，是非常直观的“我已经熟悉这个模块”的证据。

2. **做 2–3 个“小型实战任务”**
    - 例子（你可以跟 mentor 认领类似的）：
        - 修复/确认一个和邮寄资料相关的 bug（比如你刚分析的账期筛选问题，虽然逻辑在别的服务里，但你可以提出合理的分析和修改建议）。
        - 在不影响线上逻辑的前提下，加 1–2 个单测用例覆盖关键链路（你已经在做）。
        - 做一个很小的显示优化，比如在分页接口结果中增加一个简单字段的组装（例如补一个银行回单数量统计字段），从接口到前端联调完整走一遍。

3. **为“银行回单资料”写一页“模块说明”**
    - 内容可以是：
        - 银行回单 / 对账单在 `MailFileBizTypeEnum` 中的定义。
        - 一个银行回单从上传 → 识别 → 入库 → 同步到银行流水系统的过程。
        - 常见问题：比如没有银行账号、账号匹配不上时会发生什么。
    - 这份说明不仅是你自己的复盘，也方便之后 onboarding 新人时复用（mentor 一般会很认可这一点）。

### 阶段 3：扩展到“工资确认流程”等其他模块（后续 3–4 周）

等邮寄资料这块比较熟之后，再迁移你的方法到**工资确认流程**：

- 找到对应模块（controller + service + listener）；
- 按同样套路：
    - 画流程图；
    - 写 1 页模块说明；
    - 认领 1–2 个小需求/bug。

---

## 4. 如何体现“对自己有高要求”，又不把自己压垮

给你几个落地的小技巧：

- **所有看过的需求 / 模块，都写“自己的笔记版”**  
  不求漂亮，但要能在两个月后还看得懂。这样你的成长会是“可积累”的，不是看完就忘。
- **给自己设“小交付物”**  
  比如：
    - 本周目标：搞明白银行回单从群聊到入库的完整链路，并画出流程图。
    - 下周目标：把 `/mail/mailDataInfo/page` 相关的单测、日志补齐，并写清楚账期 bug 的原因和建议修改点。
- **主动和 mentor 对齐**
    - 把你画的图、写的说明、修的 bug 小结一下发给 mentor：
        - “本周我在邮寄资料 / 银行回单模块做了这些事，有没有哪里你建议我再深入一下？”

---

## 5. 如果你愿意，我可以帮你做两件具体的事

- **一起梳理“银行回单流程图”：**  
  你可以先简单说一下：从哪里触发（例如聊天机器人、上传接口），我帮你用当前代码把完整时序图/步骤列出来，你再画图或文档。
- **根据你这张 mentor 表，做一份“个人阶段目标 & 打卡表”：**  
  用很简单的清单方式，把“学习任务”和“工作任务”拆成可勾选的 item，你每周自评一次。

你可以先告诉我：  
你最想先攻克的是哪一块？是“完全搞懂邮寄资料/银行回单模块”，还是想先把“公司开发规范 & 项目启动流程”梳理清楚？我可以按你选的方向先帮你细化一个本周计划。




### 修复问题：循环内写SQL

```java
    private void updateReplyFlagIfNeeded(final List<MsgSendDetail> details) {
    for (MsgSendDetail d : details) {
        if (Objects.equals(d.getReply(), 0)) {
            d.setReply(1);
            msgSendDetailMapper.updateById(d);
        }
    }
}
```


这段代码的作用是：遍历消息列表，将其中“未回复”（reply=0）的消息状态更改为“已回复”（reply=1），并逐条同步到数据库。


如果 `details` 列表中有 N 条数据需要更新，数据库将会执行 N 次如下 SQL：

```sql
UPDATE msg_send_detail 
SET reply = 1, ... (MyBatis-Plus 默认可能更新非空字段或所有字段) 
WHERE id = 1001;

UPDATE msg_send_detail 
SET reply = 1, ... 
WHERE id = 1002;

-- ... 重复 N 次
```


这段代码存在典型的 **循环内数据库操作** 问题。

如果 `details` 列表包含 100 条数据，代码就会向数据库发起 100 次独立的网络请求（I/O 操作）。
后果：
    1.  极慢：网络延迟（RTT）会被放大 N 倍。如果一次数据库往返需要 5ms，100 条就需要 500ms（还不算执行时间）。
    2.  连接池耗尽：如果并发量大，这种操作会迅速占用数据库连接池，导致其他业务请求阻塞。
    3.  事务风险：如果在第 50 条更新时失败抛出异常，除非外层加了 `@Transactional`，否则前 49 条变成了“已回复”，后 50 条还是“未回复”，数据不一致。

既然是基于 MP 开发，可以利用 `LambdaUpdateWrapper` 将 N 次更新合并为 **1 次 SQL 操作**。


```java
private void updateReplyFlagIfNeeded(final List<MsgSendDetail> details) {
    // 1. 筛选出需要更新的 ID 列表 (reply == 0 的记录)
    List<Long> idsToUpdate = details.stream()
        .filter(d -> Objects.equals(d.getReply(), 0))
        .map(MsgSendDetail::getId)
        .collect(Collectors.toList());

    // 2. 如果没有需要更新的数据，直接返回
    if (idsToUpdate.isEmpty()) {
        return;
    }

    // 3. 批量更新：一次 SQL 更新所有 ID
    // 逻辑：UPDATE msg_send_detail SET reply = 1 WHERE id IN (..., ...)
    LambdaUpdateWrapper<MsgSendDetail> updateWrapper = new LambdaUpdateWrapper<>();
    updateWrapper.in(MsgSendDetail::getId, idsToUpdate)
                 .set(MsgSendDetail::getReply, 1); // 强制设置 reply = 1

    msgSendDetailMapper.update(null, updateWrapper);
}
```

优化后的 SQL，无论列表有多少条数据，数据库只执行**一条** SQL：

```sql
UPDATE msg_send_detail 
SET reply = 1 
WHERE id IN (1001, 1002, 1003, ...);
```


* **原有写法**：逻辑正确，但**性能极差**，适合数据量极小（\<5条）的场景。
* **推荐写法**：先收集 ID，再使用 `update ... where id in (...)` 批量更新。这是高并发、高性能系统的标准写法。