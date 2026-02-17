---
title: '拒绝Hard-coded：用 Spring EL 代替 String.split()'
titleJp: ''
date: '2025-12-02'
excerpt: ''
tags: ["yzf"]
---
# 拒绝 Hard-coded：用 Spring EL 代替 String.split()

## 1. 背景：写死分隔符的年代

在日常后端开发中，我们经常遇到这种需求：把这串逗号分隔的字符串，转成一个 List。

比如 `application.properties` 里有这么一行配置：

```properties
# 允许的文件后缀
app.upload.allowed-extensions=jpg,png,gif,pdf
```

### Java 硬编码

新手或者赶进度的代码通常是这样的：

```java
@Value("${app.upload.allowed-extensions}")
private String allowedExtensionsStr;

private List<String> allowedExtensions;

@PostConstruct
public void init() {
    if (StringUtils.isNotBlank(allowedExtensionsStr)) {
        // 硬编码了逗号，如果运维手抖配成了分号怎么办？
        this.allowedExtensions = Arrays.asList(allowedExtensionsStr.split(","));
    } else {
        this.allowedExtensions = new ArrayList<>();
    }
}
```

缺点是什么？

1.  代码啰嗦：为了转个 List，还得写个 `@PostConstruct` 或者工具类。
2.  不灵活：如果哪天需求变了，配置变成 `jpg|png|gif`，你得改 Java 代码重新发布。
3.  类型转换麻烦：如果配置的是数字 `1,2,3`，你 split 出来是 `String`，还得自己循环转 `Integer`。

---

## ⚡️ 王者写法：Spring EL 一行搞定

Spring Expression Language (SpEL) 是 Spring 框架中被严重低估的神器。我们可以直接在 `@Value` 注解里完成“分割 + 转换”。

### ✅ 场景一：基础分割（Split）

不用写任何 Java 逻辑，Spring 在注入时直接帮你切好：

```java
// 核心：#{...} 是 SpEL 表达式
// '${...}' 是读取配置，.split(',') 是调用 String 的方法
@Value("#{'${app.upload.allowed-extensions}'.split(',')}")
private List<String> allowedExtensions;
```

Spring 会自动把 split 后的数组适配成 List 注入进来。代码极其干净。

### ✅ 场景二：处理空值（防爆）

如果配置文件里没配这行，直接 split 会报空指针？SpEL 支持 Elvis 运算符（`?:`）：

```java
// 如果配置不存在，就给个默认值 'jpg'，然后再 split
@Value("#{'${app.upload.allowed-extensions:jpg}'.split(',')}")
private List<String> allowedExtensions;
```

### ✅ 场景三：自动类型转换（Integer List）

假设配置是 `app.ids=101,102,103`。
传统的 split 出来是 `List<String>`，但我们要 `List<Integer>`。

**SpEL 配合 Spring 的 TypeConverter 自动完成转换：**

```java
@Value("#{'${app.ids}'.split(',')}")
private List<Integer> ids;
```

你没看错，代码不用变。Spring 检测到你的字段类型是 `List<Integer>`，它会自动把 split 出来的字符串数组里的每个元素尝试转成 Integer。如果转不了才会报错。

---

## 进阶玩法：动态逻辑与过滤

SpEL 不仅仅能替代 `split`，它还能做**筛选**。这才是它比 Java 代码硬写 `split` 强大的地方。

### 场景：只要长度大于 3 的后缀

假设配置是 `a,b,jpg,png`，但我代码里只想接收长度大于 3 的项。

```java
// 使用 SpEL 的集合投影与选择功能
// ?[#this.length() > 3] 表示筛选长度大于3的元素
@Value("#{'${app.upload.allowed-extensions}'.split(',').?[#this.length() > 3]}")
private List<String> validExtensions;
```

如果用 Java 写，你需要 Stream API 写好几行：

```java
Arrays.stream(str.split(","))
      .filter(s -> s.length() > 3)
      .collect(Collectors.toList());
```

现在，全部收敛在注解里。

---

## 总结

使用 Spring EL 代替传统的 `String.split()`，本质上是**将过程式代码转化为声明式配置**。

- **Before**: 我要读取配置 -> 我要判断是否为空 -> 我要调用 split -> 我要转 List。
- **After**: 我想要一个 List，来源是这个配置切开后的结果。

**最佳实践建议：**

1.  对于简单的配置列表注入，**无脑使用** `@Value("#{'${...}'.split(',')}")`。
2.  对于复杂的业务字符串解析（比如解析报文协议），还是写在 Java 代码里更好，方便单元测试和调试。

---
