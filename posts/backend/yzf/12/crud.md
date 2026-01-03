---
title: "CRUD"
description: "编程技巧"
date: "2025-12-08"
tags: ["yzf"]
category: "general"
slug: "12-crud-0"
published: true
---



### 1\. 核心逻辑：强制条件 + 可选条件

这段代码的设计非常有意思，它不是那种“你想查啥就查啥”的开放式查询，而是有**门槛**的。

#### A. 门票（强制条件）：`relId`

```java
if (Objects.isNull(queryParam) || Objects.isNull(queryParam.getRelId())) {
    return new ArrayList<>();
}
queryWrapper.eq(MailDataFiles::getRelId, queryParam.getRelId());
```

* **解读**：这是**死命令**。
* **含义**：不管你后面传了什么文件名、什么类型，**如果前端没传 `relId`（关联ID），整个查询直接短路，返回空列表**，甚至都不去查数据库。
* **业务场景猜测**：这说明这些文件是**从属于**某个具体的业务单据（比如一个具体的“邮寄单”或者“项目”）。**系统不允许你进行全库文件的“大海捞针”**，你必须先进入某个单据，才能在单据内部搜索文件。

#### B. 搜索（可选条件）：`fileName`

```java
if (StringUtils.isNotBlank(queryParam.getFileName())) {
    queryWrapper.like(MailDataFiles::getFileName, queryParam.getFileName());
}
```

* **解读**：通常用于模糊词搜索的条件查询。
* **方式**：`like`。在 MyBatis-Plus 中，默认是 `LIKE '%值%'`（全模糊匹配）。只要文件名里包含你输入的字，都能查出来。

#### C. 筛选（可选条件）：`fileBizType` & `confirmStatus`

```java
if (Objects.nonNull(queryParam.getFileBizType())) {
    queryWrapper.eq(MailDataFiles::getFileBizType, queryParam.getFileBizType());
}
// ... confirmStatus 同理
```

* 解读：精确匹配 (`eq`)。通常用于下拉框筛选，比如只看“发票”类型，或者只看“待确认”的文件。

> 一句话，下拉框筛选和模糊查询在我们企业开发中的查询接口是必须要支持的，依托两个东西：`like`和`eq`。

-----

### 2\. 老鸟视角的“避坑指南”

虽然这段代码逻辑很清晰，但在实际测试或使用接口时，你极容易遇到以下 2 个问题：

#### 坑一：为什么我搜了文件名，却返回空？

* **现象**：你知道数据库里有个文件叫 `invoice.pdf`，你在搜索框输入 "invoice"，点击查询，结果列表是空的。
* **原因**：**你的 `queryParam` 里漏传了 `relId`**。
* **排查**：很多新手在做测试（用 Postman 或 Swagger）时，只填了 `fileName`，觉得这就够了。但看着这段代码的第一行：`if (... getRelId() == null) return ...`，你就知道为什么不行了。**必须先指定“在哪条单据里搜”。**

#### 坑二：索引失效风险

* **代码**：`queryWrapper.like(...)`
* **原理**：`LIKE '%abc%'` 这种左边带 `%` 的模糊查询，在 MySQL 中通常**无法利用索引**（除非用覆盖索引等特殊情况），会导致全表扫描（或者全`relId`范围扫描）。
* **老鸟评估**：如果单个 `relId` 下的文件数量不多（比如几十个），那完全没问题，性能忽略不计。但如果一个 `relId` 关联了上万个文件，这个模糊搜索可能会慢。

