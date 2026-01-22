# Node.js 依赖处理说明

> **创建时间**: 2026-01-20
> **问题**: 用户设备没有安装 Node.js

---

## 问题分析

在 Electron 应用中使用 `@anthropic-ai/claude-agent-sdk` 需要注意：

1. **SDK 的 CLI 需要执行** - `cli.js` 脚本需要 Node.js 运行时
2. **用户设备没有 Node.js** - 不能依赖系统安装的 Node.js
3. **Electron 内置 Node.js** - 但需要正确配置才能使用

---

## 解决方案

### 1. SDK 补丁

项目已对 SDK 打补丁 (`patches/@anthropic-ai%2Fclaude-agent-sdk@0.2.6.patch`)：

```diff
- import { spawn } from "child_process";
+ import { fork } from "child_process";

- const childProcess = spawn(command, args, { ... });
+ const childProcess = fork(args[0], args.slice(1), { ... });
```

**关键区别**：
- `spawn(command, args)` - 需要指定可执行文件（如 `node`）
- `fork(modulePath, args)` - 自动使用当前 Node.js 进程

**好处**：
- 不需要用户设备安装 Node.js
- 自动使用 Electron 内置的 Node.js
- 继承当前进程的环境变量

### 2. 打包配置

`electron-builder.json` 中的 `asarUnpack` 配置：

```json
{
  "asarUnpack": [
    "node_modules/@anthropic-ai/claude-agent-sdk/**/*",
    "node_modules/better-sqlite3/**/*",
    "node_modules/os-utils/**/*",
    ...
  ]
}
```

**说明**：
- `@anthropic-ai/claude-agent-sdk` 被解包到 `app.asar.unpacked/`
- `fork()` 可以直接执行解包后的 `.js` 文件
- Electron 内置的 Node.js 会执行这些脚本

### 3. CLI 路径配置

`src/electron/libs/claude-settings.ts` 中的路径配置：

```typescript
export function getClaudeCodePath(): string {
  if (app.isPackaged) {
    // 生产环境：使用 app.asar.unpacked 中的解包模块
    return join(
      process.resourcesPath,
      'app.asar.unpacked/node_modules/@anthropic-ai/claude-agent-sdk/cli.js'
    );
  }
  // 开发环境：使用 node_modules 中的 CLI
  return join(process.cwd(), 'node_modules/@anthropic-ai/claude-agent-sdk/cli.js');
}
```

---

## 打包后的目录结构

```
Agent Cowork.app/
├── Contents/
│   ├── MacOS/
│   │   └── Agent Cowork       # Electron 可执行文件（包含 Node.js）
│   ├── Resources/
│   │   ├── app.asar           # 主应用代码（打包）
│   │   └── app.asar.unpacked/ # 解包的模块
│   │       └── node_modules/
│   │           ├── @anthropic-ai/
│   │           │   └── claude-agent-sdk/
│   │           │       └── cli.js  # SDK CLI 脚本
│   │           └── better-sqlite3/
│   └── ...
```

---

## 工作流程

### 开发环境
```
1. Electron 启动 (使用 bun run dev:electron)
2. runner.ts 调用 query({ pathToClaudeCodeExecutable: ... })
3. SDK 使用 fork() 执行 cli.js
4. fork() 自动使用当前 Node.js (bun 提供的)
```

### 生产环境
```
1. Electron 启动 (用户双击应用)
2. runner.ts 调用 query({ pathToClaudeCodeExecutable: ... })
3. SDK 使用 fork() 执行 app.asar.unpacked/.../cli.js
4. fork() 自动使用 Electron 内置的 Node.js
5. ✅ 不需要用户安装 Node.js
```

---

## 验证清单

### 开发环境
- [ ] `bun install` 已安装依赖
- [ ] `node_modules/@anthropic-ai/claude-agent-sdk/cli.js` 存在
- [ ] 开发环境正常运行

### 生产环境
- [ ] `electron-builder` 打包成功
- [ ] `app.asar.unpacked/node_modules/@anthropic-ai/claude-agent-sdk/cli.js` 存在
- [ ] 没有安装 Node.js 的设备上运行正常
- [ ] 会话创建和执行正常

---

## 故障排查

### 错误：CLI not found

**症状**：
```
Error: Claude SDK CLI not found. Please ensure the application is properly built.
Expected path: /path/to/app.asar.unpacked/node_modules/@anthropic-ai/claude-agent-sdk/cli.js
```

**解决**：
1. 检查 `electron-builder.json` 中的 `asarUnpack` 配置
2. 重新构建应用：`bun run dist:win` 或 `bun run dist:mac`
3. 验证打包后的 `app.asar.unpacked` 目录结构

### 错误：Cannot find module

**症状**：
```
Error: Cannot find module '@anthropic-ai/claude-agent-sdk/cli.js'
```

**解决**：
1. 确保在主进程编译前安装了依赖
2. 检查 `transpile:electron` 脚本是否正确执行
3. 清除缓存重新构建

### 错误：EACCES permission denied

**症状**：
```
Error: EACCES: permission denied, open '.../cli.js'
```

**解决**：
1. 检查文件权限
2. Windows：以管理员身份运行
3. macOS/Linux：检查 `app.asar.unpacked` 目录权限

---

## 技术细节

### fork() vs spawn()

| 特性 | fork() | spawn() |
|------|--------|---------|
| Node.js 路径 | 自动使用当前进程 | 需要指定 |
| 环境变量 | 自动继承 | 需要手动传递 |
| IPC 通信 | 支持 | 需要额外配置 |
| 适用场景 | Node.js 模块 | 独立可执行文件 |

### 为什么不需要打包 Node.js

Electron 应用已经包含了 Node.js 运行时：
- Windows: `electron.exe` 包含 Node.js
- macOS: `AICowork.app/Contents/MacOS/AICowork` 包含 Node.js
- Linux: `aicowork` 二进制文件包含 Node.js

使用 `fork()` 时，会自动使用这个内置的 Node.js。

---

## 参考文档

- [Electron Process Model](https://www.electronjs.org/docs/latest/tutorial/process-model)
- [Node.js child_process.fork()](https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options)
- [electron-builder asarUnpack](https://www.electron.build/configuration/contents)

---

**作者**: Alan
**日期**: 2026-01-20
**许可证**: AGCPA v3.0
