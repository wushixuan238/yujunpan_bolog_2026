---
id: '233333345'
title: '访问者模式-Visitor Pattern'
titleJp: ''
date: '2025.01.04'
excerpt: '23 种设计模式'
tags: ['Design Pattern']
---


**访问者模式（Visitor Pattern）** 是 23 种设计模式中**最难理解、但最优雅**的模式之一。它属于**行为型模式**。

用一句话概括：
> **它的核心目的是：将“数据结构”与“对数据的操作”分离开来。**

如果不理解这句话，我们用一个生活中的例子，然后结合代码，最后回到 ShardingSphere 源码来看。

---

### 一、 生活中的隐喻：酒店与服务员

想象你去住酒店。
*   **数据结构（稳定的）：** 酒店的房间。有“标准间”、“总统套房”。房间建好了就不太会变了。
*   **访问者（变化的）：** 进入房间的人，做不同的事。

如果不使用访问者模式，我们可能会在“房间”类里写满方法：
```java
class 标准间 {
    void 打扫卫生() { ... }
    void 送餐() { ... }
    void 维修设施() { ... }
    void 消防检查() { ... }
    // 以后每加一种服务，都要改这个类，类会爆炸！
}
```

**使用访问者模式：**
房间类说：“我不管你要干嘛，我只提供一个**入口（accept）**，让你进来。”
具体的业务逻辑（打扫、送餐），交给具体的**访问者**去定义。

1.  **清洁阿姨（访问者A）：** 进来 -> 扫地、换床单。
2.  **维修工（访问者B）：** 进来 -> 检查灯泡、修马桶。
3.  **厨师（访问者C）：** 进来 -> 放下盘子。

**好处：** 以后如果酒店新增了“按摩服务”，只需要雇一个“按摩师（访问者D）”就行了，完全不用砸墙改房间（不用修改房间类的代码）。

---

### 二、 代码层面的实现（最核心机制：双重分派）

在 Java 中，访问者模式依赖一个叫 **“双重分派 (Double Dispatch)”** 的机制。

假设我们有图形：`Circle` (圆形) 和 `Rectangle` (矩形)。

#### 1. 定义数据结构 (Element)
```java
// 接口：允许访问者进来
interface Shape {
    void accept(Visitor visitor);
}

class Circle implements Shape {
    public void accept(Visitor visitor) {
        // 关键点：把自己(this)交出去，告诉访问者“我是圆形”
        visitor.visit(this); 
    }
}

class Rectangle implements Shape {
    public void accept(Visitor visitor) {
        // 关键点：告诉访问者“我是矩形”
        visitor.visit(this);
    }
}
```

#### 2. 定义访问者 (Visitor)
```java
interface Visitor {
    void visit(Circle circle);    // 处理圆形
    void visit(Rectangle rectangle); // 处理矩形
}
```

#### 3. 实现具体操作 (ConcreteVisitor)
比如，我们要**计算面积**，或者**画图**。

```java
// 访问者1：计算面积
class AreaCalculator implements Visitor {
    public void visit(Circle circle) {
        System.out.println("计算圆的面积：3.14 * r * r");
    }
    public void visit(Rectangle rectangle) {
        System.out.println("计算矩形的面积：长 * 宽");
    }
}

// 访问者2：绘制红色边框
class RedBorderPainter implements Visitor {
    public void visit(Circle circle) {
        System.out.println("给圆形画红圈");
    }
    public void visit(Rectangle rectangle) {
        System.out.println("给矩形画红框");
    }
}
```

#### 4. 客户端调用
```java
public static void main(String[] args) {
    Shape circle = new Circle();
    Shape rect = new Rectangle();

    Visitor calculator = new AreaCalculator();
    
    // 动作发生了！
    circle.accept(calculator); // 输出：计算圆的面积...
    rect.accept(calculator);   // 输出：计算矩形的面积...
}
```

---

### 三、 为什么要用它？（解决了什么痛点）

回到 **ShardingSphere 的 AST（抽象语法树）**：

1.  **数据结构极其复杂且稳定：** SQL 的语法规则（Select, Insert, Where, Table）是固定的标准，很少变动。
    *   这就是“房间”或“Shape”。
2.  **操作逻辑经常变动且多样：**
    *   有时我们需要**提取表名**（为了做路由）。
    *   有时我们需要**格式化 SQL**（把 SQL 变漂亮）。
    *   有时我们需要**脱敏/加密**（把 `pwd` 字段掩盖）。
    *   有时我们需要**改写 SQL**（把逻辑表换成物理表）。

如果把 `extractTable()`, `format()`, `rewrite()` 这些方法都写在 `SelectStatement` 类里，这个类会变成几万行，维护起来是灾难。

**用访问者模式：**
`SQLStatement` 依然保持纯净（只存结构）。
需要“提取表名”时，就创建一个 `TableExtractorVisitor`，扔进树里跑一圈，结果就出来了。

---

### 四、 ShardingSphere 源码中的体现

在 SS-JDBC 源码中，你会看到大量类似这样的类：

*   **`SQLASTVisitor` (接口):** 定义了 `visitSelect`, `visitTable`, `visitWhere` 等方法。
*   **`SQLStatement` (接口):** 并没有显式写 `accept`，因为 SS-JDBC 使用了 ANTLR4 生成的 ParseTree，转换逻辑稍微做了一点变通，但思想完全一致。

**典型的使用场景：**
当你看到代码里有一个类叫 **`FormatSQLVisitor`** 或者 **`SQLRewriteContextDecorator`** 时，它们本质上就是访问者。它们遍历整棵 SQL 树，在遇到 `TableSegment` 时把表名替换掉，在遇到 `EncryptColumn` 时把明文替换成密文。

### 五、 优缺点总结（面试必问）

**优点：**
1.  **符合单一职责原则：** 数据结构只负责存数据，业务操作逻辑全部去 Visitor 里写。
2.  **扩展性极强（针对操作）：** 想增加一个新的功能（比如“检查 SQL 是否有 SQL 注入风险”），只需要写一个新的 `SecurityCheckVisitor`，**完全不需要修改现有的 SQLStatement 代码**。这符合 **开闭原则 (OCP)**。

**缺点（致命伤）：**
1.  **数据结构难以修改：** 如果 SQL 标准变了，突然多了一种 `NewTypeSegment`，那么所有的 `Visitor` 接口和实现类全部都要修改（因为要加 `visit(NewTypeSegment)` 方法）。
    *   *所以，访问者模式只适用于“数据结构稳定，但操作算法易变”的场景。AST 正是这种场景。*

**总结：**
访问者模式就是 **“铁打的营盘（数据结构），流水的兵（操作逻辑）”**。在 ShardingSphere 里，它让复杂的 SQL 树能够轻松应对路由、改写、加密等各种千奇百怪的处理逻辑。


能设计出如此**精妙但又极其烧脑**的模式，确实不是一般人。

**访问者模式（Visitor Pattern）** 的正式提出者和归纳者，就是软件工程界如雷贯耳的 **“四人帮” (Gang of Four，简称 GoF)**。

### 1. 正式归纳者：GoF (1994年)
它最早被正式定义并收录在 1994 年出版的计算机界“圣经”——**《设计模式：可复用面向对象软件的基础》** (*Design Patterns: Elements of Reusable Object-Oriented Software*) 一书中。

这四位大神分别是：
*   **Erich Gamma** (Eclipse 之父，JUnit 之父，VS Code 的核心架构师)
*   **Richard Helm**
*   **Ralph Johnson**
*   **John Vlissides**

他们并不是“凭空捏造”了这个模式，而是从当时的 **Smalltalk** 和 **C++** 社区的工程实践中提取出来的。

---

### 2. 灵感来源：编译器的困境
虽然是 GoF 总结的，但这个模式的**灵感原型**其实是为了解决**编译器开发**中的一个死结。

**背景故事：**
在 80、90 年代，面向对象编程刚兴起，大家在写编译器（比如 C++ 编译器）时遇到了大麻烦：
1.  **AST（语法树）很稳定：** 语言的语法（If, For, While）一旦定下来，几十年都不变。
2.  **后端处理疯狂变：** 今天要写个“类型检查”，明天要写个“代码优化”，后天要支持“生成 Intel 汇编”，大后天要支持“生成 ARM 汇编”。

**困境：**
如果按照传统的 OOP 思想，把 `generateARMCode()` 方法写在 `Node` 类里，每加一种 CPU 架构，就要去修改所有语法节点的代码。这简直是灾难。

**灵感爆发：**
有人想到了：**为什么不把“数据”和“算法”撕开呢？**
*   让 `Node` 只有一种能力：**“接待客人”** (`accept`)。
*   让 `Visitor` 带着算法（比如生成 ARM 汇编）去拜访每一个节点。

这种思想在 Smalltalk 社区中被称为 **Double Dispatch (双重分派)** 的一种模拟实现，后来被 GoF 提炼成了“访问者模式”。

---

### 3. 一个有趣的细节：它被公认为“最复杂”
即使在 GoF 的那本经典著作中，**访问者模式也被认为是 23 种模式中最复杂、最难理解、也最具争议的一个。**

*   **Erich Gamma** 曾开玩笑说：
    > 如果你的设计中需要用到访问者模式，**你通常是错的**。除非你是在写编译器。

这句话虽然夸张，但也道出了真谛：**除了处理像 AST（抽象语法树）这种极其稳定且深层嵌套的数据结构外，千万别滥用它。**

### 总结
是谁想出来的？
是 **GoF（四人帮）** 为了解决 **编译器 AST 处理** 这种 **“结构死、逻辑活”** 的极端场景，通过模拟 **双重分派** 技术而总结出来的。

所以在 ShardingSphere 的 SQL 解析引擎里看到它，完全是**“认祖归宗”**——因为 SQL 解析器本质上就是一种编译器前端，这里正是访问者模式的**主场**。