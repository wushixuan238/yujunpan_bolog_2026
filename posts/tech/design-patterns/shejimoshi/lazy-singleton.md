---
title: '基于回调的懒加载单例模式'
titleJp: ''
date: '2025-11-12'
excerpt: ''
tags: ["design-pattern"]
---
> 最近在阅读 RocketMQ5.0 源码的`auth` 模块，看到了一个有意思的设计，记录下来�?

## **原理解析**

先上源码�?

```java
// AuthenticationFactory.Java

public static AuthenticationEvaluator getEvaluator(AuthConfig config) {
    return computeIfAbsent(EVALUATOR_PREFIX + config.getConfigName(), key -> new AuthenticationEvaluator(config));
}

private static <V> V computeIfAbsent(String key, Function<String, ? extends V> function) {
    Object result = null;
    if (INSTANCE_MAP.containsKey(key)) {
        result = INSTANCE_MAP.get(key);
    }
    if (result == null) {
        synchronized (INSTANCE_MAP) {
            if (INSTANCE_MAP.containsKey(key)) {
                result = INSTANCE_MAP.get(key);
            }
            if (result == null) {
                result = function.apply(key);
                if (result != null) {
                    INSTANCE_MAP.put(key, result);
                }
            }
        }
    }
    return result != null ? (V) result : null;
}
```

可以看到这里是使用了 DCL 的懒加载单例模式。但是有意思的是多传进了一个参数：

`Function<String, ? extends V> function`

为什么要传一�?Function�?

在以前的 Java 代码中，我们通常这样写懒加载（双重检查锁）：

```java
// 常见的写法：硬编�?
public static Evaluator getEvaluator(String configName) {
    // 1. 查缓�?
    if (map.containsKey(configName)) {
        return map.get(configName);
    }
    synchronized (map) {
        // 2. 二次检�?
        if (map.containsKey(configName)) { ... }

        // 3. 【硬编码】创建逻辑写死在这�?
        Evaluator e = new Evaluator();
        map.put(configName, e);
        return e;
    }
}
```

那么 RocketMQ 这里的传入一个函数有什么好处？

显而易见，就是创建什么对象的逻辑，现在可以通过函数进行传递�?

它把：怎么查缓存和怎么创建对象彻底分开了�?

- `computeIfAbsent` 方法负责：并发控制、查缓存、写缓存。这是通用的，写一次就行�?
- `key -> new ...` (Function) 负责：具体的创建逻辑。这是变化的，每次调用传不一样的�?

```java
computeIfAbsent(key, k -> new AuthenticationEvaluator(config));

```

大白话理解这段代码意思是：去缓存里找 `key`。如果找到了直接给我；如果没找到，用后面这个 lambda 表达式（Function）现做一个，存进去，然后给我�?

很明显，这种写法更加通用了。我需要创建其他对象，也只需要：

```java
computeIfAbsent(key, k -> new Dog());

computeIfAbsent(key, k -> new Cat());

```

## 手写 Demo：通用对象工厂

假设我们要设计一个工厂，用来管理各种重型对象（比如数据库连接、AI 模型、第三方客户端）。我们不想为每个类型都写一�?`synchronized` 逻辑�?

```java
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

// 1. 这是一个通用的工厂基�?
public class GenericFactory {

    // 缓存池：存所有东�?
    private static final Map<String, Object> CACHE = new HashMap<>();

    /**
     * 核心方法：computeIfAbsent
     * @param key      缓存�?Key
     * @param creator  函数式接口：如果缓存没命中，该怎么创建对象�?
     */
    @SuppressWarnings("unchecked")
    protected static <V> V getOrCreate(String key, Function<String, V> creator) {
        // 第一层检�?
        Object value = CACHE.get(key);

        if (value == null) {
            synchronized (CACHE) {
                // 第二层检�?(双重检查锁)
                value = CACHE.get(key);
                if (value == null) {
                    System.out.println(">>> 缓存未命中，正在执行创建逻辑: " + key);
                    // 【关键点】：调用传入的函数来创建对象
                    value = creator.apply(key);

                    if (value != null) {
                        CACHE.put(key, value);
                    }
                }
            }
        } else {
            System.out.println(">>> 缓存命中: " + key);
        }

        return (V) value;
    }
}

// 2. 具体的业务工厂：数据库连接工�?
class ConnectionFactory extends GenericFactory {

    public static String getMysqlConnection(String url) {
        // 只需要一行代码！传入 Key �?创建逻辑(Lambda)
        return getOrCreate("MYSQL_" + url, key -> {
            // 模拟复杂的创建过�?
            return "MySQL Connection(Connected to " + url + ")";
        });
    }

    public static String getRedisConnection(String host) {
        // 复用同一个核心方法，但传入不同的创建逻辑
        return getOrCreate("REDIS_" + host, key -> {
            return "Redis Connection(Connected to " + host + ")";
        });
    }
}

// 3. 测试
public class Main {
    public static void main(String[] args) {
        // 第一次拿：触发创�?
        ConnectionFactory.getMysqlConnection("127.0.0.1");

        // 第二次拿：直接走缓存
        ConnectionFactory.getMysqlConnection("127.0.0.1");

        // 拿另一种资�?
        ConnectionFactory.getRedisConnection("localhost");
    }
}

```

```
>>> 缓存未命中，正在执行创建逻辑: MYSQL_127.0.0.1
>>> 缓存命中: MYSQL_127.0.0.1
>>> 缓存未命中，正在执行创建逻辑: REDIS_localhost
```

## 实战场景：多渠道支付网关

**需求背景：**
我们正在开发一个聚合支付系统。系统需要支持支付宝 (Alipay)、微�?(Wechat)、PayPal 等多种渠道�?
每个渠道对应�?`PaymentClient` 初始化非常耗时，要加载证书、建立长连接，且必须�?*单例**的�?

**要求�?*

1. 不要在系统启动时把所�?Client 都创建出来（太慢）�?
2. 当第一个用户选择用支付宝支付时，才初始化支付�?Client�?
3. 后续用户再用支付宝，直接复用�?
4. 请使�?RocketMQ 的这�?Function 设计模式实现�?

```java
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

// 支付客户端接�?
interface PaymentClient {
    void pay(double amount);
}

class AlipayClient implements PaymentClient {
    public AlipayClient() { System.out.println("初始化支付宝客户�?加载证书耗时2�?..."); }
    public void pay(double amount) { System.out.println("调用支付宝接口扣�? " + amount); }
}

class WechatClient implements PaymentClient {
    public WechatClient() { System.out.println("初始化微信客户端..."); }
    public void pay(double amount) { System.out.println("调用微信接口扣款: " + amount); }
}

// 【核心】支付工�?
public class PaymentClientFactory {

    // 使用 ConcurrentHashMap，自�?computeIfAbsent，比 RocketMQ 手写的那个更简�?
    private static final Map<String, PaymentClient> CLIENT_MAP = new ConcurrentHashMap<>();

    /**
     * 获取支付客户�?
     * @param channelCode 渠道�?(ALIPAY, WECHAT)
     */
    public static PaymentClient getClient(String channelCode) {
        // 这一句代码就完成了：缓存检�?+ 懒加�?+ 线程安全 + 逻辑分派
        return CLIENT_MAP.computeIfAbsent(channelCode, key -> {

            // 这里�?Function 内部，只有缓存不存在时才会执�?
            if ("ALIPAY".equals(key)) {
                return new AlipayClient();
            } else if ("WECHAT".equals(key)) {
                return new WechatClient();
            } else {
                throw new IllegalArgumentException("不支持的支付渠道: " + key);
            }
        });
    }
}

// 模拟业务调用
public class PaymentService {
    public static void main(String[] args) {
        System.out.println("--- 用户A: 使用支付�?---");
        PaymentClient client1 = PaymentClientFactory.getClient("ALIPAY"); // 触发初始�?
        client1.pay(100.0);

        System.out.println("\\\
--- 用户B: 使用支付�?---");
        PaymentClient client2 = PaymentClientFactory.getClient("ALIPAY"); // 不会初始化，直接复用
        client2.pay(50.0);

        System.out.println("\\\
--- 用户C: 使用微信 ---");
        PaymentClient client3 = PaymentClientFactory.getClient("WECHAT"); // 触发初始�?
        client3.pay(200.0);
    }
}

```

## 如何应用

以后在面试或工作中，如果遇到以下情况，就可以直接借鉴这套代码。比如：

1. Key-Value 映射：需要根据某�?Key 获取对象�?
2. 对象很重：创建对象开销大，不能每次�?new�?
3. 按需加载：不希望启动时全部加载�?
4. 线程安全：多线程环境下只能创建一个实例�?

> �?Map 做缓存，�?computeIfAbsent 做入口，�?Lambda (Function) 写创建逻辑�?

这比写一大堆 `if (map.get(k) == null) { synchronized { ... } }` 要高级得多，代码可读性也更高�?

RocketMQ 5.x 也是利用这一点，�?Factory 类变得非常简洁，可以轻松管理 Provider、Evaluator、Strategy 等多种类型的组件�?

## 扩展：PECS 原则

这是《Effective Java》中提出的原则：

> _Producer Extends, Consumer Super._

- **Producer**：如果一个参数主要是用来**提供**数据，即返回数据给我们的代码用，它就是生产者�?
  - 在这里，function  参数的作用是  function.apply()，它**生产**一个对象给你�?
  - 所以要�? ? extends V�?
- **Consumer**：如果一个参数主要是用来**接收**数据，也就是我们要把数据塞给它，它就是消费者�?
  - 比如  List<? super T>，你要往�? add  东西�?

它体现了作者对 Java 泛型的深刻理解：**对输入宽容（接受子类），对输出严�?*�?
