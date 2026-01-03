---
title: "From writing code to writing good code"
description: "best practices for writing code"
date: "2025-12-03"
tags: ["yzf"]
category: "general"
slug: "12-zaqizaba"
published: true
---





这是一个 Java 开发中非常经典的问题，也是代码走查（Code Review）中最常被“打回”的细节之一。

简单来说：**在返回集合（List, Set, Map）的方法中，`return null` 通常被视为“反模式”（Anti-pattern），而 `return Collections.EMPTY_LIST`（或 `Collections.emptyList()`）才是行业标准做法。**

以下是详细的对比分析，以及为什么领域专家会强烈建议你改掉 `return null`。

### 核心区别概览

| 特性 | `return null` | `return Collections.EMPTY_LIST` |
| :--- | :--- | :--- |
| **含义** | “这里什么都没有，连个容器都没有” | “这里有一个容器，但是容器里是空的” |
| **调用方安全性** | **危险**。调用方必须先做 `if (list != null)` 检查，否则报 `NPE`。 | **安全**。调用方可以直接遍历、获取大小，不会报错。 |
| **代码整洁度** | 差。调用方充斥着防御性代码。 | 优。调用方代码流畅自然。 |
| **可变性** | N/A | **不可变**。返回的列表不能执行 `.add()` 操作。 |
| **专家评价** | ❌ 强烈不推荐 | ✅ 推荐（甚至强制要求） |

-----

### 1\. `return null`：给调用方挖坑

当你写下 `return null` 时，你实际上是把“处理空情况”的责任推卸给了调用你代码的人。

**代码演示：**

```java
// 服务端代码（挖坑者）
public List<String> getUserNames() {
    if (dbResult == null) {
        return null; // <--- 坑在这里
    }
    return dbResult;
}

// 客户端代码（受害者）
List<String> names = service.getUserNames();

// 如果客户端忘记判空，直接操作：
// names.size();  // -> 💥 NullPointerException (NPE)
// for (String n : names) { ... } // -> 💥 NPE

// 客户端被迫写防御性代码：
if (names != null) { // <--- 必须多写这行废话
    for (String name : names) {
        System.out.println(name);
    }
}
```

**批评：**

> “不要让调用者去猜测你到底返不返回 null。为了你的方便，让所有的调用处都增加一次 null check，这是极差的 API 设计体验。”

-----

### 2\. `return Collections.EMPTY_LIST`：优雅且安全

当你返回一个空集合时，调用方可以把“有数据”和“无数据”一视同仁地处理。

**代码演示：**

```java
// 服务端代码（好榜样）
public List<String> getUserNames() {
    if (dbResult == null) {
        return Collections.emptyList(); // <--- 优雅的空对象
    }
    return dbResult;
}

// 客户端代码（受益者）
List<String> names = service.getUserNames();

// 1. 获取大小：安全，返回 0
System.out.println(names.size()); 

// 2. 遍历：安全，循环体一次都不会执行，不会报错
for (String name : names) {
    System.out.println(name);
}

// 3. Stream 流：安全
names.stream().filter(...).collect(...);
```

**优点：**
调用方根本不需要知道“没数据”，它只管遍历。如果没有数据，循环就不执行，逻辑完全自洽。

-----

### 3\. 重要细节与潜在坑点

虽然推荐返回空集合，但有几个细节需要专家级开发者注意：

#### A. 优先使用 `Collections.emptyList()` 而不是 `EMPTY_LIST`

* `Collections.EMPTY_LIST` 返回的是原生态 `List`（raw type），需要强制转型，有泛型警告风险。
* `Collections.emptyList()` 是一个泛型方法，会自动推断类型。
  ```java
  // 推荐写法
  return Collections.emptyList(); 
  ```

#### B. 返回的是“不可变集合” (Immutable)

`Collections.emptyList()` 返回的列表是只读的。如果调用方拿到列表后试图往里面添加元素，会报错。

```java
List<String> list = getNames(); // 假设返回了 emptyList()
list.add("New Name"); // -> 💥 java.lang.UnsupportedOperationException
```

* **如何解决？** 如果你的业务契约允许调用方修改返回的 List，且此时是空，你应该返回一个新的可变 List：
  ```java
  return new ArrayList<>();
  ```
  *(注：但在大多数查询接口（Getter）中，返回不可变空集合是标准做法，因为查询结果通常不应该由调用方修改)*。

-----

Java 领域的圣经 **《Effective Java》 (Joshua Bloch)** 第 54 条明确指出：

> "Return empty collections or arrays, not nulls"
> （返回空集合或空数组，不要返回 null）

**原因总结：**

1.  **客户端代码更简单**：不需要 `if (list != null)`。
2.  **性能开销极小**：`Collections.emptyList()` 返回的是同一个静态单例对象，不会产生对象创建的内存开销（相比 `new ArrayList<>()` 而言）。

### 结论

在你的代码中：

* **不要写：** `return null;`
* **建议写：** `return Collections.emptyList();` （注意大小写，用方法而不是常量，泛型更友好）

这是从“写代码”进阶到“写好代码”的重要一步。


# HTTP调用

```java
@Component
@Slf4j
public class HttpUtils {

    @Resource
    private WebClient webClient;

    public String httpPost(Object params, String url, Map<String, String> headers) {
        return webClient.post()
                .uri(url)
                .headers(httpHeaders -> headers.forEach(httpHeaders::add))
                .bodyValue(params)
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }

    public String httpPost(String params, String url, Map<String, String> headers) {
        return webClient.post()
                .uri(url)
                .headers(httpHeaders -> headers.forEach(httpHeaders::add))
                .bodyValue(params)
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }

}
```

这是一个非常经典的\*\*“把跑车当拖拉机开”\*\*的代码案例。

如果我是中间件专家或资深架构师，我会从**底层原理**、**并发模型**和**工程隐患**三个角度来解读和批评这段代码。

### 一、 专家解读：这个系统是如何发起调用的？

这段代码封装了 Spring 5.0 引入的 **WebClient**。
它的调用链（Method Chaining）逻辑如下：

1.  **`webClient.post()`**: 初始化一个 HTTP POST 请求构建器。
2.  **`.uri(url)`**: 设置目标地址。
3.  **`.headers(...)`**: 遍历传入的 Map，将所有键值对塞入 HTTP 请求头（Header）中。
4.  **`.bodyValue(params)`**: 设置请求体（Body）。
    * 如果 `params` 是对象，WebClient 会自动调用配置好的编码器（如 Jackson）把它序列化成 JSON。
    * 如果 `params` 是 String，就直接发送字符串。
5.  **`.retrieve()`**: **发起请求**并准备提取响应。
6.  **`.bodyToMono(String.class)`**: 告诉 WebClient，“我不想要复杂的流，请把响应体（Body）全部读完，拼接成一个字符串，封装在一个异步容器（Mono）里给我”。
7.  **`.block()` (关键)**：**阻塞当前线程**，一直等到 HTTP 请求完全结束、拿到数据为止。

-----

### 二、 专家批评：这里的不足（Bad Smells）

虽然这段代码“能用”，但在高并发或生产级（Production-Ready）的标准下，它有几个明显的\*\*“反模式”（Anti-patterns）\*\*：

#### 1\. 最大的败笔：在响应式客户端上调用 `.block()`

* **批评**：`WebClient` 是基于 Netty 的**异步非阻塞**客户端，设计初衷是用少量的线程处理大量并发请求。
* **后果**：你最后加了一个 `.block()`，硬生生把它变成了**同步阻塞**模式。
    * 这就像**买了一辆法拉利，然后用几头牛拉着它走**。
    * 既然你要阻塞，为什么不直接用更轻量级、更简单的 `RestTemplate` 或 `OkHttp`？引入了庞大的 `spring-webflux` 依赖却只用来做阻塞调用，是资源浪费。

#### 2\. “裸奔”的调用：缺乏超时与熔断

* **批评**：代码中**看不到任何超时（Timeout）设置**。
* **后果**：如果对方服务器（OneApi/豆包）挂了，不返回数据，你的这个线程就会一直卡在 `.block()` 这里傻等（直到触发默认的 TCP 超时，通常很久）。
* **灾难场景**：如果并发量上来，你的服务器线程池（Tomcat 线程）会迅速被这些卡住的请求占满，导致整个系统假死（雪崩效应）。

#### 3\. 极其简陋的错误处理

* **批评**：直接返回 `String`，没有 try-catch。
* **后果**：
    * 如果对方返回 `404 Not Found` 或 `500 Internal Server Error`，`.block()` 会直接抛出 `WebClientResponseException` 异常。
    * 如果上层调用者（Caller）没有捕获这个异常，整个业务流程就会直接崩溃，而不是优雅地降级或重试。

#### 4\. 低效的数据转换

* **批评**：入参是 `Object`，出参却是 `String`。
* **后果**：调用者拿到 String 后，必须自己再调用 `JSON.parseObject(...)`（如你上一段代码所示）。这意味着数据被 **序列化(JSON) -\> 传输 -\> 反序列化(String) -\> 再反序列化(JSONObject)**。这是多余的 CPU 开销。WebClient 本身支持直接反序列化为对象。

-----

### 三、 大厂（Big Tech）是怎么发起 HTTP 调用的？

在大厂（阿里、字节、美团等），这种手写 `HttpUtils` 的方式通常被视为\*\*“小作坊”做法\*\*。大厂通常采用以下几种进化路线：

#### 1\. 声明式客户端 (Declarative Clients) —— 最常用

不写具体的 HTTP 请求代码，而是定义接口。

* **技术栈**：**OpenFeign** (Spring Cloud) 或 **Retrofit**。
* **写法**：
  ```java
  // 定义一个接口，就像调用本地方法一样
  @FeignClient(name = "llm-service", url = "${llm.url}")
  public interface LlmClient {
      
      @PostMapping("/doubao/context/create")
      // 自动处理 JSON 序列化和反序列化
      LlmResponse createCache(@RequestBody CacheCreateRequest request);
  }
  ```

#### 2\. RPC 框架 (Remote Procedure Call) —— 内部服务标准

如果是在公司内部微服务之间调用，几乎不用 HTTP+JSON，而是用更高性能的 RPC。

* **技术栈**：**Dubbo** (阿里系) 或 **gRPC** (Google/字节系)。
* **特点**：基于二进制传输（Protobuf），比 HTTP 快得多，且自带负载均衡和重试机制。

#### 3\. 带有治理能力的 HTTP 客户端

如果必须手动写 HTTP（例如调用第三方 OpenAI），会加上**治理组件**：

```java
// 伪代码：大厂风格的 WebClient 配置
public String callThirdParty(Object params) {
    return webClient.post()
            .uri("/v1/chat")
            .bodyValue(params)
            .retrieve()
            // 1. 自动重试机制：失败了重试3次，每次间隔递增
            .onStatus(HttpStatus::is5xxServerError, resp -> Mono.error(new RetryableException()))
            .retryWhen(Retry.backoff(3, Duration.ofMillis(500))) 
            
            // 2. 超时控制：3秒拿不到结果就断开
            .timeout(Duration.ofSeconds(3)) 
            
            // 3. 错误处理：发生异常返回默认值
            .onErrorResume(e -> Mono.just("默认回复")) 
            
            .bodyToMono(String.class)
            .block(); // 即使在大厂，非核心链路偶尔也会用 block，但一定有兜底策略
}
```

### 四、 总结

这段 `HttpUtils` 代码：

1.  **原理**：利用 Reactive WebClient 发起请求，然后强行阻塞等待结果。
2.  **评分**：**40分**（不及格）。
3.  **改进建议**：
    * 如果是简单项目，至少加上 `.timeout(Duration.ofSeconds(5))`。
    * 如果是正式项目，建议删掉这个工具类，改用 **OpenFeign**，或者把 `.block()` 去掉，将整个业务链路改造成全异步（Reactive）的。


这是一个非常好的架构选型问题。

如果不分场景直接说“OpenFeign 一定比 HttpUtils 好”是耍流氓。但如果是**正式的企业级 Java 项目（尤其是基于 Spring Boot/Cloud 的项目）**，弃用手写的 `HttpUtils` 改用 **OpenFeign**（或者其他声明式客户端）确实是行业共识。

以下是领域专家对于“为什么要换”以及“你应该用什么”的深度建议。

-----

### 一、 为什么要换？（OpenFeign vs 手写 HttpUtils）

核心区别在于：**你是想写“业务逻辑”，还是想写“底层通讯代码”？**

#### 1\. 代码可读性与维护性 (Declarative vs Imperative)

* **你的代码 (HttpUtils)**：
  你需要关注 URL 拼接、Header 循环设值、Body 序列化、发起请求、阻塞等待、异常捕获。这是**命令式编程**（告诉机器每一步怎么做）。
* **OpenFeign**：
  你只需要定义一个接口，告诉它“我要调谁，传什么参数”。这是**声明式编程**（告诉机器我要什么）。

**对比图解：**

* **你的代码：**
  ```java
  // 每次调用都要写这么一堆
  Map<String, String> headers = new HashMap<>();
  headers.put("Authorization", "Bearer xxx");
  String url = host + "/api/user/" + userId;
  String result = httpUtils.post(url, headers, body); // 容易写错参数顺序
  User user = JSON.parseObject(result, User.class); // 还要手动转对象
  ```
* **OpenFeign：**
  ```java
  // 定义一次，到处调用。看起来就像调用本地方法一样简单
  User user = userClient.getUserById(userId); 
  ```

#### 2\. 生态集成能力 (Ecosystem Integration)

这是 OpenFeign 的杀手锏。在 Spring Cloud 环境下：

* **自动负载均衡**：Feign 集成了 LoadBalancer。如果你的 LLM 服务部署了 3 个节点，Feign 自动帮你轮询调用，而 `HttpUtils` 只能写死一个 IP，或者自己写复杂的轮询算法。
* **熔断降级**：Feign 完美集成 Resilience4j/Sentinel。如果 LLM 服务挂了，Feign 可以自动调用 `fallback` 方法（比如返回缓存数据），防止整个系统崩盘。
* **链路追踪**：Feign 自动适配 SkyWalking/Zipkin，调用链路上会自动透传 TraceId。手写的 `HttpUtils` 往往会导致链路 ID 丢失，排查问题时断链。

#### 3\. 统一规范 (Standardization)

* **HttpUtils 现状**：团队里小张写了一个 `HttpUtils`，小李觉得不好用又写了一个 `OkHttpUtils`，小王为了性能写了个 `NioHttpUtils`。整个项目乱七八糟。
* **Feign 现状**：所有人强制使用 Interface 定义接口，代码风格高度统一。

-----

### 二、 领域专家的建议：在项目中如何写 HTTP 请求？

根据你的具体场景（是调内部微服务，还是调外部 AI/支付接口），推荐方案如下：

#### 场景 1：内部微服务调用 (Service to Service)

**推荐：OpenFeign**
这是 Spring Cloud 的标准答案。

* **怎么写**：
  ```java
  @FeignClient(name = "finance-service", fallback = FinanceFallback.class)
  public interface FinanceClient {
      @PostMapping("/salary/confirm")
      Result<Boolean> confirmSalary(@RequestBody SalaryDTO dto);
  }
  ```

#### 场景 2：调用第三方复杂接口 (OpenAI, 微信, 支付宝)

**推荐 A：Forest (国产之光)**
如果你觉得 Feign 配置太重，或者不在 Spring Cloud 环境下，**Forest** 是一个极佳的选择。它比 Feign 更轻量，配置更灵活，对日志打印支持极好。

* **特点**：声明式，支持各种复杂的 Header/Auth 认证，支持拦截器。
* **代码示例**：
  ```java
  public interface OneApiClient {
      @Post("https://api.oneapi.com/v1/chat")
      @Headers("Authorization: Bearer ${token}")
      LlmResponse chat(@Body LlmRequest request, @Var("token") String token);
  }
  ```

**推荐 B：Retrofit (Java 界的通用标准)**
如果你是 Android 开发转过来的，或者是纯 Java 项目（非 Spring），Retrofit 是最强的选择。

#### 场景 3：需要高性能、流式传输 (AI 聊天打字机效果)

**推荐：WebClient (正确用法) 或 Spring 6 的 RestClient**
*注意：这里特指 AI 场景。* OpenFeign 对 **Streaming (流式响应)** 的支持比较差。如果你需要实现类似 ChatGPT 那样一个字一个字蹦出来的效果，Feign 很难做。

* **WebClient (异步模式)**：

  ```java
  // 真正的响应式调用，不阻塞
  public Flux<String> streamChat(String prompt) {
      return webClient.post()
              .uri("/chat")
              .bodyValue(prompt)
              .retrieve()
              .bodyToFlux(String.class); // 返回流，而不是字符串
  }
  ```

* **RestClient (Spring Boot 3.2+ 新宠)**：
  如果你用的是最新的 Spring Boot 3.2+，Spring 官方推出了 `RestClient`。它拥有像 `WebClient` 一样优雅的链式 API，但是是**同步阻塞**的（底层基于 HttpClient 或 OkHttp）。它是用来彻底取代老旧的 `RestTemplate` 的。

-----

### 三、 总结：你应该怎么改？

针对你目前的业务（调用 OneApi 进行 AI 交互）：

**方案一：工程化改造（推荐）**
如果你不需要流式输出（即不需要打字机效果，只需要等待结果），请引入 **Forest** 或 **OpenFeign**。

* **理由**：将 URL、Token、JSON 转换逻辑从业务代码中剥离，业务代码只关注“我要发给谁，发什么”。

**方案二：最小成本优化（如果不换框架）**
如果你坚持要用 `WebClient`，请务必进行以下封装，不要直接在业务层裸写：

1.  **定义 DTO**：不要传 Map，定义 `OneApiRequest` 和 `OneApiResponse` 类。
2.  **增加超时控制**：
    ```java
    .timeout(Duration.ofSeconds(10)) // 必须加！
    ```
3.  **增加错误处理**：
    ```java
    .onStatus(HttpStatus::isError, response -> {
        // 抛出自定义异常，而不是让上层一脸懵逼
        return Mono.error(new BusinessException("AI服务调用失败")); 
    })
    ```
4.  **配置连接池**：
    WebClient 默认的连接池配置可能不适合高并发，需要配置 `HttpClient` 的底层参数（最大连接数、空闲时间等）。

**一句话建议**：
如果你的项目是 Spring Boot 3.x，去学一下 **`RestClient`**；如果是 Spring Cloud 微服务，用 **`OpenFeign`**；如果是对接复杂的第三方 API，试试 **`Forest`**。别再手写 `HttpUtils` 了。


拼音命名和魔法数字是维护者的噩梦。新人接手代码完全靠猜。