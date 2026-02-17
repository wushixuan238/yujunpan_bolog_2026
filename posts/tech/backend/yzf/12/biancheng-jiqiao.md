---
title: 'Programming skills'
titleJp: ''
date: '2025-12-03'
excerpt: ''
tags: ["backend"]
---
## Yoda conditions

> wiki : https://en.wikipedia.org/wiki/Yoda_conditions

尤达条件式：把常量放在等号左边。


* 普通写法：`if (value.equals("constant"))` -\> 如果 value 是 null，崩。
* 开发写法：`if ("constant".equals(value))` -\> 就算 value 是 null，也只返回 false，安全。

同理，`Boolean.TRUE.equals(...)` 就是利用了**已知的非空对象去比较未知的对象**。


### 定义布尔类型变量

这是一个非常经典的Java开发规范问题。在定义 `boolean/Boolean` 类型变量时，**强烈建议遵循《阿里巴巴Java开发手册》的强制规定**。

根据 Java Bean 规范和 Lombok 的生成规则，**POJO 类中的布尔变量名称不应该以 `is` 开头**。

**❌ 错误写法:**
```java
private Boolean isManual = false;
```

**✅ 推荐写法 (标准写法):**
```java
private Boolean manual = false;  // 去掉 is
private Boolean closed = false;  // 建议用形容词或过去分词，如 closed 而不是 close
```

为什么要这样写？(坑在哪里)

如果你使用了 Lombok (`@Data`) 配合 Jackson (Spring Boot 默认 JSON 序列化库)，`is` 开头的变量会引发**序列化字段名不一致**的问题。

假设你定义了 `private Boolean isManual;`

1.  Lombok 的行为：
    *   对于 Wrapper (`Boolean`) 类型，Lombok 会生成 `getIsManual()`。
    *   对于 Primitive (`boolean`) 类型，Lombok 会生成 `isManual()`。

2.  Jackson (JSON) 的行为：
    *   它通过 getter 方法反推 JSON 字段名。
    *   看到 `getIsManual()` -> 推断字段名为 `isManual` (通常没问题)。
    *   看到 `isManual()` -> 根据 Java Bean 规范，它认为字段名是 `manual` (注意：`is` 被截断了)。


前端可能会收到 `{ "manual": true }` 而不是 `{ "isManual": true }`，或者导致后端接收不到前端传来的 `isManual` 参数，导致 `null` 指针异常。

为了避免上述歧义，并符合规范，建议修改如下：

```java
/**
 * 变量名：manual
 * Lombok 生成：getManual() / setManual()
 * JSON 序列化：manual
 */
@Schema(name = "是否人工回复")
private Boolean manual = false;
/**
 * 建议改名为 closed (已关闭) 或 finished，语义更通顺
 */
@Schema(name = "是否关闭任务")
private Boolean closed = false; 
}
```

---

### 4. 如果必须保留 JSON 中的 "is" 前缀怎么办？

如果你的前端已经定好了接口文档，必须传 `isManual`，或者数据库字段就是 `is_manual`，你有两种处理方式：

#### 方式 A：标准做法 (变量名去is，注解加is) —— **推荐**
保持 Java 变量名规范，利用 Jackson 注解控制序列化名称。

```java
@Schema(name = "是否人工回复")
@JsonProperty("isManual") // 指定 JSON 字段名为 isManual
private Boolean manual = false;
```

#### 方式 B：为了兼容旧代码 (不推荐，但能用)
如果你非要用 `isManual` 作为变量名，必须手动处理 Lombok 可能产生的 getter 问题（或者信赖当前版本的 Jackson 足够智能），
最稳妥的方式是把 Wrapper 类型改成 Primitive 类型时要格外小心。

但在 Spring Boot + Lombok 环境下，最稳的还是 **"变量名去 is"**。

关于使用 `Boolean` 还是 `boolean`。代码中使用的是包装类 `Boolean` 并赋值了默认值 `false`。

*   推荐使用 `Boolean` (包装类)：在 RPC 接口、数据库实体（Entity）中，推荐使用包装类。因为 `null` 可以表示“未设置”或“未知状态”，而 `false` 表示明确的“否”。
*   关于默认值：如果你在定义时写了 `= false`，那其实和 `boolean` 基本类型在使用上区别不大了（都不会为 null），但在序列化时会稍微多占一点点内存。通常 DTO/VO 对象可以给默认值以防止空指针。

### 集合列表判空

通常项目中都会引入 `org.springframework.util.CollectionUtils` 或 `org.apache.commons.collections4.CollectionUtils`。
如果项目里没有，可以用原生写法替代：
```java
if (list == null || list.isEmpty()) { 
    // ... 报错
}
```

### 3\. 等价的另一种优雅写法

如果你觉得 `Boolean.TRUE.equals(...)` 写起来太长，Apache Commons Lang 工具包或者 Hutool 工具包里通常有这种简写，效果是一样的：

```java
// 如果用了 org.apache.commons.lang3.BooleanUtils
if (BooleanUtils.isTrue(msgSendResult.getSendResult())) {
    // ...
}

// 源码
public static boolean isTrue(Boolean bool) {
    return Boolean.TRUE.equals(bool);
}
```

### 确立交互即留痕的工程规范，通过数据库持久化与运行时日志的双重记录，消除大模型黑盒带来的调试盲区。

### 一定不要在循环内操作数据库


### 将复杂的业务委托给规则引擎是好的设计

### 不要用正则解析 JSON！不要用正则解析 JSON！

既然都已经引入了 JSON 库（FastJson 或 Jackson），为什么不直接反序列化成一个对象呢。

# HTTP调用

弃用手写的 `HttpUtils` 改用 OpenFeign（或者其他声明式客户端）确实是行业共识。

### 日期API

不使用过时的日期 API

现在是 2024 年了，还在用 `new Date()`？”

`new Date()` 线程不安全且 API 设计糟糕。 应该使用 `LocalDateTime.now()`。


```java

DateUtil.format(new Date(), "yyyy-MM-dd HH:mm:ss");

// [优化] 使用 LocalDateTime
LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));


```


### 避免硬编码

任何代码中硬编码字符串比如 "工资变动" 的代码，都可以通过建立一个枚举类（Enum）或常量类（Constants），例如 `TaskTypeEnum.SALARY_CHANGE.getDesc()`，
这样如果数据库里的类型名称变了，只需要改一处代码，而不要到处都修改。

### 判断

`mergedChats == null` 换成 `CollectionUtils.isEmpty(mergedChats)` 或 `Objects.isNull(mergedChats)`

`mergedChats != null` 换成  `Objects.nonNull(mergedChats)` 

Java 领域的圣经 《Effective Java》 (Joshua Bloch) 第 54 条明确指出：

"Return empty collections or arrays, not nulls" （返回空集合或空数组，不要返回 null）

### 实战

```java

// 判断用户回复内容是否包含附件（工资表表格），是则直接解析
List<ChatDataDTO> chatDataList = gzbdHandleMsgService.getChatDataList(chatMessageRequest);
            if (Objects.nonNull(chatDataList)) {
        log.info("用户回复包含附件，开始解析 req:{}, chatDataList:{}", chatMessageRequest, chatDataList);
                for (ChatDataDTO chatDataDTO : chatDataList) {
        gzbdHandleMsgService.parseGzTable(chatMessageRequest, chatDataDTO);
                }
                        return;
                        }

    public List<ChatDataDTO> getChatDataList(ChatMessageRequest req) {
    List<IntentChatRecordSplitVO> split = safeParseResult(() ->
            intentRecognitionClient.findChatRecordSplitById(req.getMessageIds()), "查询分割消息失败", req);
    Optional<IntentChatRecordSplitVO> containsFile = split.stream().filter(v -> v.getContentSplit() != null && v.getContentSplit().contains("-file:ae65t")).findFirst();
    if (containsFile.isPresent()) {
        List<Long> contantOriginalIds = JSONObject.parseArray(containsFile.get().getContentOriginalId()).stream().map(v -> Long.valueOf(v.toString())).collect(Collectors.toList());
        WeworkChatDataQueryReq chatDataQueryReq = new WeworkChatDataQueryReq();
        chatDataQueryReq.setChatDataIdList(contantOriginalIds);
        List<ChatDataDTO> chatDataDTOS = AjaxResultUtil.parseResult(weworkChatDataClient.queryChatData(chatDataQueryReq));
        if (CollectionUtils.isEmpty(chatDataDTOS)) {
            log.info("获取附件对应原句内容失败 req:{}, contantOriginalIds:{}", req, contantOriginalIds);
            return null;
        }
        List<ChatDataDTO> fileDataList = chatDataDTOS.stream().filter(v -> "file".equalsIgnoreCase(v.getMsgType())).collect(Collectors.toList());
        if (CollectionUtils.isEmpty(fileDataList)) {
            log.info("找不到附件内容 req:{}, fileDataList:{}", req, fileDataList);
            return null;
        }
        return fileDataList;
    } else {
        return null;
    }
}
```

根据《Effective Java》第 54 条原则，我们需要确保 **无论发生什么情况（找不到数据、出错、逻辑不匹配），方法都只返回一个空的 List，而不是 `null`**。

这将彻底改变调用方的编码方式，使其更安全、更简洁。

以下是具体的修改方案，分为 **被调用方（Provider）** 和 **调用方（Consumer）** 两部分。

### 第一部分：修改被调用方 (`getChatDataList`)

你需要修改 **4 个地方**，将所有的 `return null` 替换为 `return Collections.emptyList()`，同时要做好入参的防御。

```java
public List<ChatDataDTO> getChatDataList(ChatMessageRequest req) {
    // 1. [防御性修改] 防止 safeParseResult 返回 null 导致 split.stream() 报空指针
    List<IntentChatRecordSplitVO> split = safeParseResult(() ->
            intentRecognitionClient.findChatRecordSplitById(req.getMessageIds()), "查询分割消息失败", req);
    
    // 如果 split 是 null 或空，直接返回空集合
    if (CollectionUtils.isEmpty(split)) {
        return Collections.emptyList(); // <--- 修改点 1
    }

    // ... 中间查找逻辑保持不变 ...
    Optional<IntentChatRecordSplitVO> containsFile = split.stream()
            .filter(v -> v.getContentSplit() != null && v.getContentSplit().contains("-file:ae65t"))
            .findFirst();

    if (containsFile.isPresent()) {
        // ... 解析 ID 逻辑 ...
        List<Long> contantOriginalIds = ...; // 省略中间代码

        // ... 查询企微接口 ...
        List<ChatDataDTO> chatDataDTOS = AjaxResultUtil.parseResult(...);

        // 2. [修改点] 查询结果为空
        if (CollectionUtils.isEmpty(chatDataDTOS)) {
            log.info("获取附件对应原句内容失败 req:{}, contantOriginalIds:{}", req, contantOriginalIds);
            return Collections.emptyList(); // <--- 修改点 2 (原为 return null)
        }

        List<ChatDataDTO> fileDataList = chatDataDTOS.stream()
                .filter(v -> "file".equalsIgnoreCase(v.getMsgType()))
                .collect(Collectors.toList());

        // 3. [修改点] 过滤后没有文件类型
        if (CollectionUtils.isEmpty(fileDataList)) {
            log.info("找不到附件内容 req:{}, fileDataList:{}", req, fileDataList);
            return Collections.emptyList(); // <--- 修改点 3 (原为 return null)
        }

        return fileDataList;
    } 
    
    // 4. [修改点] 根本没找到包含 "-file:ae65t" 的记录
    // 原来的 else { return null; } 可以直接省略，在最后统一返回
    return Collections.emptyList(); // <--- 修改点 4 (原为 return null)
}
```

-----

### 第二部分：修改调用方 (The Caller)

因为 `getChatDataList` **永远不会返回 null** 了，所以调用方的 `if (chatDataList != null)` 判断就变成了废话（永远为 true）。

你需要将其改为判断 **“集合是否有内容”**。

```java
// 调用方法
List<ChatDataDTO> chatDataList = gzbdHandleMsgService.getChatDataList(chatMessageRequest);

// [修改前] 
// if (chatDataList != null) { ... } 
// 这种写法现在虽然不会报错，但逻辑上不严谨，因为空列表也会进入 if 块

// [修改后] 使用 CollectionUtils.isNotEmpty 或者 !list.isEmpty()
if (CollectionUtils.isNotEmpty(chatDataList)) {
    log.info("用户回复包含附件，开始解析 req:{}, chatDataList:{}", chatMessageRequest, chatDataList);
    for (ChatDataDTO chatDataDTO : chatDataList) {
        gzbdHandleMsgService.parseGzTable(chatMessageRequest, chatDataDTO);
    }
    return;
}
```

### 总结修改带来的好处

1.  **消除 NPE 风险**：调用方不再需要担心忘记判空而导致 `NullPointerException`。
2.  **代码更语义化**：调用方只关心“有没有数据”（IsEmpty），而不是“对象存不存在”（IsNull）。
3.  **遵循标准**：这是 Java 社区公认的最佳实践。

### [进阶] 顺手修复那个“拼写错误”和“魔法值”

如果你想让代码更完美，建议顺便把这两个刺眼的瑕疵改掉：

1.  `contantOriginalIds` -\> `contentOriginalIds` (Content 不是 Contant)
2.  `"-file:ae65t"` -\> 提取为常量 `private static final String FILE_TAG = "-file:ae65t";`