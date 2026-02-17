---
title: 'Git Config'
titleJp: ''
date: '2025-12-01'
excerpt: ''
tags: ["backend"]
---
# 📝 云厂入职：我的第一次正式 Commit 与 Git Flow 实践

**背景**：
入职云厂初期，接到的第一个修复任务 `R-16415`。
**任务目标**：修复 `mailDataInfoPageQuery` 分页查询未按会计期间（`kjnd`, `kjqj`）过滤，导致数据混淆的问题。
**当前状态**：代码逻辑已在本地跑通，验证通过。现在需要按照公司的 Git Flow 规范，将代码正规落”。

-----

### 一、本地提交：颗粒度与准确性

在提交代码前，必须确保本地工作区是干净且准确的。

**1. 确认分支上下文**
确保自己工作在正确的 Feature 分支上，避免误提交到主干或他人的分支。

```bash
git branch
# 预期输出：* panyujun-R-16415 （当前所在分支）
```

> *注：如果不在，需执行 `git checkout taoding-R-16415` 切换。*

**2. 检查变更范围 (Diff Check)**
这是一个好习惯，防止把临时的测试代码（如 `System.out.println` 或本地配置）带上去。

```bash
git status
git diff
```

*确认：只包含 `Mapper.xml` 中关于 SQL `WHERE` 条件的修改。*

**3. 正式 Commit**
遵循“一个 Commit 做一件事”的原则。Message 必须带上任务单号，便于日后 Trace。

```bash
git add 路径/到/YourMapper.xml
git commit -m "R-16415 fix: mailDataInfoPageQuery 增加会计期间(kjnd/kjqj)过滤条件"
```

-----

### 二、对齐主干：保持分支“新鲜”

在提 MR 之前，必须把主干（`develop`）的代码同步到我的分支，提前在本地解决潜在冲突。

**1. 拉取最新主干**

```bash
git checkout develop
git pull origin develop
```

**2. 合并/变基 (Rebase/Merge)**
*根据团队习惯选择，推荐 Rebase 以保持提交历史的一条直线。*

```bash
git checkout panyujun-R-16415
git rebase develop
# 若有冲突：解决冲突 -> git add . -> git rebase --continue
```

*此时，我的分支 = 最新主干代码 + 我的修改。*

-----

### 三、推送与 MR：展示工作成果

**1. 推送至远程仓库**

```bash
git push origin panyujun-R-16415
# 若是该分支首次推送：git push -u origin taoding-R-16415
```

**2. 创建 Merge Request (MR)**
这是我在团队面前的第一次正式亮相，MR 的描述必须清晰、专业。

* **Source Branch**: `taoding-R-16415`
* **Target Branch**: `develop`
* **Title**: `R-16415 修复邮寄资料分页查询未按会计期间过滤的问题`

**3. MR 描述模板 (Standard Template)**

> **修改原因 / Context**
> 原 `mailDataInfoPageQuery` SQL 仅根据 `gsid` 和 `channel` 过滤，缺少会计年度（`kjnd`）和会计期间（`kjqj`）的约束。导致用户在查询特定账期时，会查出同一年所有账期的数据，数据不准确。
>
> **改动点 / Changes**
>
>   * `xxxMapper.xml`: 在 SQL `WHERE` 子句中补充 `AND mdi.kjnd = #{kjnd} AND mdi.kjqj = #{kjqj}` 条件。
>
> **验证方式 / Verification**
>
> 1.  本地启动 `fintax-relation-query` 服务。
> 2.  使用 Postman 模拟请求 `/mailDataInfo/page`。
> 3.  **测试用例**：
      >       * Case A: 传 `kjnd=2025, kjqj=7` -\> 返回 7 月数据。
>       * Case B: 传 `kjnd=2025, kjqj=10` -\> 返回 10 月数据。
> 4.  **结果**：两次请求返回记录集不同，且日志中 SQL 正确拼接了 `kjnd` 和 `kjqj` 参数。

-----

### 四、Review 与后续

1.  **Code Review**: 添加 Mentor 或 Tech Lead 为 Reviewer。
2.  **根据反馈迭代**: 如果有评论（Comment），在本地修改后再次 push 到同一分支（MR 会自动更新，无需重提）。
3.  **Merge**: 获得 `Looks good to me (LGTM)` 后，点击 Merge。
4.  **清理**: 删除本地和远程的 Feature 分支（可选，视习惯而定）。

-----

### 💡 新人心得 (Key Takeaways)

* **规范即效率**：严格遵守 Git Flow 虽然繁琐，但能最大程度避免上线后的代码覆盖事故。
* **自测是底线**：MR 中的“验证方式”写得越清楚，Reviewer 越放心，通过得越快。
* **Commit Message**：任务号（Jira ID/Task ID）是代码的身份证，任何时候都不能丢。

-----