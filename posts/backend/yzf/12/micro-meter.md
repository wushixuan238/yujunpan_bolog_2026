---
title: "Micrometer"
description: "开发中保持优雅"
date: "2025-12-03"
tags: ["yzf"]
category: "general"
slug: "12-micro-meter"
published: true
---


### 1. 什么是监控埋点？

“埋点”是一个行业术语，可以把它理解为安装传感器。

想象你造了一辆赛车（你的代码）。为了知道赛车运行得怎么样，你不能光靠眼睛看。你需要在发动机里埋入一个温度传感器，在轮子上埋入一个转速传感器。这些传感器采集到的数据（温度 100度、转速 5000转），就是监控数据。


在代码的关键位置（点），插入一段专门用来记录数据的代码（埋）。
*   例子：每当有一个用户登录失败，我就让代码里的计数器 `+1`。
*   目的：为了后续能画出图表（比如 Grafana），让运维和开发看到系统的健康状况（QPS是多少、报错率多少、接口响应时间是多少）。


### 2. Micrometer 是什么包？

**一句话定义：它是 Java 监控界的“SLF4J” / 通用标准。**

*   **它的地位**：
    以前大家记录日志用 Log4j、Logback 等，为了不和具体日志框架绑定，Java 搞出了 **SLF4J** 接口。
    同样的，监控系统有很多种（Prometheus, InfluxDB, Datadog, ElasticSearch 等）。为了让你写一套代码就能适配所有的监控系统，Pivotal 公司（Spring 的母公司）搞出了 **Micrometer**。
*   **它的作用**：
    它定义了一套标准的接口（比如 `Counter` 计数器、`Timer` 计时器、`Gauge` 仪表盘）。
    *   你在代码里只管调 Micrometer 的接口：`counter.increment()`。
    *   Micrometer 负责把这些数据转换成 Prometheus 能看懂的格式，或者 Datadog 能看懂的格式。

### 3. 这个包常用吗？

**非常常用！它是目前 Java 后端开发的工业标准。**

*   **Spring Boot 标配**：
    从 Spring Boot 2.0 开始，**Spring Boot Actuator**（官方的监控模块）底层默认就完全依赖 **Micrometer**。
*   **只要用 Spring Boot 做微服务，几乎 100% 会用到它。**
*   **场景**：
    现在的互联网公司，基本都是 **Spring Boot + Micrometer + Prometheus + Grafana** 这一套监控全家桶。

### 关联你之前的代码

回看你刚才发的 `MailDataFilesMonitorHandler` 代码：

```java
import io.micrometer.core.instrument.Counter; // <--- 看这里
import io.micrometer.core.instrument.Timer;   // <--- 看这里
import io.micrometer.core.instrument.MeterRegistry;

public class MailDataFilesMonitorHandler {
    // ...
    this.noticeTaskCounter = Counter.builder("ai_mailDataFilesNotice_notice_task")...
}
```

看到这些 `import` 了吗？你刚才代码里用的 `Counter`、`Timer`、`MeterRegistry`，**全部都来自你截图里的这个 `micrometer-core` 包**。

所以，作为新入职的校招工程师，掌握 Micrometer 的基本用法（怎么记次数、怎么记耗时）是一项必备技能。


