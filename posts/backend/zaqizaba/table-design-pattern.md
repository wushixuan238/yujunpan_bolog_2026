---
title: "数据库表设计格式与规范"
description: "消除由于随意带来的技术债"
date: "2025-11-20"
tags: ["backend"]
category: "general"
slug: "database-design"
published: true
---

# 数据库表设计规范

在软开中，大团队和小团队的技术区别其实往往不是差的太多，但是对于规矩和套路，大团队明显会有着自己的一套规矩和套路。好的套路和规范不一定能让我们成为高手，But definitely，它绝对能保住下限，防止你写出让后来者想骂的屎山代码。

今天我们要聊的，就是后端开发中最基础、也最重要的环节——**数据库表设计**。很多时候，所谓的技术债往往源于早期随意的表结构设计：随性的命名、物理删除的隐患、主键的滥用以及无脑的字段扩展。

## 命名规范

很多初级程序员在命名上非常随意，这给后期维护带来了巨大的认知负担。以下是必须遵守的：

1. **全小写 + 下划线**：这是最通用的标准。

   - ❌ 错误：`CreateAt`, `User-Info`
   - ✅ 正确：`created_at`, `user_info`
   - 理由：不同数据库系统（如 Windows 下的 MySQL 和 Linux 下的 MySQL）对大小写敏感度不同，全小写能避免跨平台迁移时的问题。

2. **表名用单数**：

   - ❌ 错误：`employees`
   - ✅ 正确：`employee`
   - 理由：表明通常使用单数（User vs Users）,在团队内部统一即可，推荐单数。统一规范，别给自己找麻烦。

3. **严禁使用拼音首字母**：

   - ❌ 错误：`wx_pd` (谁知道这是微信频道，还是维修跑单？)
   - ✅ 正确：`wechat_channel`
   - 理\*：代码是给人看的，别让后来者猜谜语。

4. **避免保留字**：

   - ❌ 错误：`order`, `group`, `desc`
   - ✅ 正确：`user_order`, `order_record`
   - 理由：写 SQL 时需要加反引号非常麻烦，且容易报错。

5. **蛇形命名法**：

   - 如果一个字段由多个单词组成，必须用下划线隔开（如 `user_status`），严禁连在一起写。

---

## 标准字段：每张表的标配

不管你的业务是什么，每张表（尤其是业务核心表）都应该包含一套**基础字段**。这就像编程中的基类一样。

#### 1. ID 的设计 (主键)

- **类型**：`BigInt` (或字符串类型，视数据库而定)。
- **策略**：
  - **单体应用**：可以使用自增 ID，但要小心数据迁移问题。
  - **分布式/分库分表**：**严禁使用自增 ID**。因为自增 ID 在合并数据或双写时会产生冲突。
  - **推荐**：使用**雪花算法 (Snowflake)** 生成的 ID，或者 UUID（但在 MySQL 中 UUID 导致索引性能较差，建议用有序的雪花算法 ID）。

#### 2. 审计字段（管理字段）

每条数据必须包含以下几个字段，用于追踪数据来源和变更：

- `features` json (扩展属性,JSON,通常为了应对原来表中比较灵活的字段，有的表有，有的表无，或者为了扩展留下的口子。)
- `created_by` (创建人 ID)
- `created_time` (创建时间)
- `updated_by` (修改人 ID)
- `updated_time` (修改时间)

#### 3. 逻辑删除 (Soft Delete)

**严禁物理删除业务数据！** 一旦误删，恢复成本极高。必须使用逻辑删除。

- **进化版设计**：
  - 初级做法：`is_deleted` (0 或 1)。
    - 缺点：如果字段上有唯一索引（Unique Index），删除后无法再插入相同数据。
  - 高级做法：**`delete_time` (删除时间戳)**。
    - **逻辑**：默认值为 0 或 NULL。当需要删除时，填入当前时间戳。
    - **优势**：唯一索引可以设计为 `(business_key, delete_time)`。这样，未删除的数据（`delete_time=0`）必须唯一，而删除后的数据（`delete_time=时间戳`）因为时间不同，不会触发唯一性冲突。

#### 4. 乐观锁 (Version)

- **字段名**：`revision` 或 `version`。
- **作用**：解决并发修改问题。
- **场景**：用户 A 和用户 B 同时读取了数据版本 V1。A 修改提交后版本变 V2。B 提交时发现当前版本是 V2 而自己手持 V1，提交失败。这比数据库行锁更轻量。

---

## 扩展性设计：预留后路

业务需求永远在变。为了避免频繁执行 `ALTER TABLE`（在大数据量下会导致锁表），我们需要预留扩展空间。

- **JSON 字段大法**：
  - **字段名**：`features`, `extra`, `attributes`。
  - **类型**：`JSON` (MySQL 5.7+, PostgreSQL)。
  - **用法**：对于非核心检索字段、未来可能增加的属性、或者稀疏数据，直接丢进这个 JSON 字段里。
  - **优势**：无需修改表结构即可“加字段”，极大提升了生产环境的灵活性。

---

## 索引与性能：快就是硬道理

设计好表结构后，查询性能主要靠索引。

1. **复合索引与最左前缀原则**：

   - 不要给每个字段单独建索引。
   - 如果你建立了复合索引 `(A, B, C)`，它相当于同时建立了 `(A)`, `(A, B)`, `(A, B, C)` 三个索引。
   - 查询条件必须从最左边开始匹配。如果你只查 `B` 或 `C`，这个索引是无效的。

2. **索引覆盖 (Index Covering)**：

   - 这是性能优化的必杀技。如果你的查询结果（Select 的字段）和查询条件都在索引里，数据库就**不需要回表**去查具体的数据行，直接从索引树上就能把数据返回给你。速度极快。

3. **选择性 (Cardinality)**：

   - 不要在区分度低的字段上建索引。
   - ❌ 例子：`gender` (只有男/女)。
   - ✅ 例子：`user_id` (几乎每个都不同)。
   - **理由**：如果在“性别”上建索引，数据库发现要扫描一半的数据，它通常会直接放弃索引走全表扫描，索引建了也是白建。

---

## 总结：一个标准的建表模板

综合以上所有点，一个优秀的、能抗住业务演进的表结构应该是这样的（以 MySQL 为例）：

```sql
CREATE TABLE `product_order` (
  -- 1. 主键：非自增，BigInt，应对分布式
  `id` BIGINT NOT NULL COMMENT '分布式ID，雪花算法',

  -- 2. 业务字段
  `order_no` VARCHAR(64) NOT NULL COMMENT '订单号',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `amount` DECIMAL(10, 2) NOT NULL COMMENT '金额',

  -- 3. 扩展字段：应对未来需求变更
  `features` JSON DEFAULT NULL COMMENT '扩展属性(JSON)',

  -- 4. 乐观锁：处理并发
  `revision` INT DEFAULT 0 COMMENT '乐观锁版本号',

  -- 5. 审计字段：追踪变更
  `created_by` BIGINT DEFAULT NULL COMMENT '创建人',
  `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` BIGINT DEFAULT NULL COMMENT '更新人',
  `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  -- 6. 逻辑删除：使用时间戳解决唯一索引冲突
  `delete_time` BIGINT DEFAULT 0 COMMENT '删除时间戳，0代表未删除',

  PRIMARY KEY (`id`),

  -- 业务唯一索引：带上 delete_time
  UNIQUE KEY `uk_order_no` (`order_no`, `delete_time`),

  -- 复合索引：根据查询习惯建立
  KEY `idx_user_time` (`user_id`, `created_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品订单表';
```

**结语**：
好的表结构设计，能够让我们的代码在几年后依然逻辑清晰、扩展自如。别为了省一时的事，给未来埋下无数的坑。希望这份规范能对大家的开发工作有所帮助。
