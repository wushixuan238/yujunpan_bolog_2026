---
title: "防御性编程思维"
description: "防御性编程思维"
date: "2025-02-01"
tags: ["yzf"]
category: "general"
slug: "12-fangyu"
published: true
---

写微服务业务代码时最让人头疼的莫过于在Service层调用第三方SDK或远程Feign接口。每次调用都要写一大堆重复的异常捕获和状态码判断，核心业务逻辑反而被这些防御性代码淹没，维护起来非常费劲。如果想统一修改日志格式或者增加监控埋点，还得满世界去改代码，这种机械劳动确实让人很难受。

其实我们可以换个思路，借鉴环绕通知的思想，利用Java 8的Supplier接口把动作与保障分离。核心逻辑就是你只管提供调用的动作，剩下的安全执行和结果校验交给工具类来处理。

我们可以定义一个名为ApiInvoker的工具类。这个类接收一个Supplier作为执行动作，同时接收失败提示文案和上下文参数。代码实现里，我们把try catch逻辑封装在execute方法内部。首先执行传入的动作，然后对结果进行统一的校验解析。如果成功就返回数据，如果失败或者出现异常，就结合传入的上下文参数统一记录警告或错误日志，并抛出对应的业务异常。

有了这个工具类，业务代码瞬间就变得清爽多了。

原本冗长的try catch块现在只需要一行代码就能搞定。我们不再需要反复编写if判断去检查状态码是否为200，而是直接声明我们要获取数据，同时指定获取失败时的兜底报错信息。这种声明式的写法让代码读起来更接近自然语言，业务意图一目了然。

这种封装方式带来的好处远不止代码变短这么简单。它实现了业务逻辑与基础设施的彻底解耦。业务层只需要关心参数和结果，而日志格式、异常映射甚至耗时统计这些杂活都交给了工具层。后续如果系统需要接入Resilience4j这样的熔断降级组件，我们只需要修改ApiInvoker内部的逻辑，整个系统的所有接口调用就能立刻享受到熔断保护，完全不需要改动任何业务代码。

代码的整洁度往往能体现出架构思考的深度。通过简单的函数式封装，我们建立了一套标准化的资源访问模式。下次再遇到需要写try catch的场景，不妨试试用Lambda把它包装得更优雅一些。

```java
@Slf4j
public class ApiInvoker {

    public static <T> T execute(Supplier<AjaxResult<T>> action, String errorMsg, Object context) {
        try {
            AjaxResult<T> result = action.get();
            
            if (result != null && result.isSuccess()) {
                return result.getData();
            }
            
            log.warn("{} 上下文 {} 响应 {}", errorMsg, JSON.toJSONString(context), JSON.toJSONString(result));
            throw new BizRuntimeException(errorMsg);
            
        } catch (Exception e) {
            log.error("{} 严重异常 上下文 {} 堆栈 {}", errorMsg, JSON.toJSONString(context), ExceptionUtils.getStackTrace(e));
            throw new BizRuntimeException(errorMsg);
        }
    }
}
```

```java
@Journal(value = "#chatMessageRequest.taskId")
public void handleTaxConfirmationMessage(ChatMessageRequest request) {
    List<IntentChatRecordSplitVO> splitVOList = ApiInvoker.execute(
        () -> intentRecognitionClient.findChatRecordSplitById(request.getMessageIds()), 
        "查询分割消息失败", 
        request
    );

    if (CollUtil.isEmpty(splitVOList)) return;

    // 继续后续流程
}
```