---
title: '枚举类'
titleJp: ''
date: '2025-12-05'
excerpt: ''
tags: ["yzf"]
---
作为老鸟，我可以负责任地告诉你：**枚举是用得好，代码像诗歌；用不好，就是一堆没用的类。**

在真实的项目开发中，枚举不仅仅是用来“存常量”的，它其实是一个功能强大的对象。下面我把项目里**最常用**的 4 种场景，由浅入深地传授给你。

-----

### 第一层：消灭“魔法值” (基础必会)

这是枚举最本职的工作。凡是你在代码里看到 `0, 1, 2` 或者 `"SUCCESS", "FAIL"` 这种硬编码的地方，都应该用枚举。

**什么时候用？**

* **状态机**：订单状态（待支付、已支付、已发货）、审核状态（通过、驳回）。
* **类型区分**：用户类型（普通、VIP、管理员）、支付方式（微信、支付宝）。
* **数据字典**：性别、省份（虽然省份一般存库，但固定的比如“直辖市”可以用枚举）。

**怎么用？**
不要只定义名字，要定义**属性**（Code 和 Desc）。

```java
@Getter
@AllArgsConstructor
public enum UserStatusEnum {
    // 格式：枚举名(数据库存的值, 前端展示的字)
    ENABLE(1, "启用"),
    DISABLE(0, "禁用"),
    LOCKED(-1, "锁定");

    private final Integer code;
    private final String desc;
    
    // 老鸟习惯：一定要写一个根据 code 找枚举的方法，MyBatis 或前端传参时常用
    public static UserStatusEnum getByCode(Integer code) {
        return Arrays.stream(values())
                .filter(e -> e.code.equals(code))
                .findFirst()
                .orElse(null);
    }
}
```

-----

### 第二层：统一 API 响应码 (项目标配)

现在的后端都讲究统一返回格式 `Result<T>`。为了避免开发人员随意返回 `code: 200` 或 `code: 0`，必须用枚举强制规范。

**什么时候用？**

* 定义全局的错误码（系统异常、参数错误）。
* 定义业务特定的错误码（余额不足、库存扣减失败）。

**怎么用？**
配合接口使用，让代码极其优雅。

```java
// 1. 定义接口（为了多模块通用）
public interface ResultCode {
    Integer getCode();
    String getMsg();
}

// 2. 定义枚举实现接口
@Getter
@AllArgsConstructor
public enum BizCodeEnum implements ResultCode {
    SUCCESS(200, "操作成功"),
    SYSTEM_ERROR(500, "系统繁忙"),
    USER_NOT_FOUND(1001, "用户不存在"),
    PASSWORD_ERROR(1002, "密码错误");

    private final Integer code;
    private final String msg;
}

// 3. 实际使用（在 Controller 或 ExceptionHandler 中）
// return Result.error(BizCodeEnum.USER_NOT_FOUND);
```

-----

### 第三层：消除 `if-else` / `switch` (进阶·策略模式)

这招是用来秀操作的，也是区别新手和高手的关键。
当你发现代码里针对不同类型有大段的 `if (type == A) ... else if (type == B) ...` 时，可以把逻辑内聚到枚举里。

**什么时候用？**

* 简单的加减乘除计算。
* 不同 VIP 等级的折扣计算。
* 不同渠道的消息推送逻辑（如果不复杂的话）。

**怎么用？（枚举里的抽象方法）**

假设我们要写一个简单的计算器：

```java
public enum CalculatorEnum {
    ADD {
        @Override
        public int execute(int a, int b) {
            return a + b;
        }
    },
    SUBTRACT {
        @Override
        public int execute(int a, int b) {
            return a - b;
        }
    },
    MULTIPLY {
        @Override
        public int execute(int a, int b) {
            return a * b;
        }
    };

    // 定义抽象方法，强制每个枚举项实现
    public abstract int execute(int a, int b);
}

// 业务代码调用：
// 以前你得写 switch，现在只需要：
int result = CalculatorEnum.ADD.execute(10, 5); 
```

**好处**：新增一种算法（比如除法），只需要在枚举里加一个 `DIVIDE`，完全不需要动业务层的代码，符合**开闭原则**。

-----

### 第四层：最安全的单例模式 (面试必问)

这是 Java 中实现单例（Singleton）**最安全、最简单、防反射攻击、防序列化破坏**的方式。虽然业务代码写得少，但写工具类时可以用。

**什么时候用？**

* 全局唯一的配置管理器。
* 线程池工厂。

**怎么用？**

```java
public enum DataSourceManager {
    INSTANCE; // 全局唯一实例

    private final DataSource dataSource;

    // 构造方法默认是 private 的，JVM 保证只加载一次
    DataSourceManager() {
        this.dataSource = new HikariDataSource(); // 初始化连接池
    }

    public Connection getConnection() throws SQLException {
        return dataSource.getConnection();
    }
}

// 调用：
// Connection conn = DataSourceManager.INSTANCE.getConnection();
```

-----

### 老鸟的 3 个避坑指南

1.  **比较枚举尽量用 `==` 而不是 `.equals()`**

    * `UserStatusEnum.ENABLE.equals(param)`：如果 `UserStatusEnum.ENABLE` 是 null（虽然枚举项不会是 null，但变量会），或者 param 是 null，可能报空指针。
    * `param == UserStatusEnum.ENABLE`：**完全空指针安全**，而且性能更高（比较内存地址）。

2.  **存数据库时，尽量存 `Code` (数字/字符串) 而不是 `EnumName`**

    * 千万别把枚举的名字（如 "USER\_NOT\_FOUND"）直接存进数据库字符串字段。万一哪天你重构代码把枚举改名叫 "USER\_MISSING"，数据库里的旧数据就废了。
    * **推荐**：配合 MyBatis-Plus 的 `@EnumValue` 注解，或者 JPA 的 `@Convert`，自动把数据库的 `1` 映射成 `UserStatusEnum.ENABLE`。

3.  **枚举不要包含“有状态”的成员变量**

    * 枚举是单例的！除了像单例模式那种专门设计的场景，**千万别在枚举里定义可以被修改的字段**（没有 `final` 的字段）。
    * 错误示范：
      ```java
      public enum BadEnum {
          A;
          private int count = 0; // 危险！全局共享，多线程不安全
          public void add() { count++; }
      }
      ```

### 总结

* **新手**把枚举当常量用 (`public static final int`).
* **老鸟**把枚举当对象用 (有属性、有方法、有行为).
* **大神**把枚举当策略用 (利用多态消除逻辑分支).

下次写代码，如果你想写 `public static final string ...`，先停下来想一想：**这玩意儿是不是该写个 Enum？**。
