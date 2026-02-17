---
title: "Scatter-Gather（分�?收集）模�?
description: "设计模式"
date: "2025-12-12"
tags: ["design-pattern"]
category: "general"
slug: "scatter-gather"
published: true
---

# 拒绝串行：利�?Scatter-Gather 模式优化聚合接口延迟

作为一名在分布式系统和高并发领域摸爬滚打多年的架构师，我经常看到初级工程师在处理聚合业务时写出“串行化”的代码，导致接口响应时间随着依赖服务的增加而线性增长�?

今天，我们深入探�?**Scatter-Gather（分�?收集）模�?*，并结合 Java 8 �?`CompletableFuture` 以及 Java 21 �?`Virtual Threads`（虚拟线程）来展示如何优雅地落地这一模式�?

---

## 1. 场景引入：那个越来越慢的聚合接口

假设你正在负责一�?*旅游比价平台**（Aggregator）的后端开发。用户的需求很简单：输入“北京”到“上海”的机票，系统需要展示来自“携程”、“飞猪”、“去哪儿”以及各大航司官网的最低价格�?

### 糟糕的实现（串行化）

最直观的写法是这样的：

```java
public List<FlightPrice> searchFlights(String from, String to) {
    List<FlightPrice> results = new ArrayList<>();
    
    // 1. 查询航司A (耗时 200ms)
    results.addAll(airlineAService.search(from, to));
    
    // 2. 查询航司B (耗时 300ms)
    results.addAll(airlineBService.search(from, to));
    
    // 3. 查询OTA平台C (耗时 500ms)
    results.addAll(otaCService.search(from, to));
    
    // 排序并返�?
    return sortPrices(results);
}
```

问题显而易见，用户的总等待时间是所有依赖服务耗时�?*总和**�?00 + 300 + 500 = 1000ms）。如果后续接入了�?0个供应商，接口可能会超时�?

## 2. 模式解析：Scatter-Gather

**Scatter-Gather** 模式的核心思想是将一个大任务拆解为多个独立的子任务，**并行**地分发（Scatter）给多个处理器去执行，最后等待所有（或部分）结果返回，将其聚合（Gather）成最终结果�?

*   **Scatter (分散/广播)�?* 并发发起请求（Fan-out）�?
*   **Gather (收集/聚合)�?* 收集结果，处理超时和异常（Fan-in）�?

**优化目标�?* 接口的总耗时将取决于**最�?*的那个子任务（Max Latency），而不是总和。在上面的例子中，理论耗时将从 1000ms 降至 500ms�?

---

## 3. 实战案例：Java 8+ CompletableFuture 方案

�?Java 21 普及之前，`CompletableFuture` 是处理此类问题的瑞士军刀。它提供了非阻塞的编排能力�?

### 3.1 基础设施准备

首先，我们定义一个模拟的供应商接口和数据结构。为了简洁，我们使用 Java 17 �?`record`�?

```java
// 航班价格数据结构
public record FlightPrice(String provider, String flightNo, double price) {}

// 模拟供应商服务接�?
public interface FlightProvider {
    // 这是一个可能耗时的远程调�?
    List<FlightPrice> search(String from, String to);
    String getName();
}
```

### 3.2 核心实现

我们需要考虑两个生产环境的关键点�?
1.  **超时控制�?* 某个供应商挂了不能拖死整个接口�?
2.  **异常处理�?* 某个供应商抛出异常，不应影响其他供应商的结果�?

```java
import java.util.Collections;
import java.util.List;
import java.util.concurrent.*;
import java.util.stream.Collectors;

public class FlightAggregator {

    // 自定义线程池，千万不要用默认�?ForkJoinPool.commonPool() 处理 IO 密集型任务！
    private final ExecutorService executor = Executors.newFixedThreadPool(20);
    private final List<FlightProvider> providers;

    public FlightAggregator(List<FlightProvider> providers) {
        this.providers = providers;
    }

    public List<FlightPrice> searchAll(String from, String to) {
        
        // --- 1. Scatter (分散) ---
        List<CompletableFuture<List<FlightPrice>>> futures = providers.stream()
            .map(provider -> CompletableFuture
                .supplyAsync(() -> provider.search(from, to), executor)
                // 关键点：每个任务单独设置超时，比�?800ms
                .orTimeout(800, TimeUnit.MILLISECONDS) 
                // 关键点：异常兜底（比如超时或网络错），返回空列表，不要抛出异常打断流�?
                .exceptionally(ex -> {
                    System.err.println("Provider " + provider.getName() + " failed: " + ex.getMessage());
                    return Collections.emptyList();
                })
            )
            .collect(Collectors.toList());

        // --- 2. Gather (收集) ---
        // 等待所有任务完�?(join)
        CompletableFuture<Void> allDone = CompletableFuture.allOf(
            futures.toArray(new CompletableFuture[0])
        );

        // 阻塞主线程直到所有任务结束（或者超时被 exceptionally 处理掉）
        // 生产代码中，这里通常结合 Spring WebFlux 或异�?Servlet 实现完全非阻塞，
        // 但为了演示清晰，我们这里使用 join() 阻塞等待结果�?
        allDone.join();

        // 提取结果并合�?
        return futures.stream()
            .map(CompletableFuture::join) // 此时 join 不会阻塞，因�?allDone 已经完成
            .flatMap(List::stream)
            .sorted(java.util.Comparator.comparingDouble(FlightPrice::price))
            .collect(Collectors.toList());
    }
}
```

### 专家解读
*   **线程池隔离：** 代码中显式使用了 `executor`。在生产中，如果你依�?HTTP 客户端（�?OkHttp），通常客户端本身支持异步回调，那样性能更好。如果必须把同步阻塞代码包装成异步，务必使用独立的线程池，防止耗尽 CPU 密集型线程池�?
*   **Partial Failure（部分失败）�?* 注意 `.exceptionally` 的使用。在微服务架构中�?*“部分可用性�?* 优于 **“整体不可用�?*。如果飞猪挂了，用户至少还能看到携程的价格�?

---

## 4. 进阶方案：Java 21 Virtual Threads (结构化并�?

如果你的项目已经升级到了 Java 21，那�?`CompletableFuture`那种回调地狱（Callback Hell）或者复杂的链式调用就可以扔掉了�?

Java 21 引入�?**虚拟线程（Virtual Threads�?* �?**结构化并发（Structured Concurrency�?*。这让我们可以用“同步的代码风格”写出“异步的高性能”�?

### 4.1 使用 StructuredTaskScope

这是一个革命性的 API，它明确�?Scatter-Gather 的生命周期范围�?

```java
import java.util.concurrent.StructuredTaskScope;
import java.util.concurrent.ExecutionException;
import java.util.function.Supplier;

public class FlightAggregatorJava21 {

    private final List<FlightProvider> providers;

    public FlightAggregatorJava21(List<FlightProvider> providers) {
        this.providers = providers;
    }

    public List<FlightPrice> searchAll(String from, String to) {
        // 使用 try-with-resources 自动关闭 Scope
        // 这里不需要定义复杂的线程池，虚拟线程非常廉价
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            
            // --- Scatter ---
            // 存储 Subtask 用于后续提取结果
            List<StructuredTaskScope.Subtask<List<FlightPrice>>> subtasks = providers.stream()
                .map(provider -> scope.fork(() -> {
                    // 模拟简单的超时控制，实际网络库通常自带 timeout
                    // 在虚拟线程中，阻塞是非常廉价�?
                    return provider.search(from, to); 
                }))
                .toList();

            // --- Gather ---
            // 这里我们希望“尽可能多地拿结果”，而不是像 ShutdownOnFailure 那样一旦出错就中断�?
            // 实际场景通常自定�?Scope，或者简单地 join 后检查状态�?
            
            // 为了演示简单，我们允许所有任务跑完，不管成功失败
            scope.join(); 
            // scope.throwIfFailed(); // 如果想要有一个失败就全部失败，可以调用这�?
            
            // 聚合结果
            return subtasks.stream()
                .filter(t -> t.state() == StructuredTaskScope.Subtask.State.SUCCESS)
                .map(StructuredTaskScope.Subtask::get)
                .flatMap(List::stream)
                .sorted(java.util.Comparator.comparingDouble(FlightPrice::price))
                .toList();
                
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException(e);
        }
    }
}
```

*注意：`StructuredTaskScope` �?Java 21 中可能是预览功能（Preview），具体取决于具体小版本，但它是未来的方向�?

---

## 5. 领域专家的避坑指�?

在落�?Scatter-Gather 模式时，有几个隐蔽的坑需要注意：

### 1. 长尾效应（Tail Latency�?
如果 Scatter 分发给了 10 个服务，其中 9 个都�?50ms 内返回，唯独�?10 个因�?GC 或网络抖动卡�?2 秒。你的接口响应时间就�?2 秒�?
**解决方案�?*
*   **SLA 熔断�?* 设置严格�?`orTimeout`。例如业务要�?1s 内必须返回，那就设置 800ms 超时，舍弃掉超时的结果�?
*   **Backup Request（对冲请求）�?* Google 提出的策略。如果前 95% 的请求通常�?50ms 返回，那么在 60ms 时如果还没收到结果，就向同一个服务发第二个请求，谁先回用谁。这能极大消灭长尾延迟�?

### 2. 线程池爆�?
在使�?`CompletableFuture` 时，如果不指�?Executor，默认使用的�?`ForkJoinPool.commonPool()`。这个池子的核心线程数等�?CPU 核数-1�?
**后果�?* 如果你的任务�?I/O 密集型（如查数据库、调 HTTP），几下就把公共池占满了，导致整�?JVM 内其他依赖该池的任务（如 Parallel Stream）全部卡死�?
**必须�?* �?I/O 任务提供独立�?`ThreadPoolExecutor`�?

### 3. 数据一致性与排序
Scatter-Gather 拿到的结果是无序的（取决于谁先返回）�?
**注意�?* 永远不要假设结果的顺序，必须�?Gather 阶段显式进行 `sort` �?`merge` 操作�?

## 总结

Scatter-Gather 是提升聚合类微服务性能的法宝�?
*   对于 **Java 8-17** 用户：精�?`CompletableFuture`，注意线程池隔离和异常兜底�?
*   对于 **Java 21+** 用户：拥抱虚拟线程和结构化并发，代码更易读，资源利用率更高�?


## Python �?Go

继续来看看这两种在云原生和微服务时代非常流行的语言:Python和Go，是如何优雅地处�?**Scatter-Gather** 模式的�?

这两种语言处理并发的哲学与 Java 截然不同�?
*   **Python (asyncio):** 单线�?+ 事件循环（Event Loop），通过协程（Coroutine）榨�?I/O 等待时间�?
*   **Go (Goroutines):** CSP 模型（通信顺序进程），轻量级线�?+ 通道（Channel），号称“为并发而生”�?

我们依然保持之前的场景：**从多个供应商聚合机票价格**�?

---

# Python 篇：拥抱 `asyncio` 的优�?

�?Python 3.7+ 之后，`asyncio` 已经非常成熟。对�?IO 密集型任务（比如调用 HTTP 接口），Python 的协程比多线程更高效，因为它没有线程上下文切换的开销，也不受制于 GIL（全局解释器锁）在计算上的限制（因�?IO 时会释放 GIL）�?

### 核心武器：`asyncio.gather`

`asyncio.gather` 就是 Python 版的 Scatter-Gather 标准实现�?

```python
import asyncio
import random
from dataclasses import dataclass, field
from typing import List

# 1. 定义数据结构
@dataclass
class FlightPrice:
    provider: str
    price: float

# 2. 模拟供应商接�?
class FlightProvider:
    def __init__(self, name):
        self.name = name

    async def search(self, origin, dest) -> List[FlightPrice]:
        # 模拟网络延迟 (Scatter)
        delay = random.uniform(0.1, 0.5) 
        # 模拟偶尔的长尾延迟或超时
        if "Slow" in self.name:
            delay = 2.0 
            
        await asyncio.sleep(delay) # 非阻塞等�?
        
        # 模拟偶尔报错
        if random.random() < 0.1:
            raise ConnectionError(f"{self.name} connection failed")

        print(f"[{self.name}] finished in {delay:.2f}s")
        return [FlightPrice(self.name, random.randint(500, 1500))]

# 3. 聚合逻辑 (Gather)
async def search_all_flights(origin: str, dest: str, providers: List[FlightProvider]):
    # --- Scatter ---
    # 创建 Task 列表
    tasks = [
        asyncio.create_task(p.search(origin, dest)) 
        for p in providers
    ]

    # --- Gather ---
    # return_exceptions=True 是关键！
    # 如果设为 False (默认)，只要有一个任务抛异常，gather 就会立即抛出异常，丢失其他已成功的结果�?
    # 设为 True 后，异常会被当做结果返回�?
    results_mixed = await asyncio.gather(*tasks, return_exceptions=True)

    final_results = []
    
    # 处理结果 (过滤掉异�?
    for res in results_mixed:
        if isinstance(res, Exception):
            # 记录日志，做监控打点
            print(f"Error captured: {res}")
        else:
            final_results.extend(res)

    # 排序
    final_results.sort(key=lambda x: x.price)
    return final_results

# 4. 带有整体超时控制的入�?
async def main():
    providers = [
        FlightProvider("Ctrip"),
        FlightProvider("Fliggy"),
        FlightProvider("Qunar"),
        FlightProvider("Slow-Airline"), # 这个必然超时
    ]

    try:
        # 使用 wait_for 控制整体接口 SLA (比如 800ms)
        # 注意：asyncio.gather 本身不带超时，需要外层包�?
        flights = await asyncio.wait_for(search_all_flights("PEK", "SHA", providers), timeout=0.8)
        
        print("\\
--- Final Results ---")
        for f in flights:
            print(f)
            
    except asyncio.TimeoutError:
        # 这里是整个接口层面的超时
        # 实际生产中，更好的做法是�?search_all_flights 内部给每�?task 单独加超时，
        # 或者在这里拿到已经完成的部分结果（稍复杂，需�?asyncio.wait 代替 gather�?
        print("CRITICAL: Aggregate search timed out!")

if __name__ == "__main__":
    asyncio.run(main())
```

### 专家点评 (Python)
1.  **`return_exceptions=True`�?* 这是 Python `gather` 模式中最容易被初级工程师忽略的参数。不加它，系统非常脆弱�?
2.  **GIL 误区�?* 很多人说 Python 慢。但在微服务聚合这种 IO 密集型场景下，Python �?`asyncio` 性能极强，完全能够胜任高并发网关的角色（比如 FastAPI 框架）�?
3.  **超时策略�?* `asyncio.wait_for` 会取消（Cancel）内部未完成的任务。在�?`search` 方法时，如果涉及数据库连接池等资源释放，要注意处�?`CancelledError`，防止资源泄漏�?

---

# Go 篇：通道（Channel）与 Context 的艺�?

Go 语言通过 Goroutine 将并发变得极其廉价。在 Go 中实�?Scatter-Gather，核心哲学是�?*Do not communicate by sharing memory; share memory by communicating.** (不要通过共享内存来通信，而要通过通信来共享内�?�?

我们使用 `Channel` 来收集结果，使用 `Context` 来控制超时�?

```go
package main

import (
	"context"
	"fmt"
	"math/rand"
	"sort"
	"sync"
	"time"
)

// 1. 定义数据结构
type FlightPrice struct {
	Provider string
	Price    float64
}

// 模拟供应商搜�?
func searchProvider(ctx context.Context, name string) ([]FlightPrice, error) {
	// 模拟耗时，可能长可能�?
	sleepTime := time.Duration(rand.Intn(1000)) * time.Millisecond
	if name == "Slow-Airline" {
		sleepTime = 2 * time.Second
	}

	// 模拟 select 监听 context 取消，这�?Go 协程的标准范�?
	select {
	case <-time.After(sleepTime):
		// 模拟随机错误
		if rand.Float32() < 0.1 {
			return nil, fmt.Errorf("connection error")
		}
		return []FlightPrice{{Provider: name, Price: float64(rand.Intn(1000) + 500)}}, nil
	case <-ctx.Done():
		// 如果上下文超时或被取消，立即返回，不要继续占用资�?
		return nil, ctx.Err()
	}
}

// 2. 聚合�?(Scatter-Gather 核心)
func searchAll(origin, dest string) []FlightPrice {
	// 设置硬�?SLA 超时�?00ms
	ctx, cancel := context.WithTimeout(context.Background(), 800*time.Millisecond)
	defer cancel() // 确保退出时释放资源

	providers := []string{"Ctrip", "Fliggy", "Qunar", "Slow-Airline"}
	
	// 创建带缓冲的 Channel，容量等于并发数，防止协程阻塞泄�?
	resultCh := make(chan []FlightPrice, len(providers))
	
	// 使用 WaitGroup 仅仅为了确定所有协程发起了（或者用�?Graceful Shutdown），
	// 但在这里，我们主要靠 Channel �?Context�?
	// 另一种常见的写法是不等待 WG，直接用 for range �?Channel�?
	
	// --- Scatter ---
	for _, p := range providers {
		go func(name string) {
			// 传入 ctx 以便感知超时
			res, err := searchProvider(ctx, name)
			if err != nil {
				// 记录日志...
				fmt.Printf("[%s] Error: %v\n", name, err)
				resultCh <- nil // 发送空或者错误标�?
				return
			}
			fmt.Printf("[%s] Success\n", name)
			resultCh <- res
		}(p)
	}

	// --- Gather ---
	var allFlights []FlightPrice
	
	// 收集结果。因为我们知道发起了 len(providers) 个任务，所以循环这么多次�?
	for i := 0; i < len(providers); i++ {
		select {
		case res := <-resultCh:
			if res != nil {
				allFlights = append(allFlights, res...)
			}
		case <-ctx.Done():
			// 整个接口已经超时，不再等待剩余的结果
			fmt.Println("Global Timeout reached! Returning partial results.")
			goto FINISH
		}
	}

FINISH:
	// 排序
	sort.Slice(allFlights, func(i, j int) bool {
		return allFlights[i].Price < allFlights[j].Price
	})
	return allFlights
}

func main() {
	start := time.Now()
	results := searchAll("PEK", "SHA")
	fmt.Printf("\nTotal Time: %v\n", time.Since(start))
	for _, f := range results {
		fmt.Printf("%+v\n", f)
	}
}
```

### 专家点评 (Go)
1.  **Buffered Channel（缓冲通道）：** 代码�?`make(chan ..., len(providers))` 非常关键。如果使用无缓冲通道（Unbuffered Channel），且接收方因为超时提前退出了 (`goto FINISH`)，那么那些慢�?Goroutine 在尝试写�?Channel 时就会永久阻塞（Goroutine Leak），最终导致内存撑爆�?*这是 Go 并发最常见的坑�?*
2.  **Context 传递：** �?`ctx` 传递进 `searchProvider` �?Go 的最佳实践。这样底�?I/O 可以在超时发生时立即中断连接，而不是傻傻地执行完再发现没人接收结果�?
3.  **部分失败处理�?* Go 提倡显式的错误处理。在这个模式中，我们通常忽略单个协程的错误（或者记录日志），以保证聚合结果尽可能多�?

---

# 总结：语言选型建议

如果你的团队正在面临技术选型，针�?Scatter-Gather 这种 IO 密集型聚合场景：

1.  **Java (Virtual Threads):** 如果你们�?Java 栈，直接�?Java 21。代码结构性和类型安全性最好，生态最全�?
2.  **Go:** 如果你们追求极致的资源利用率（Docker 镜像极小，启动极快），或者在做高性能网关（Gateway），Go 是首选。它�?Channel 机制处理并发非常直观�?
3.  **Python:** 如果你的业务逻辑非常复杂（涉及大量数据处理、AI 逻辑），且对几毫秒的额外延迟不敏感，`asyncio` 开发效率最高，代码最简洁�?

**作为架构师，无论选哪种语言，核心关注点永远不变�?*
1.  **超时控制 (Timeouts)** - 别让慢服务拖死你�?
2.  **异常隔离 (Fault Tolerance)** - 别让一个坏鸡蛋毁了一锅粥�?
3.  **并发数控�?(Backpressure)** - 别把自己发出的请求变成了对下游的 DDoS 攻击�?

希望这篇实战分享能帮你优化掉那个慢如蜗牛的聚合接口！如有疑问，欢迎在评论区讨论�