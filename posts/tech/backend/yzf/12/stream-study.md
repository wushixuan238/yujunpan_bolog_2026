---
title: 'Stream 流实战素材'
titleJp: ''
date: '2025-12-04'
excerpt: ''
tags: ["yzf"]
---
我们在做数据同步时，经常遇到这样的场景：

* 拿到一堆聊天记录对象。
* 有些记录里包含文件附件（而且是 JSON 格式的字符串）。
* 我们需要把这些文件 ID 抠出来，去数据库查重，然后只处理新文件。

如果不成 Stream，我们可能需要写三层 `for` 循环。但用了 Stream，逻辑会变得非常清晰。
```java
// 代码片段 1：提取 ID 并扁平化
List<Long> fileContantOriginalIds = allChatsList.stream()
    .filter(x -> !"agent".equals(x.getSpeakerType()) 
            && StringUtils.isNotBlank(x.getContentSplit())
            && x.getContentSplit().contains("-file:ae65t") 
            && StringUtils.isNotBlank(x.getContentOriginalId()))
    .map(a -> {
        // 解析 JSON 数组字符串为 Long 列表
        return JSONObject.parseArray(a.getContentOriginalId().trim())
                .stream()
                .map(v -> Long.valueOf(v.toString()))
                .collect(Collectors.toList());
    })
    .flatMap(List::stream) // 重点在这里！
    .collect(Collectors.toList());
```

-----

### 2. 知识点一：多重条件的 `filter`（过滤器）

**场景**：不是所有聊天记录都有用，我们需要清洗数据。
**知识点**：

* `filter` 接受的是一个 `Predicate`（断言）。
* 实战技巧：不要害怕在 `filter` 中写复杂的 `&&` 逻辑。只要返回 boolean，Stream 都能处理。

* 代码解读：这里通过判断发送者类型、特定标记（`-file:ae65t`）和非空校验，像漏斗一样只留下了包含文件的记录。

-----

### 3\. 知识点二：`map` 与 `flatMap` 的降维打击（核心亮点）

**场景**：最难理解的一步。

* 一条聊天记录 (`ChatRecord`) 可能包含 **多个** 文件 ID（因为 `ContentOriginalId` 是一个 JSON 数组，比如 `"[1001, 1002]"`）。
* 如果我们只用 `map`，我们会得到 `List<List<Long>>`（列表套列表）。
* 但我们想要的是 `List<Long>`（所有 ID 的平铺列表）。

**知识点**：

* **`map` (1对1)**：输入一个对象，输出一个对象。
* **`flatMap` (1对N)**：输入一个对象，输出一个“流”（Stream）。它会将所有产生的小流合并成一个大流。
* **实战解读**：
    1.  先用 `map` 把 JSON 字符串转成了 `List<Long>`。
    2.  紧接着用 `.flatMap(List::stream)`。这一步通过方法引用，把每个 `List<Long>` 里的元素“倒”了出来，汇入主干流。
    3.  最终 `collect` 得到的就是干干净净的 ID 列表，消除了嵌套结构。

-----

### 4. 知识点三：配合 Set 进行高效“差集”去重

**场景**：如何剔除已保存的文件？

```java
// 代码片段 2：去重逻辑
Set<Long> existChatDataIdSet = mailDataFilesService
    .getMailDataFilesByChatDataIds(fileContantOriginalIds)
    .stream()
    .map(MailDataFiles::getChatDataId) // 提取已存在的 ID
    .collect(Collectors.toSet());      // 转为 Set

// 在原始列表中移除已存在的
fileContantOriginalIds.removeAll(existChatDataIdSet);
```

**知识点**：

* **`Collectors.toSet()`**：Stream 结尾的神器。
* **为什么要转 Set？** 在做 `contains` 或 `removeAll` 操作时，`Set` 的查找时间复杂度是 $O(1)$，而 `List` 是 $O(N)$。
* **去重思想**：这里展示了标准的“批量查重”模式：
    1.  用 Stream 提取出数据库里已有的 ID 集合。
    2.  利用 Java 集合框架的 `removeAll` 方法（虽然不是 Stream 的方法，但通常配合 Stream 准备数据），一键剔除重复项。
        *这比在 for 循环里一个个查库要快得多！*

-----

### 5\. 知识点四：`forEach` 处理副作用

**场景**：最后，我们需要把 ID 和原始对象关联起来放到 Map 里。

```java
splitVOList.stream()
    .filter(...) // 再次过滤
    .forEach(item -> {
        // 解析 ID 并放入 Map
        List<Long> chatDataIds = ...;
        if (CollectionUtils.isNotEmpty(chatDataIds)) {
            chatVOAndMailDataIdMap.put(item, chatDataIds);
        }
    });
```

**知识点**：

* Stream 分为“中间操作”（如 filter, map）和终结操作。
* **`forEach`** 是一个终结操作。它不再返回 Stream，而是对流中的每个元素执行操作（这里是 `Map.put`）。
* **注意**：通常建议 Stream 保持“无副作用”（不修改外部状态），但在这种需要构建复杂 Map 或者执行写库操作的场景下，`forEach` 是合理的选择。

-----

### 6\. 总结

这段代码展示了 Stream 流处理数据的完整生命周期：

1.  **清洗** (`filter`)：只要有效数据。
2.  **变换与压平** (`map` + `flatMap`)：处理 1 对 N 的复杂结构。
3.  **计算中间态** (`collect(toSet)`)：辅助业务逻辑（去重）。
4.  **终结操作** (`forEach`)：完成业务数据的组装。

学会这个案例，处理任何“从列表 A 中提取数据，去重后，再组装成 Map”的需求都能得心应手。

-----



### 实战：用户(User)与订单(Orders)


* 假设有 2 个用户。
* 每个用户都下了好几个单。
* 目标：我们要统计出今天**一共卖出了哪些商品**（忽略是谁买的，只关心商品本身）。

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class FlatMapDemo {
    
    static class User {
        private String name;
        private List<String> orders; // 每个用户都有多个订单商品

        public User(String name, List<String> orders) {
            this.name = name;
            this.orders = orders;
        }

        public List<String> getOrders() {
            return orders;
        }
        
        @Override
        public String toString() {
            return name + "的订单" + orders;
        }
    }

    public static void main(String[] args) {

        List<User> userList = new ArrayList<>();
       
        userList.add(new User("张三", Arrays.asList("Apple", "Banana")));
        userList.add(new User("李四", Arrays.asList("Orange", "Banana")));

        System.out.println("=== 原始数据 ===");
        userList.forEach(System.out::println);
        System.out.println("----------------------------");

        // -------------------------------------------------------
        // 场景 A：使用 map (通常不是我们想要的)
        // 目标：拿到所有商品列表
        // -------------------------------------------------------
        List<List<String>> mapResult = userList.stream()
                .map(user -> user.getOrders()) // 输入 User -> 输出 List<String>
                .collect(Collectors.toList());

        System.out.println("=== 1. 使用 map 的结果 (套娃) ===");
        // 结果是：[[Apple, Banana], [Orange, Banana]]
        // 这是一个“列表的列表”，仍然保留了“用户”的边界
        System.out.println(mapResult); 


        // -------------------------------------------------------
        // 场景 B：使用 flatMap
        // 目标：把所有人的订单倒在一个池子里
        // -------------------------------------------------------
        List<String> flatMapResult = userList.stream()
                .flatMap(user -> user.getOrders().stream()) // 重点：把每个List变成Stream，然后合并
                .collect(Collectors.toList());

        System.out.println("\n=== 2. 使用 flatMap 的结果 (扁平化) ===");
        // 结果是：[Apple, Banana, Orange, Banana]
        // 边界消失了，所有商品都在一层里
        System.out.println(flatMapResult);


        // -------------------------------------------------------
        // 场景 C：配合 distinct 去重
        // 目标：统计一共卖了几种不同的商品？
        // -------------------------------------------------------
        List<String> distinctResult = userList.stream()
                .flatMap(user -> user.getOrders().stream()) // 1. 扁平化
                .distinct()                                 // 2. 去重
                .collect(Collectors.toList());

        System.out.println("\n=== 3. flatMap + distinct 去重后的结果 ===");
        // 结果是：[Apple, Banana, Orange]
        System.out.println(distinctResult);
    }
}
```
控制台输出：
```text
=== 1. 使用 map 的结果 (套娃) ===
[[Apple, Banana], [Orange, Banana]]

=== 2. 使用 flatMap 的结果 (扁平化) ===
[Apple, Banana, Orange, Banana]

=== 3. flatMap + distinct 去重后的结果 ===
[Apple, Banana, Orange]
```

一旦数据被拍平成一维列表（如场景 C），我们就可以直接链式调用 `.distinct()`（去重）、`.filter()`（过滤）、`.count()`（统计），而不需要写双重 `for` 循环去遍历了。
