# Bun 依赖管理指南

## 目录
- [从 npm 迁移到 Bun](#从-npm-迁移到-bun)
- [新项目使用 Bun](#新项目使用-bun)
- [常用命令对比](#常用命令对比)
- [注意事项](#注意事项)

---

## 从 npm 迁移到 Bun

### 步骤 1: 安装 Bun
```bash
# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1|iex"

# macOS/Linux
curl -fsSL https://bun.sh/install | bash
```

### 步骤 2: 清理 npm 相关文件
```bash
# 删除 npm 的锁文件和依赖
rm package-lock.json
rm -rf node_modules
```

### 步骤 3: 使用 Bun 重新安装依赖
```bash
bun install
```

Bun 会自动：
- 读取 `package.json`
- 生成 `bun.lockb` 或 `bun.lock` 锁文件
- 安装所有依赖到 `node_modules`

### 步骤 4: 更新 package.json 脚本（可选）
将 npm 脚本替换为 bun 脚本：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

脚本保持不变，Bun 会自动处理 `npm run` 命令，你也可以直接使用 `bun run`。

---

## 新项目使用 Bun

### 创建新项目
```bash
# 使用 bun create 创建项目
bun create vite my-app
bun create react my-app
bun create next-app my-app

# 或初始化空项目
mkdir my-app
cd my-app
bun init -y
```

### 安装依赖
```bash
# 安装所有依赖
bun install

# 添加生产依赖
bun add react react-dom

# 添加开发依赖
bun add -D typescript @types/react

# 添加特定版本
bun add react@18.2.0

# 全局安装包
bun add -g prettier
```

### 更新依赖
```bash
# 更新所有依赖
bun update

# 更新特定包
bun update react
```

### 卸载依赖
```bash
bun remove react
```

---

## 常用命令对比

| 操作 | npm | Bun |
|------|-----|-----|
| 安装所有依赖 | `npm install` | `bun install` |
| 添加依赖 | `npm install package` | `bun add package` |
| 添加开发依赖 | `npm install -D package` | `bun add -D package` |
| 全局安装 | `npm install -g package` | `bun add -g package` |
| 卸载依赖 | `npm uninstall package` | `bun remove package` |
| 更新依赖 | `npm update` | `bun update` |
| 运行脚本 | `npm run dev` | `bun run dev` |
| 执行包命令 | `npx package` | `bunx package` |

---

## 注意事项

### 锁文件
- Bun 使用 `bun.lockb`（二进制）或 `bun.lock`（文本）作为锁文件
- 可以安全删除 `package-lock.json` 和 `yarn.lock`
- 不要混用多个包管理器的锁文件

### 速度优势
- Bun 比 npm 快 10-100 倍
- 使用了全局缓存和更快的解析算法
- 适合大型项目和 CI/CD 环境

### 兼容性
- Bun 兼容大多数 npm 包
- 使用与 npm 相同的 `node_modules` 结构
- 支持 `package.json` 的所有字段

### 常见问题

**Q: Bun 安装失败怎么办？**
```bash
# 清除缓存重试
rm -rf ~/.bun/install/cache
bun install
```

**Q: 如何设置镜像源？**
```bash
# 设置淘宝镜像
bun pm set registry https://registry.npmmirror.com
```

**Q: CI/CD 中如何使用？**
```yaml
# GitHub Actions 示例
- name: Install Bun
  uses: oven-sh/setup-bun@v1

- name: Install dependencies
  run: bun install
```

---

## 性能对比

在典型项目中安装 1000 个包的时间对比：

- npm: ~30-60 秒
- pnpm: ~10-20 秒
- Bun: ~1-3 秒

---

## 更多资源

- [Bun 官方文档](https://bun.sh/docs)
- [Bun 包管理器](https://bun.sh/docs/installation)
- [从 npm 迁移](https://bun.sh/docs/runtime/npm-compat)
