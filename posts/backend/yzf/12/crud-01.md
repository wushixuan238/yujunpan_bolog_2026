---
title: "N+1查询解决思路"
description: "承接需求的时候遇到的问题"
date: "2025-12-02"
tags: ["backend"]
category: "general"
slug: "12-n+1"
published: true
---

# N+1 查询问题及解决思路

实际业务开发中，我们经常会承接这种需求：**先查一张表，拿到列表后，遍历这个列表，对每一条记录再去查另一张表**，这其实就是“N+1 查询问题”。

## 什么是 N+1 问题？

简单来说，**N+1** 里的：

- **1**：指的是你查询主数据的那**1 次**数据库查询（比如查出了 100 篇文章）。
- **N**：指的是为了补充这些主数据的关联信息（比如作者信息），你不得不执行的**N 次**额外查询。

在代码 Review 中，我最常挂在嘴边的一句话就是：**不要在循环里查数据库！**

最近有位兄弟问我：“老杨，我前端要展示一个文章列表，每个文章要显示作者名字。我先查出文章 List，然后遍历 List，用作者 ID 去查用户表。这算不算 N+1 问题？”

这不仅是算，简直是“N+1”的满分范例。今天我们就来聊聊这个让数据库 DBA 深夜骂娘、让接口响应时间飙升的元凶——N+1 问题。

**场景复现：**

假设你有两张表：

1.  `article`（文章表）：存了 `author_id`。
2.  `user`（用户表）：存了 `id` 和 `name`。

**你现在的写法（伪代码）：**

```java
// 1. 先查出最近的100篇文章（这就是那个 "1"）
List<Article> articles = articleMapper.selectRecentArticles(100);

// 2. 遍历每一篇文章，去补全作者信息
for (Article article : articles) {
    // 每次循环都发一次SQL查询（这就是那个 "N"）
    User author = userMapper.selectById(article.getAuthorId());
    article.setAuthorName(author.getName());
}
```

**后果分析：**
如果 `articles` 有 100 条记录：

- 你总共执行了 **1 + 100 = 101** 次 SQL 查询。
- 每一次数据库查询都涉及：建立连接 -> 发送 SQL -> 数据库解析 -> 检索数据 -> 网络返回。
- 虽然单次查询可能只要 2ms，但 100 次就是 200ms，再加上网络 IO 和连接池开销，原本该在 20ms 内结束的接口，直接变成 500ms+。
- 如果并发量上来，数据库连接池瞬间被耗尽，系统直接瘫痪。

---

## 解决方案：从入门到精通

针对这个问题，我总结了四种常见的解决套路，按推荐程度从低到高（视场景而定）。

### 方案一：SQL Join（最简单，但有局限）

既然数据在两张表里，直接用 SQL 把它们连起来不就完了？

**实现方式：**
修改你的 Mapper XML，使用 `LEFT JOIN`。

```sql
SELECT
    a.id, a.title, a.content, a.author_id,
    u.name as author_name
FROM article a
LEFT JOIN user u ON a.author_id = u.id
WHERE a.status = 1
```

- **优点**：一次 SQL 搞定，数据库层面的效率通常最高。
- **缺点**：
  1.  **数据冗余**：如果是一对多（比如查用户和他的 10 个订单），用户信息会重复返回 10 次，浪费带宽。
  2.  **耦合度高**：MyBatis 中 ResultMap 写起来比较复杂。
  3.  **大厂限制**：很多大厂（如阿里的开发手册）禁止三张表以上的 Join，甚至在微服务架构下，表都不在同一个库，根本 Join 不起来。

**老鸟评价**：小项目、单体应用随便用；大表、分库分表、微服务场景慎用。

---

### 方案二：MyBatis 的 Nested Results（嵌套结果映射）

如果你用的是 MyBatis，可以使用它的高级映射功能，虽然底层原理类似于 Join，但配置更优雅。

**错误配置（会导致 N+1）：**
使用了 `<association select="selectAuthorById">`。如果你配置了 `select` 属性指向另一个查询语句，MyBatis 默认行为（除非开启了延迟加载且没用到属性）往往就会产生 N+1。

**正确配置（使用 Join 思想的 ResultMap）：**

```xml
<resultMap id="ArticleWithAuthorMap" type="ArticleDTO">
    <id property="id" column="id"/>
    <result property="title" column="title"/>
    <!-- 关键点：不要用 select，直接映射 Join 出来的字段 -->
    <association property="author" javaType="UserDTO">
        <id property="id" column="author_id"/>
        <result property="name" column="author_name"/>
    </association>
</resultMap>

<select id="selectArticles" resultMap="ArticleWithAuthorMap">
  SELECT a.*, u.id as author_id, u.name as author_name
  FROM article a
  LEFT JOIN user u ON a.author_id = u.id
</select>
```

**老鸟评价**：这是 MyBatis 处理关联查询的标准做法，本质还是方案一的变体。

---

### 方案三：批量查询 + 内存组装（Java 老鸟最爱，微服务必备）

这是我**强烈推荐**的方案，尤其是当你在做微服务或者追求代码解耦时。

**核心思想：**

1.  先查出所有的文章（1 次查询）。
2.  提取出所有文章中的 `author_id`，去重。
3.  用 `WHERE id IN (...)` 一次性查出所有相关用户（1 次查询）。
4.  在 Java 内存中将用户和文章匹配起来。

**总查询次数：1 + 1 = 2 次。**

**代码实战：**

```java
public List<ArticleDTO> getArticlesWithAuthors() {
    // 1. 第一次查询：查出文章列表
    List<Article> articles = articleMapper.selectList(null);
    if (articles.isEmpty()) return Collections.emptyList();

    // 2. 提取 authorIds (利用 Stream API)
    Set<Long> authorIds = articles.stream()
            .map(Article::getAuthorId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

    // 3. 第二次查询：批量查用户 (注意：如果ID特别多，比如超过1000个，建议分批查)
    List<User> users = userMapper.selectBatchIds(authorIds); // SELECT * FROM user WHERE id IN (...)

    // 4. 内存组装技巧：将用户List转为 Map<Id, User>，方便O(1)查找
    Map<Long, User> userMap = users.stream()
            .collect(Collectors.toMap(User::getId, Function.identity()));

    // 5. 回填数据
    List<ArticleDTO> result = new ArrayList<>();
    for (Article article : articles) {
        ArticleDTO dto = new ArticleDTO();
        BeanUtils.copyProperties(article, dto); // 属性拷贝

        // 从Map中获取，无需查库
        User author = userMap.get(article.getAuthorId());
        if (author != null) {
            dto.setAuthorName(author.getName());
        }
        result.add(dto);
    }

    return result;
}
```

- **优点**：
  - **解耦**：文章表和用户表完全解耦，甚至可以在不同的数据库，甚至是调用远程的用户服务（RPC）。
  - **可控性强**：你可以控制 `IN` 列表的大小，防止 SQL 过长。
  - **缓存友好**：第二步查用户时，完全可以先去 Redis 查，查不到再走数据库。
- **缺点**：代码量稍微多一点。

**老鸟评价**：这是目前互联网大厂的主流写法，兼顾了性能和可维护性。

---

### 方案四：JPA/Hibernate 的 `@BatchSize` 或 `JOIN FETCH`

如果你用的是 JPA (Hibernate)：

1.  **JOIN FETCH**：在 JPQL 中写 `SELECT a FROM Article a JOIN FETCH a.author`。这其实就是方案一，强制生成 Join 语句，避免 N+1。
2.  **@BatchSize**：如果你为了偷懒想保留关联对象的 `getAuthor()` 调用，可以在 User 实体类或者关联字段上加 `@BatchSize(size = 50)`。
    - _原理_：当你遍历文章列表访问 Author 时，Hibernate 不会一条一条查，而是攒够了或者根据 ID 列表生成 `WHERE id IN (?,?,?...)` 这种语句去批量抓取。这其实是方案三的框架自动化版本。

---

## 总结与建议

千万不要觉得“现在数据量少，循环查也没事”。业务增长是很快的，今天的一点技术债，明天就是线上的“CPU 100% 告警”。
