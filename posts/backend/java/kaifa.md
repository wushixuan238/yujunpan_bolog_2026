---
title: "Spring 最佳实践"
description: "Spring 最佳实践"
date: "2025-10-04"
tags: ["backend"]
category: "backend"
slug: "Spring 最佳实践"
published: true
---


# Spring Boot Controller

咱们来聊聊怎么把 Spring Boot 的 Controller 写得漂亮点。这一块儿通常是代码腐化的重灾区，经常能看到充斥着大量 try catch 块和手动参数校验的逻辑，看着特别心累。其实按照业界目前比较推崇的思路，Controller 应该尽量做薄，它只需要专注于三件事，接收参数并校验，调用 Service 处理业务，最后把结果封装好返回去。

先说返回值，直接把 Entity 或者 HashMap 扔给前端的做法非常不可取。最好定义一个通用的泛型结果类，里面包含状态码、提示信息和数据本体。写两个静态方法来快速生成成功或失败的响应，这样调用起来会顺手很多。

```java
@Data
public class Result<T> {
    private Integer code;
    private String message;
    private T data;

    public static <T> Result<T> success(T data) {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMessage("Success");
        result.setData(data);
        return result;
    }

    public static <T> Result<T> error(Integer code, String msg) {
        Result<T> result = new Result<>();
        result.setCode(code);
        result.setMessage(msg);
        return result;
    }
}
```

再就是异常处理，一定要把 Controller 里面那些丑陋的 try catch 全都清理掉。我们可以利用全局异常处理器来统一兜底。通过 RestControllerAdvice 注解，无论是业务异常、参数校验失败还是未知的系统错误，都能被拦截下来，转化成标准的结果格式返回给调用方。

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public Result<?> handleBusinessException(BusinessException e) {
        log.error("业务异常: {}", e.getMessage());
        return Result.error(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<?> handleValidationException(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        return Result.error(400, msg);
    }

    @ExceptionHandler(Exception.class)
    public Result<?> handleException(Exception e) {
        log.error("系统异常", e);
        return Result.error(500, "系统繁忙，请稍后再试");
    }
}
```

参数校验也别在代码里手动写 if 判断了。利用 JSR 303 标准，直接在 DTO 对象的字段上加上 NotBlank 或者 Min 这样的注解。然后在 Controller 的参数列表里加个 Validated 注解，框架就能自动帮你完成校验工作。

```java
@Data
public class UserDTO {
    @NotBlank(message = "用户名不能为空")
    private String username;

    @Min(value = 18, message = "年龄必须大于18岁")
    private Integer age;
}
```

这里还要强调一点，尽量避免直接把数据库实体类暴露出去。接收参数就用 DTO，返回数据就用 VO，中间的对象转换可以用 BeanUtils 或者 MapStruct 这种工具来处理，这样能保证接口定义的纯粹和安全。至于日志记录，也没必要在每个方法里重复写，搞个 AOP 切面，统一把请求的入参、出参和执行耗时打印出来，代码会清爽很多。

看看改造前后的对比就很明显。以前那种几十行代码，混杂着各种逻辑判断和异常捕获的写法，现在变成了寥寥几行。

改造后的代码风格如下：

```java
@PostMapping("/add")
public Result<Void> addUser(@RequestBody @Validated UserDTO userDTO) {
    userService.add(userDTO);
    return Result.success(null);
}
```

校验交给注解，业务交给 Service，异常交给全局处理器，整个方法体显得非常干净。

其实这种改造的核心逻辑就是关注点分离。Controller 只要做好 HTTP 协议层面的对接工作就好，剩下的复杂逻辑，全部下沉到该去的地方。虽然有个进阶技巧是利用 ResponseBodyAdvice 自动包装返回值，但为了代码的可读性，我个人还是更倾向于显式调用 Result.success 方法，这样看起来更直观。