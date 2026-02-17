---
title: 'Java-正则表达式'
titleJp: ''
date: '2025-12-03'
excerpt: ''
tags: ["yzf"]
---
### 一、Java正则表达式核心定位
作为Java技术领域中字符串模式匹配与处理的核心工具，正则表达式（Regular Expression）本质是**基于有限状态自动机的模式描述语言**，
在Java生态中通过`java.util.regex`包实现标准化落地。其核心价值在于将复杂的字符串校验、提取、替换逻辑抽象为声明式的模式规则，大幅降低字符串处理的代码复杂度，同时保证匹配逻辑的严谨性与可维护性。

### 二、领域级代码实现范式（分层设计+最佳实践）
#### 1. 核心组件认知（领域基础）
Java正则的核心是三个核心类：
- `Pattern`：编译后的正则表达式（不可变、线程安全），是模式的“静态表示”；
- `Matcher`：模式匹配器（非线程安全），是模式在具体字符串上的“动态执行器”；
- `PatternSyntaxException`：正则语法错误的受检异常，需强制处理。

#### 2. 标准化代码实现（分场景落地）
以下实现覆盖**校验、提取、替换、分割**四大核心场景，遵循“预编译Pattern+复用Matcher”的性能优化原则（避免频繁编译正则）。

```java
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;
import java.util.ArrayList;
import java.util.List;

/**
 * 领域级Java正则表达式工具类
 * 遵循：预编译Pattern（线程安全）、按需复用Matcher、显式处理语法异常、场景化封装
 */
public class RegexDomainUtils {

    // ========== 场景1：核心常量（预编译Pattern，避免重复编译） ==========
    // 示例1：手机号校验（符合工信部规范：11位，以1开头，第二位为3-9）
    private static final Pattern PATTERN_MOBILE = Pattern.compile("^1[3-9]\\d{9}$");
    // 示例2：邮箱校验（RFC5322简化版，覆盖主流邮箱格式）
    private static final Pattern PATTERN_EMAIL = Pattern.compile("^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\\.[a-zA-Z0-9-]+)*\\.[a-zA-Z]{2,6}$");
    // 示例3：提取所有数字（整数/小数）
    private static final Pattern PATTERN_NUMBERS = Pattern.compile("\\d+(\\.\\d+)?");
    // 示例4：HTML标签清理（移除所有<>包裹的标签）
    private static final Pattern PATTERN_HTML_TAG = Pattern.compile("<[^>]+>");

    // ========== 场景2：基础校验（返回布尔值，领域最常用） ==========
    /**
     * 手机号合法性校验（领域级规则：符合工信部2025年最新号段规范）
     * @param mobile 待校验手机号
     * @return 校验结果
     * @throws IllegalArgumentException 入参为空时抛出领域异常
     */
    public static boolean isValidMobile(String mobile) {
        if (mobile == null || mobile.isBlank()) {
            throw new IllegalArgumentException("手机号不能为空（领域约束）");
        }
        Matcher matcher = PATTERN_MOBILE.matcher(mobile);
        return matcher.matches(); // 全匹配（区别于find()的部分匹配）
    }

    /**
     * 邮箱合法性校验（领域级规则：兼容企业邮箱/个人邮箱，排除特殊字符）
     */
    public static boolean isValidEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("邮箱不能为空（领域约束）");
        }
        return PATTERN_EMAIL.matcher(email).matches();
    }

    // ========== 场景3：模式提取（从字符串中提取目标数据） ==========
    /**
     * 提取字符串中所有数字（整数/小数），返回结构化列表（领域级数据封装）
     * @param content 待提取内容
     * @return 数字列表（空列表而非null，符合领域空值规范）
     */
    public static List<String> extractNumbers(String content) {
        List<String> result = new ArrayList<>();
        if (content == null || content.isBlank()) {
            return result; // 空安全设计
        }
        Matcher matcher = PATTERN_NUMBERS.matcher(content);
        while (matcher.find()) { // 遍历所有匹配项
            result.add(matcher.group()); // 提取匹配结果
        }
        return result;
    }

    // ========== 场景4：内容替换（清洗/格式化字符串） ==========
    /**
     * 移除字符串中所有HTML标签（领域级文本清洗）
     */
    public static String removeHtmlTags(String htmlContent) {
        if (htmlContent == null || htmlContent.isBlank()) {
            return "";
        }
        return PATTERN_HTML_TAG.matcher(htmlContent).replaceAll(""); // 替换为空
    }

    // ========== 场景5：正则语法校验（领域级异常处理） ==========
    /**
     * 校验自定义正则表达式的语法合法性
     * @param regex 自定义正则
     * @return 语法是否合法
     */
    public static boolean isRegexSyntaxValid(String regex) {
        try {
            Pattern.compile(regex); // 编译失败则抛出PatternSyntaxException
            return true;
        } catch (PatternSyntaxException e) {
            // 领域日志记录（此处简化为打印，实际应接入日志框架）
            System.err.println("正则语法错误（领域异常）：" + e.getDescription() 
                    + "，错误索引：" + e.getIndex() + "，正则：" + e.getPattern());
            return false;
        }
    }

    // ========== 测试入口（领域验证） ==========
    public static void main(String[] args) {
        // 1. 手机号校验
        System.out.println("手机号13800138000是否合法：" + isValidMobile("13800138000")); // true
        System.out.println("手机号12800138000是否合法：" + isValidMobile("12800138000")); // false

        // 2. 邮箱校验
        System.out.println("邮箱test@example.com是否合法：" + isValidEmail("test@example.com")); // true
        System.out.println("邮箱test@.com是否合法：" + isValidEmail("test@.com")); // false

        // 3. 数字提取
        String content = "订单金额：99.9元，优惠10元，实付89.9元";
        System.out.println("提取的数字：" + extractNumbers(content)); // [99.9, 10, 89.9]

        // 4. HTML标签移除
        String html = "<div>Hello <span>World</span></div>";
        System.out.println("移除HTML后：" + removeHtmlTags(html)); // Hello World

        // 5. 正则语法校验
        System.out.println("正则\\d+是否合法：" + isRegexSyntaxValid("\\d+")); // true
        System.out.println("正则\\d+[是否合法：" + isRegexSyntaxValid("\\d+[")); // false
    }
}
```

### 三、领域级设计原则与最佳实践
1. **性能优化**：
    - 预编译`Pattern`并声明为`static final`（正则编译是耗时操作，复用可提升性能）；
    - 避免在循环内编译Pattern，优先复用Matcher（通过`reset()`方法重置匹配字符串）。

2. **安全性设计**：
    - 空值防御：所有方法先校验入参是否为null/空字符串，避免NPE；
    - 异常隔离：`PatternSyntaxException`需显式捕获，转化为领域可理解的异常信息。

3. **可维护性**：
    - 场景化封装：按“校验/提取/替换/分割”等领域场景封装方法，而非暴露底层API；
    - 正则注释：复杂正则需添加领域注释（如手机号正则标注“符合工信部2025号段规范”）；
    - 常量命名：Pattern常量命名需体现业务语义（如`PATTERN_MOBILE`而非`PATTERN_1`）。

4. **语义匹配原则**：
    - `matches()`：全字符串匹配（适用于校验场景，如手机号/邮箱）；
    - `find()`：部分匹配（适用于提取场景，如提取数字）；
    - `lookingAt()`：从字符串开头匹配（适用于前缀校验）。

### 四、领域级避坑指南
1. 避免过度依赖正则：复杂结构化文本（如JSON/XML）优先使用专用解析库（如Jackson/DOM4J），正则仅适用于简单模式匹配；
2. 转义字符处理：Java中反斜杠`\`需双重转义（如匹配`.`需写`\\.`），避免语法错误；
3. 贪婪匹配陷阱：默认`*`/`+`为贪婪匹配，需按需使用非贪婪模式（`*?`/`+?`），如提取`<a>xxx</a>`需用`<a>.*?</a>`；
4. 性能边界：超长字符串（如10万字符以上）的正则匹配需测试性能，避免回溯过深导致OOM。

综上，Java正则表达式的领域级应用核心是“**场景化封装+性能优化+异常安全**”，将正则作为字符串处理的“工具”而非“银弹”，结合业务领域规则设计可复用、易维护的正则工具类。