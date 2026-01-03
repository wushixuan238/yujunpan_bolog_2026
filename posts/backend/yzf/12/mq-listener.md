---
title: "MQ Listener 实践"
description: "MQ"
date: "2025-12-03"
tags: ["yzf"]
category: "general"
slug: "12-mq"
published: true
---

# MQ Listener 实践

## 什么时候必须要写 Listener？

很多刚入行的兄弟会问：“我直接在 Service 里调用另一个 Service 不好吗？为什么非要发个消息，然后再写个 Listener 去收消息？这不是脱裤子放屁吗？”

在生产环境摸爬滚打多年，我可以负责任地告诉你：写 Listener 的本质，是用即时性的牺牲换取系统的稳定性和吞吐量。

在实际开发中，以下 **4 种场景**，你必须得写 Listener，而且写得越多，说明你的系统架构越趋向于分布式和解耦。

### 场景一：核心链路瘦身（异步解耦）
**频率：⭐⭐⭐⭐⭐ (极高)**

这是最常见的场景。用户的核心操作（比如下单、注册），应该只包含最关键的步骤，其他非关键的步骤，全部扔给 MQ，由 Listener 慢慢处理。

* **场景描述**：用户注册成功。
* **如果不写 Listener**：
    1.  保存用户数据 (5ms)
    2.  调用积分服务加新手积分 (RPC, 50ms)
    3.  调用营销服务发优惠券 (RPC, 50ms)
    4.  调用消息服务发欢迎短信 (RPC, 100ms)
    * **结果**：用户点个注册要等 200ms+，而且只要发短信的服务挂了，用户注册就失败了，这不扯淡吗？
* **老鸟做法**：
    1.  保存用户数据 (5ms)。
    2.  发一条 `UserRegisteredEvent` 消息给 MQ (2ms)。
    3.  **直接返回注册成功给用户。**
    4.  **【Listener 登场】**：
        * `PointsListener` 收到消息 -> 加积分。
        * `CouponListener` 收到消息 -> 发券。
        * `SmsListener` 收到消息 -> 发短信。

### 场景二：分布式事务的最终一致性
**频率：⭐⭐⭐⭐ (高)**

在微服务里，我不推荐用 Seata 之类的强一致性分布式事务（性能太差）。我们通常追求“最终一致性”。

* **场景描述**：用户支付成功，需要更新订单状态并扣减库存。
* **老鸟做法**：
    1.  支付服务收到回调，更新支付流水。
    2.  发一条 `OrderPaidMessage`。
    3.  **【Listener 登场】**：
        * 订单服务的 Listener 收到消息 -> 把订单状态改为“已支付”。
        * 库存服务的 Listener 收到消息 -> 正式扣减预占库存。
    * **为什么这么做？** 保证即便库存服务临时挂了，支付成功的状态也不会丢，等库存服务重启后，Listener 会自动重试消费，最终数据是一致的。

### 场景三：削峰填谷（高并发保护伞）
**频率：⭐⭐⭐ (中，大促必备)**

如果你做过秒杀、抢票系统，MQ 是保命的。

* **场景描述**：双十一零点，10 万人同时下单。
* **如果不写 Listener**：你的数据库瞬间被 10 万个写请求打死，DBA 提刀来见你。
* **老鸟做法**：
    1.  后端只负责把请求扔进 MQ（比如 `SeckillQueue`）。
    2.  **【Listener 登场】**：
        * 定义一个 Listener，设置 `concurrency = 10`（限制并发消费数）。
        * 它像一个大坝的闸口，以数据库能承受的速度（比如每秒处理 2000 个），匀速地从 MQ 里取消息写入数据库。
    * **效果**：前端流量虽然像海啸，但到了数据库这一层，被 Listener 变成了涓涓细流。

### 场景四：数据同步与搜索（CQRS）
**频率：⭐⭐⭐⭐ (高)**

现在的系统一般都有 ES (ElasticSearch) 或者 Redis 做缓存。数据怎么同步过去？

* **场景描述**：运营在后台修改了商品价格，C 端用户要能搜到最新价格。
* **老鸟做法**：
    1.  商品服务修改 MySQL 数据。
    2.  发消息 `ProductUpdatedMessage`。
    3.  **【Listener 登场】**：
        * `EsSyncListener` 收到消息 -> 更新 ES 里的索引数据。
        * `RedisCacheListener` 收到消息 -> 删除或更新 Redis 缓存。

---

### 什么时候【不要】写 Listener？

虽然 Listener 好用，但别滥用。遇到以下情况，老老实实写 RPC 调用或者本地代码：

1.  **强依赖返回结果**：前端等着要结果呢（比如查询余额），你发个 MQ 出去，鬼知道什么时候能处理完？这种情况必须同步调用。
2.  **逻辑必须严格顺序且不能延迟**：如果步骤 B 必须紧接着步骤 A 发生，且中间不能有毫秒级的延迟，别用 MQ。
3.  **系统极小**：如果你的系统总共就两个实例，也没啥并发，别引入 MQ。维护 MQ 集群的成本比你写代码的成本还高。

---

如果你是在互联网公司或者做中大型企业级应用，**写 Listener 是家常便饭，频率大概占你业务代码的 30%-40%。** 它是你从写功能进阶到架构设计的一把金钥匙。


你好！作为在 Java 圈子里摸爬滚打多年的“老鸟”，看到你对消息队列（MQ）的 Listener 及其具体实现感兴趣，我觉得这方向非常对。

很多初学者（甚至工作几年的中级开发）写 MQ 消费者时，往往只停留在“能收到消息”的层面。但在高并发、生产级事故频发的真实环境中，**如何优雅、健壮地定义 Listener**，才是区分“CRUD 工程师”和“高级开发”的分水岭。

今天我就脱下西装，以老鸟的身份，带你看看在 Spring Boot 生态下，**RabbitMQ** 和 **RocketMQ** 到底该怎么写 Listener，以及那些教科书上不常讲的“保命”细节。

-----

##  写 MQ Listener 最佳实践

## 一、 写在前面：Listener 的核心职责

在写代码之前，先把观念摆正。一个优秀的 MQ Listener 不仅仅是用来“接收”消息的，它必须具备以下素质：

1.  **可靠性**：消息不能丢，处理失败了要能重试或进死信队列 (DLQ)。
2.  **幂等性**：不管 MQ 给你推多少次同样的消息，你的业务数据不能乱。
3.  **可观测性**：出了问题，日志里得能看出来是哪条消息（MessageID）挂了。

-----

## 二、 RabbitMQ Listener：手动 ACK 才是王道

在 RabbitMQ 中，Spring AMQP 提供的 `@RabbitListener` 是最常用的。但是！千万别用默认配置上线核心业务。

**新手写法**：自动 ACK（Auto Acknowledge）。Spring 只要方法不报错，就自动告诉 MQ “我消费完了”。万一此时机器断电、或者你 catch 异常没抛出去，消息就**永久丢失**了。

**老鸟写法**：**手动 ACK (Manual Acknowledge)**。我们需要精确控制何时告诉 MQ 消息处理成功，何时拒绝消息。

### 1\. 配置准备

在 `application.yml` 中开启手动确认：

```yaml
spring:
  rabbitmq:
    listener:
      simple:
        acknowledge-mode: manual # 关键！开启手动ACK
        retry:
          enabled: true # 开启本地重试
          max-attempts: 3 # 重试次数
```

### 2\. 代码实现

```java
import com.rabbitmq.client.Channel;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OrderRabbitListener {

    /**
     * 这里的关键在于引入 Channel 和 deliveryTag
     */
    @RabbitListener(queues = "order.create.queue", concurrency = "4-8") // 并发数配置，根据机器性能调优
    public void onMessage(@Payload String messageBody,
                          @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag,
                          Channel channel) {
        try {
            // 1. 解析消息 (JSON -> Object)
            System.out.println("收到订单消息: " + messageBody);

            // 2. 【核心】幂等性检查 (利用 Redis 或 数据库唯一索引)
            // if (isProcessed(messageId)) { channel.basicAck(...); return; }

            // 3. 执行业务逻辑
            processOrder(messageBody);

            // 4. 手动确认：告诉 MQ，这条消息我吃下了，可以删了
            // false 表示只确认当前这一条，不批量确认
            channel.basicAck(deliveryTag, false);

        } catch (Exception e) {
            // 5. 异常处理：
            // 策略A：重试一定次数后，如果是业务逻辑错误，直接 reject 并不重新入队（进入死信队列）
            // 策略B：网络抖动，requeue = true，重新扔回队列尾部（慎用，容易导致死循环堵死队列）
            
            try {
                // 一般生产环境建议记录详细 Error Log，然后放入死信或人工处理表
                System.err.println("消费失败，转入死信队列: " + e.getMessage());
                // requeue = false 表示不重回原队列，配合配置可进入 DLQ
                channel.basicNack(deliveryTag, false, false); 
            } catch (IOException ex) {
                // 如果连 Nack 都失败了，那是真崩了
                ex.printStackTrace();
            }
        }
    }

    private void processOrder(String body) {
        // 模拟业务
    }
}
```

**老鸟点评**：

* **deliveryTag**：这是消息在 Channel 里的身份证，ACK 的时候必须带上。
* **Concurrency**：不要只用默认的一个线程。通过 `concurrency = "4-8"` 可以利用多线程提升吞吐量。
* **BasicNack**：出错时，别无脑抛异常。显式地告诉 MQ “我处理不了”，并决定是丢弃、进死信还是重试，这才是掌控权。

-----

## 三、 RocketMQ Listener：优雅的注解驱动

RocketMQ 在 Spring Cloud Alibaba 或 `rocketmq-spring-boot-starter` 中的实现相对更封装，它强调的是**顺序**和**Tag 过滤**。

**新手写法**：不管三七二十一，写个 Listener 就不管了，也不指定 ConsumerGroup。

**老鸟写法**：明确区分 **Concurrently** (并发) 和 **Orderly** (顺序) 模式，并合理使用 Tag 减少网络传输。

### 代码实现

```java
import org.apache.rocketmq.common.message.MessageExt;
import org.apache.rocketmq.spring.annotation.ConsumeMode;
import org.apache.rocketmq.spring.annotation.MessageModel;
import org.apache.rocketmq.spring.annotation.RocketMQMessageListener;
import org.apache.rocketmq.spring.core.RocketMQListener;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

/**
 * 核心注解配置：
 * topic: 订阅的话题
 * consumerGroup: 极其重要！不同业务必须不同 Group，否则会发生负载均衡导致的丢消息诡异现象。
 * selectorExpression: Tag 过滤，只消费带有 TagA 的消息，节省带宽。
 * consumeMode: CONCURRENTLY (默认并发，高性能) vs ORDERLY (严格顺序，适用于状态机流转)
 * messageModel: CLUSTERING (集群消费，默认) vs BROADCASTING (广播消费，每个节点都收)
 */
@Component
@RocketMQMessageListener(
    topic = "topic_payment_result",
    consumerGroup = "cg_payment_consumer",
    selectorExpression = "TagA || TagB", 
    consumeMode = ConsumeMode.CONCURRENTLY, // 大部分场景用并发
    messageModel = MessageModel.CLUSTERING
)
public class PaymentRocketListener implements RocketMQListener<MessageExt> { // 推荐直接用 MessageExt 拿元数据

    @Override
    public void onMessage(MessageExt message) {
        String msgId = message.getMsgId();
        String body = new String(message.getBody(), StandardCharsets.UTF_8);
        int reconsumeTimes = message.getReconsumeTimes();

        try {
            long startTime = System.currentTimeMillis();
            System.out.printf("收到消息 ID: %s, 重试次数: %d%n", msgId, reconsumeTimes);

            // 1. 幂等性校验 (RocketMQ 重试机制非常积极，幂等性是必须的)
            // 2. 业务逻辑
            handlePayment(body);

            // RocketMQ 只要方法正常返回，就默认 ACK 成功。
            
        } catch (Exception e) {
            // 3. 异常处理
            System.err.println("消费异常: " + e.getMessage());
            
            // 如果业务判断该错误无法通过重试解决（如 JSON 格式错误），不要抛异常，直接 swallow 并记录日志。
            // 否则抛出异常，RocketMQ 会按照 1s 5s 10s ... 的阶梯进行重试。
            throw new RuntimeException("申请重试", e); 
        }
    }

    private void handlePayment(String body) {
        // 模拟业务
    }
}
```

**老鸟点评**：

* **泛型选择**：虽然可以写 `RocketMQListener<User>` 让框架帮你反序列化，但我更建议用 `RocketMQListener<MessageExt>`。因为这样你能拿到 `MsgID`、`ReconsumeTimes`（重试次数）等关键元数据，这对排查线上问题至关重要。
* **异常陷阱**：RabbitMQ 需要手动 Nack，而 RocketMQ 是通过**抛出异常**来触发重试的。如果你把 Exception 偷偷吃掉了（catch 住没抛出），RocketMQ 会认为你消费成功了！
* **Group 隔离**：千万别在开发环境和测试环境共用一个 `ConsumerGroup`，否则你会发现消息一会儿被开发机消费了，一会儿被测试机消费了，调试到你怀疑人生。

-----

## 四、 总结：通用法则

不管你用哪个 MQ，作为高级开发，你的脑子里要有这根弦：

| 关注点 | RabbitMQ 策略 | RocketMQ 策略 |
| :--- | :--- | :--- |
| **确认机制** | 推荐 `manual` 手动 ACK/NACK | 此时无声胜有声（无异常即ACK，抛异常即重试） |
| **并发控制** | `concurrency` 参数 | `consumeThreadMax` 配置或 `ConsumeMode` |
| **消息过滤** | Exchange Routing Key (强大) | Tag / SQL92 (高效) |
| **重试机制** | 需手动配置死信队列 (DLQ) | 自带 18 个级别的延迟重试，最后进死信 |

**最后送大家一句话**：
MQ 不是垃圾桶，不要什么都往里塞；Listener 也不是下水道，不要指望它能自动处理所有脏数据。**幂等性**和**异常分级处理**，是写好 Listener 的底裤，千万别弄丢了。

-----

希望这篇总结能帮你把简历上的“熟悉 MQ”变成面试时的“精通 MQ 落地”。如果你正在准备大厂面试（特别是针对 2026 秋招），这些细节往往是面试官深挖的点。

**Would you like me to simulate a specific interview question related to these listeners (e.g., "How to handle message accumulation/lag in RocketMQ vs RabbitMQ")?**