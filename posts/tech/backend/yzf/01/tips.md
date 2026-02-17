


这是一个非常经典且高频的面试题，也是现代 Spring 开发的最佳实践。

Spring 官方团队（包括 Spring Boot 文档）明确推荐使用 **构造器注入（Constructor Injection）**，而不是字段注入（Field Injection，即直接在字段上写 `@Autowired`）。

结合 Lombok 的 `@RequiredArgsConstructor` + `private final`，这通常被视为“黄金搭档”。它比 `@Autowired` 更好。

