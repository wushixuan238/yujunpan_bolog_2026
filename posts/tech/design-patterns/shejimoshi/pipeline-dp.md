---
title: '管道模式（Pipeline Pattern）'
titleJp: ''
date: '2025-11-20'
excerpt: ''
tags: ["design-pattern"]
---
# 管道模式（Pipeline Pattern）

> 在软件开发中，**Processor 模式**（通常也称为 **Pipeline 模式** 或 **管道模式**）并不是 Gang of Four (GoF) 定义的 23 种标准设计模式之一，但在实际工程（特别是后端业务开发）中非常常见。

## 解决的问题

在后端开发中，我们经常会遇到这种场景：一个核心业务方法（比如创建订单或者用户注册），随着需求的迭代，代码行数像滚雪球一样膨胀。从最初的 50 行变成了 500 行，甚至 1000 行。里面充斥着各种 `if-else`，参数校验、库存扣减、优惠计算、日志记录、消息发送……全部挤在一个 `try-catch` 块里。

维护起来十分困难。

软件工程的核心难题之一是控制复杂度。

当一个业务流程变长、变复杂时，如果我们把它写在一个方法里，我们违反了两个最基本的软件设计原则：

1. 单一职责原则 (SRP) ： 一个方法做了太多事。校验是它，计算是它，落库也是它。修改任何一个小逻辑，都可能导致整个流程崩溃。
2. 开闭原则 (OCP) ： 每次新增一个步骤（比如新增一个满减逻辑），都必须侵入修改原有代码，而不是扩展新代码。

我们需要一种机制，能够将一个线性的、复杂的长流程，横向切分为若干个独立的、原子化的短步骤，并且这些步骤可以像根据需要进行组装。这就是 Processor 模式的诞生要解决的问题。

## 核心概念

Processor 模式的核心思想是可以看做**分而治之**。它将一个大的任务（Context）按步骤拆解，每个步骤由一个独立的 Processor 负责处理。

可以将多个处理器（Processor）组合在一起，形成一个管道，让数据可以在这个管道中流动。每个处理器都负责对数据进行一定的处理，并将处理结果传递给下一个处理器，最终得到最终结果。

输入是原始数据或上下文对象 (Context)。之后，数据流经一系列 Processor，每个 Processor 对数据进行校验、转换、等等操作处理。最终输出处理完成的数据。

> 就像工厂的流水线。汽车骨架（Context）在传送带上移动，第一个工人（Processor A）装轮胎，第二个工人（Processor B）装玻璃，第三个工人（Processor C）喷漆。

在代码实现中，通常结合了**责任链模式**的思想，但更侧重于所有步骤都执行而不是仅仅找到一个处理者就结束。

可能有些抽象，看代码就明白了。

## 代码实现示例 (Java)

**_Step 1：定义接口_**

```java
// 定义一个泛型接口，T 通常是一个包含所有业务数据的 Context 对象
public interface Processor<T> {
    void process(T context);
}
```

**_Step 2：定义上下文 (Context)_**

```java
import lombok.Data;

@Data
public class OrderContext {
    private String orderId;
    private Double amount;
    private String userAddress;
    private boolean isPaid;
    // ... 其他中间状态或结果
}
```

**_Step 3：实现具体的 Processor_**

```java
// 处理器1：参数校验
public class ValidationProcessor implements Processor<OrderContext> {
    @Override
    public void process(OrderContext context) {
        if (context.getAmount() < 0) {
            throw new IllegalArgumentException("金额不能为负");
        }
        System.out.println("校验通过...");
    }
}

// 处理器2：丰富数据
public class EnrichmentProcessor implements Processor<OrderContext> {
    @Override
    public void process(OrderContext context) {
        context.setUserAddress("Default Address"); // 模拟查询数据库填充地址
        System.out.println("数据填充完毕...");
    }
}

// 处理器3：执行支付逻辑
public class PaymentProcessor implements Processor<OrderContext> {
    @Override
    public void process(OrderContext context) {
        context.setPaid(true);
        System.out.println("支付状态更新...");
    }
}
```

**_Step 4：执行链 (Pipeline Executor)_**

```java
import java.util.ArrayList;
import java.util.List;

public class OrderProcessorChain {
    private List<Processor<OrderContext>> processors = new ArrayList<>();

    // 注册处理器
    public OrderProcessorChain addProcessor(Processor<OrderContext> processor) {
        processors.add(processor);
        return this;
    }

    // 执行处理流
    public void process(OrderContext context) {
        for (Processor<OrderContext> processor : processors) {
            processor.process(context);
        }
    }
}
```

Processor 模式 和 责任链模式。这两个模式非常相似，但侧重点不同：

| **特性**     | **Processor / Pipeline 模式**                                          | **责任链模式 (GoF CoR)**                                                           |
| ------------ | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **执行逻辑** | **串行全量执行**。数据通常会流经所有处理器（除非抛出异常中断）。       | **择一执行**。通常找到一个能处理请求的节点后就停止，或者根据条件决定是否传给下家。 |
| **目的**     | **分解复杂流程**。将大任务拆分为小步骤（Step 1 -> Step 2 -> Step 3）。 | **解耦请求发送者和接收者**。你不需要知道具体是谁处理了请求。                       |
| **上下文**   | 所有处理器通常共享并修改同一个 Context 对象。                          | 请求对象在链上传递，通常不共享可变的中间状态上下文。                               |

**优点：**

- 单一职责 (SRP): 每个 Processor 只做一件事，代码清晰，易于维护。
- 高扩展性 (OCP): 新增业务步骤只需新增一个 Processor 类并注册到链中，无需修改原有代码。
- 复用性: 某些通用的 Processor（如参数校验）可以在不同的链中复用。

软件工程中没有银弹，得到一些就要失去一些。

**缺点：**

- 类爆炸: 如果流程切分过细，会产生大量的类。
- 上下文管理: 所有数据都依赖 Context 对象传递，Context 可能会变得非常臃肿。
- 调试困难: 逻辑被分散在多个类中，排查问题时可能需要跳跃查看。

## SpringBoot 代码重构实战

很多教科书上的实现方式过于繁琐（手动 `add` 链表）。在 Spring 生态中，利用 IoC（控制反转） 和 自动装配，我们可以写出极其优雅的 Processor 模式。它经常结合 `@Order` 注解和 `List<Processor>` 自动注入来实现。

为了深刻理解这个模式，我们来看一个真实的业务场景：用户注册。

起初，需求很简单：校验账号 -> 保存数据库。

后来，需求变了：要校验密码强度、要加密、要发欢迎邮件、如果是邀请进来的还要给积分、最后还要同步数据到大数据平台……

这是我们经常在老项目中见到的代码。所有的逻辑像面条一样缠绕在一个 `register` 方法里，充斥着大量的 `if-else`、`try-catch` 和胶水代码。

```java
@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;
    @Autowired
    private EmailClient emailClient;
    @Autowired
    private IntegralService integralService;

    // 噩梦的开始：一个方法写了 200 行
    public void register(UserDTO dto) {
        // 1. 校验参数
        if (StringUtils.isBlank(dto.getUsername())) {
            throw new RuntimeException("用户名不能为空");
        }
        // ... 省略一堆校验逻辑 ...

        // 2. 校验用户是否存在
        User exist = userMapper.findByUsername(dto.getUsername());
        if (exist != null) {
            throw new RuntimeException("用户已存在");
        }

        // 3. 密码加密处理
        String salt = UUID.randomUUID().toString();
        String encryptedPwd = MD5Util.encrypt(dto.getPassword() + salt);

        // 4. 组装对象并落库
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(encryptedPwd);
        user.setSalt(salt);
        userMapper.save(user);

        // 5. 处理邀请逻辑 (业务分支)
        if (StringUtils.isNotBlank(dto.getInviteCode())) {
            try {
                integralService.addIntegral(dto.getInviteCode(), 100);
            } catch (Exception e) {
                // 甚至这里还藏着一个只打印不报错的 try-catch，坑死后来人
                log.error("积分发放失败", e);
            }
        }

        // 6. 发送欢迎邮件
        try {
            emailClient.sendWelcomeEmail(user.getEmail());
        } catch (Exception e) {
            log.warn("邮件发送失败，但不影响主流程");
        }

        // 7. 同步大数据... (下次迭代又要加代码了)
    }
}
```

痛点分析： 哪怕只是改一下邮件发送逻辑，都有可能不小心删掉上面的积分发放代码。想给这个方法写单元测试，需要 Mock 所有的依赖（Mapper, Email, Integral...）。核心业务（落库）和非核心业务（发邮件）强耦合。

现在，我们运用 Processor 模式进行重构。将每一步拆解为独立的类，并用 Spring 自动组装。

第一步：定义上下文 (Context)

```java
@Data
public class RegisterContext {
    private UserDTO inputDto;
    private User savedUser;
    // 可以在步骤间传递中间变量
    private boolean isInvited;
}
```

第二步：拆分工序 (Processors)

工序 A：校验处理器

```java
@Component
@Order(1)
public class ValidationProcessor implements RegisterProcessor {
    @Override
    public void handle(RegisterContext ctx) {
        // 只关注校验，清爽！
        if (userMapper.findByUsername(ctx.getInputDto().getUsername()) != null) {
            throw new RuntimeException("用户已存在");
        }
    }
}
```

工序 B：核心落库处理器

```java
@Component
@Order(2)
public class PersistenceProcessor implements RegisterProcessor {
    @Override
    public void handle(RegisterContext ctx) {
        // 只关注落库
        User user = convertToUser(ctx.getInputDto());
        userMapper.save(user);
        ctx.setSavedUser(user); // 将结果回填到 Context，供后续步骤使用
    }
}
```

工序 C：积分与邮件处理器

```java
@Component
@Order(3)
public class WelfareProcessor implements RegisterProcessor {
    @Override
    public void handle(RegisterContext ctx) {
        // 处理积分
        if (StringUtils.isNotBlank(ctx.getInputDto().getInviteCode())) {
             integralService.addIntegral(...);
        }
        // 处理邮件
        emailClient.sendWelcomeEmail(ctx.getSavedUser().getEmail());
    }
}
```

最后看看重构后的主类，非常优雅，赏心悦目：

```java
@Service
public class UserService {

    // 自动注入所有步骤
    private final List<RegisterProcessor> processors;

    public UserService(List<RegisterProcessor> processors) {
        this.processors = processors;
    }

    public void register(UserDTO dto) {
        // 1. 准备原材料
        RegisterContext context = new RegisterContext();
        context.setInputDto(dto);

        // 2. 启动流水线
        for (RegisterProcessor processor : processors) {
            processor.handle(context);
        }
    }
}
```

可以看到优势：**当我们需要新增一个步骤时，只需要创建一个新的类并在上面打上注解，不需要修改任何现有的管理类代码。**

这种模式好在哪里？回到我们最初的痛点：

1. 解耦（SRP）： `ValidationProcessor` 只管校验，`DiscountProcessor` 只管算钱。代码很清晰，单元测试很好写。
2. 扩展（OCP）： 要加一个风控检查步骤，我们不需要修改 `OrderService`，也不需要修改现有的 Processor。你只需要新建一个类 `RiskControlProcessor`，加上 `@Order(1.5)`，Spring 就会自动把它插进去。
3. **复用性：** 某个通用的 Processor（比如通用参数校验）可以被多个不同的 pipeline 引用。

什么时候使用它？不要手里拿着锤子，看什么都是钉子。Processor 模式流程长、步骤多、易变化的业务场景：

- 流程很长：步骤超过 3-5 个。
- 经常变化：业务流程经常需要调整顺序，或者增删步骤。
- 存在分支逻辑：虽然示例是线性的，但你可以在 Processor 内部加入 `shouldProcess()` 方法来决定是否跳过某一步。

实际应用场景有：

1. **电商下单流程：** 库存校验 -> 优惠券计算 -> 运费计算 -> 生成订单 -> 发送通知。
2. **ETL 数据处理：** 数据读取 -> 数据清洗 -> 数据转换 -> 数据写入。
3. **网络请求处理：** Netty 中的 ChannelPipeline 就是典型的 Processor 模式应用（解码 -> 业务逻辑 -> 编码）。
4. **规则引擎：** 风控系统中，一个用户行为需要经过一系列独立的风控规则检查。

反之，如果你的逻辑只有两行代码，或者逻辑之间有极强的、无法解耦的强依赖，强行拆分反而会增加阅读代码时的跳跃感，得不偿失。

## 结语

Processor 模式是一种代码技巧，也是一种架构思维。它体现了将复杂问题线性化、切片化的处理思路。

当你下次面对一个几百行的冗余方法感到无从下手时或者 leader 让你重构复杂业务代码时，不妨试着使用管道模式，把这个方法拆成一条流水线。让你的代码也突然井井有条起来。
