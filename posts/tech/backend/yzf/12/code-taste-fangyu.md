---
title: '防御性编程思维'
titleJp: ''
date: '2025-12-03'
excerpt: ''
tags: ["yzf"]
---
“永远不要信任你的输入，永远不要信任外部系统。”

这是我入职云帐房第一周，导师对我说的最多的一句话。从象牙塔走进互联网大厂，我发现工业级代码和作业代码最大的区别，并不在于算法有多精妙，而在于它是否具备足够的鲁棒性。

防御性编程（Defensive Programming）是一种编码习惯，是一种对于系统风险的敬畏之心。本文将结合我在云厂的实战开发经验，从入参校验、异常处理、不可变性设计等多个维度，系统梳理如何在 Java 项目中构建代码的铜墙铁壁。



# 第一道防线：输入参数

这是最基础也是最重要的防线。永远不要信任方法的入参，尤其是对外暴露的 API，比如 Controller、RPC 接口。

刚毕业的时候我习惯这样写：

```java
public void register(User user) {
    if (user != null && user.getName() != null && !user.getName().equals("")) {
        // ...
    }
}
```

这太丑陋了，且容易漏。在工程中，我们通常采用契约式编程：

你好！很高兴看到你开始思考“防御性编程”这个话题。作为一名在 Java 领域摸爬滚打十多年的架构师，我可以负责任地告诉你：**代码能不能跑通，决定了你能不能通过试用期；而代码够不够“防御”，决定了你能不能成为 Tech Lead。**

很多校招生刚入职时，写代码的思维路径是“快乐路径”（Happy Path），即假设一切输入都是完美的，网络永远是通的，数据库永远不会挂。但现实是残酷的，墨菲定律在工程领域永远生效。

- **利用 `java.util.Objects` (JDK 7+)：**

  ```java
  public void process(String data) {
      // 如果为空，直接抛出 NPE，并附带明确提示，fail-fast（快速失败）
      this.data = Objects.requireNonNull(data, "Data must not be null");
  }
  ```

- **利用 Guava Preconditions 或 Spring Assert：**
  适合做逻辑校验。

  ```java
  import org.springframework.util.Assert;

  public void updateStock(int quantity) {
      Assert.isTrue(quantity > 0, "Stock quantity must be positive");
      // ...
  }
  ```

- **Bean Validation (JSR-303/380)：**
  在 Controller 层或 Service 层入口，不要手写 `if`，直接用注解。

  ```java
  public class UserDTO {
      @NotNull(message = "ID cannot be null")
      private Long id;

      @Size(min = 2, max = 20)
      private String name;

      @Email
      private String email;
  }

  // Service层
  public void register(@Valid UserDTO user) { ... }
  ```

## 警惕 String 的陷阱

`String` 是最容易出问题的类型。

- **防守姿态：** 总是把常量放在前面。

  ```java
  String status = null;
  // 错误：如果你忘了判空，这行会报 NPE
  // if (status.equals("SUCCESS"))

  // 正确：绝对安全
  if ("SUCCESS".equals(status)) { ... }
  ```

- **工具类：** 使用 `StringUtils` (Apache Commons 或 Spring) 处理 `null`、空串、空格串。
  ```java
  if (StringUtils.isBlank(input)) { ... } // 同时搞定 null, "", "   "
  ```

---

# 第二道防线：不可变性（Immutability）与防御性复制

很多诡异的 Bug（尤其是并发场景下）是因为数据被意外修改了。**最好的防御就是让数据根本无法被修改。**

### 1. 拥抱 `final` 和 Immutable Object

- 如果你定义一个类，字段尽量加上 `final`。
- JDK 14+ 引入的 `record` 是天然的不可变数据载体，强烈推荐用于 DTO/VO。

### 2. 集合的防御性复制 (Defensive Copy)

这是很多初中级工程师容易忽略的。
**场景：** 你的对象里有一个 List，你通过 getter 直接把 List 返回出去了。
**风险：** 外部调用者拿到了这个 List 的引用，可以在你不知情的情况下 `clear()` 掉你的数据。

**防御写法：**

```java
public class Department {
    private List<Employee> employees = new ArrayList<>();

    // 错误写法：直接暴露内部引用
    public List<Employee> getEmployees() {
        return employees;
    }

    // 正确写法 1：返回不可变视图 (推荐)
    public List<Employee> getEmployees() {
        return Collections.unmodifiableList(employees);
    }

    // 正确写法 2：返回一个新的副本
    public List<Employee> getEmployees() {
        return new ArrayList<>(employees);
    }
}
```

同理，构造函数接收集合时，也不要直接赋值，而是要 `new ArrayList<>(inputList)`，防止外部修改了传入的 List 影响到你内部。

### 3. 时间类型的防御

**千万别用 `java.util.Date`！** 它是可变的，且线程不安全。
**防御方案：** 全面使用 `java.time` 包（JDK 8+），如 `LocalDateTime`，它们是不可变的。

---

# 第三道防线：控制流与返回值的防御

### 1. 别再返回 `null` 了

返回 `null` 是移交责任给调用方，对方一旦忘了判空就是生产事故。

- **集合：** 永远返回空集合 (`Collections.emptyList()`)，而不是 `null`。这样调用方可以直接 `for (Item i : list)` 而不会报错。
- **单个对象：** 使用 `Optional<T>`。

  ```java
  public Optional<User> findUser(String id) {
      User user = repo.findById(id);
      return Optional.ofNullable(user);
  }

  // 调用方被强制处理不存在的情况
  findUser("123").ifPresentOrElse(
      u -> System.out.println(u.getName()),
      () -> throw new UserNotFoundException()
  );
  ```

### 2. Switch 的防御

使用 Switch 时，永远要加上 `default`，即使你认为枚举覆盖全了。因为枚举可能会在未来增加，而你的代码如果不重新编译或处理，就会出现逻辑黑洞。

```java
switch (status) {
    case NEW -> processNew();
    case RUNNING -> processRunning();
    default -> throw new IllegalStateException("Unexpected value: " + status);
}
```

---

# 第四道防线：外部系统的“隔离”

当你调用 RPC、HTTP 接口或数据库时，防御性编程要求你**假设它们一定会挂**。

### 1. 永远不要无限等待 (Timeouts)

这是工程经验的血泪史。任何网络 I/O 必须设置超时时间（Connect Timeout 和 Read Timeout）。
如果没设置超时，一旦第三方服务卡死，你的线程池会被瞬间占满，导致整个系统雪崩。

### 2. 幂等性设计 (Idempotency)

网络是不可靠的，超时不代表失败，可能是请求成功了但响应丢了。上游可能会重试。
**防御方案：** 你的写接口必须支持幂等。

- 使用数据库唯一索引。
- 使用 Redis 分布式锁。
- 使用状态机（例如：订单状态只能从 A -> B，如果当前已经是 B，直接返回成功）。

### 3. 熔断与降级 (Circuit Breaker)

不要因为一个不重要的外部服务挂了，拖垮你的主业务。使用 Resilience4j 或 Sentinel。

```java
// 伪代码
@CircuitBreaker(name = "userService", fallbackMethod = "getDefaultUser")
public User getUserRemote(String id) {
    return userClient.get(id);
}

public User getDefaultUser(String id, Throwable t) {
    // 降级逻辑：返回缓存或兜底数据
    return new User("Guest");
}
```

---

# 第五道防线：异常处理的艺术

### 1. 吞掉异常 = 掩耳盗铃

**绝对禁止**这种代码：

```java
try {
    doSomething();
} catch (Exception e) {
    // 空着，或者只打印 e.printStackTrace()
}
```

这会让排查问题成为噩梦。
**防御方案：**

- 要么捕获并处理（降级/重试）。
- 要么包装成自定义业务异常抛出（保留原始堆栈）。
- 至少要 Log 错误信息：`log.error("Failed to do something", e);`

### 2. 具体的异常优于通用的异常

不要 catch `Exception`，要 catch `FileNotFoundException`。这能让你防止意外捕获了 `NullPointerException` 等本该暴露的代码 Bug。

---

# 第六道防线：并发与多线程

### 1. 线程安全的类

在多线程环境下，普通的 `HashMap`, `ArrayList`, `SimpleDateFormat` 都是不安全的。
**防御方案：**

- 使用 `ConcurrentHashMap`。
- 使用 `CopyOnWriteArrayList` (读多写少场景)。
- 使用 `ThreadLocal` 或 `DateTimeFormatter`。

### 2. 乐观锁 (Optimistic Locking)

不要总是假设数据不会被别人修改。在更新数据库时，加上版本号。

```sql
UPDATE user SET balance = balance - 100, version = version + 1
WHERE id = 1 AND version = 5;
```

如果更新行数为 0，说明数据被别人改过了，抛出异常或重试。

---

## 总结：防御性编程的度

写了这么多，最后要提醒一点：**过犹不及**。

- **Public API (对外)：** 严防死守，假设调用者是小白或黑客。
- **Private Method (内部)：** 适度防御。如果是你自己调用的私有方法，且上下文可控，过多的 `assert` 会影响代码可读性。

**从“能跑通”到“跑得稳”，是初级开发迈向高级架构师的关键一步。** 这种思维需要你在日常写代码时不断刻意练习，直到它成为你的肌肉记忆。

希望这篇指南能成为你职业生涯的一块垫脚石。加油，Java 后浪！


## Code Style Is Restful

除了用了 HTTP 协议传输数据，跟 RESTful 一毛钱关系都没有。如果你在一个声称严格遵守 RESTful 规范的团队里提交这行代码，Code Review 时会被喷得体无完肤。