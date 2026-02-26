# 记忆模块：你的疑问与修复方案

## 1. 为什么在对话中找不到已存储的记忆（如工号）？

### 原因

当前实现里，**对话过程中没有任何“检索记忆”的逻辑**：

- 设置里添加的记忆只写入了本地 `userData/memory/`（kinds.json、entries.json）。
- Runner 启动会话时，只加载了**用户在 MCP 设置里配置的外部 MCP 服务器**（来自 `~/.qwen/settings.json`）。
- **没有**内置一个“记忆 MCP”把我们的 memory-store 暴露给模型，所以模型端**没有** `memory_recall` 这类工具可用，自然也就不会、也不能去查你存的工号等数据。

也就是说：**数据在本地有，但对话链路没有接上**。

### 修复方案

- **实现内置记忆 MCP 并注入到会话**  
  - 在应用内实现一个小型 MCP Server（stdio），暴露工具：`memory_recall`（按 query/kindId 等从 memory-store 查）、`memory_store`、`memory_forget`。  
  - 数据读写仍用现有 memory-store（同一 userData 路径）。  
  - 在 `mcp-server-manager`（或 Runner）里，把该 MCP 作为固定的一项（例如 `dtazzicowork-memory`）合并进 `getMcpServers()` 的返回值，这样每次会话都会带上，模型就能在对话中调用 `memory_recall` 等，从而检索到你接入的工号等记忆。

修复后：**检索逻辑 = 模型在对话中调用 memory_recall → 内置 MCP 调用 memory-store 的 searchMemoryEntries → 返回匹配条目给模型**。

---

## 2. 为什么摘要是可选的？摘要应该是标题和检索索引

### 原因

设计时把 `summary` 做成可选，是参考“可选摘要”的常见做法，但没有和你的使用方式对齐：你希望**每条记忆有一个明确标题，并且用这个标题做检索索引**。

### 你的理解（更合理）

- **摘要 = 标题**：用户看到的、代表这条记忆的短句（如“张三的工号”）。
- **摘要 = 检索索引**：模型或用户按关键词检索时，应优先按标题/摘要匹配，这样查“工号”才能稳定命中你存的那条。

当前实现中，检索虽然用了 `summary`（若有），但：
- 摘要是可选的，很多条目可能没有 summary，只能靠 content 匹配，容易不稳定；
- 没有在语义上强调“摘要即标题、即主索引”。

### 修复方案

1. **把摘要当作“标题（检索索引）”并改为必填**
   - 在**设置 UI** 里：把“摘要（可选）”改为“**标题（检索索引，必填）**”，提交时校验非空。
   - 在 **memory-store** 的 `createMemoryEntry` 中：将 `summary` 视为必填（或由调用方保证设置后再写入），与 UI 一致。

2. **检索时优先用摘要，再 content**
   - 在 `searchMemoryEntries` 中：
     - 若有 `query`：先按 **summary** 匹配（包含关键词的排前面），再按 **content**、**entities** 匹配，这样“工号”写在标题/摘要里一定能被优先命中。
   - 这样摘要就真正成为“检索的索引”。

3. **兼容旧数据**
   - 对已有未填 summary 的条目：可允许保留，但在检索时若 `summary` 为空则用 `content` 的前 N 字作为“等效标题”参与排序或展示，避免旧数据完全不可见。

---

## 实施状态（已完成）

- **内置记忆 MCP**：已实现并注入。`getMcpServers()` 自动注入 `dtazzicowork-memory`（node 子进程，stdio），暴露 `memory_recall` / `memory_store` / `memory_forget`，与设置页共用同一 memory 目录；对话中模型可调用 `memory_recall` 检索你存的工号等记忆。
- **摘要必填 + 检索优先**：已实现——摘要改为必填并作为“标题（检索索引）”，检索时优先匹配 summary，再 content/entities。
