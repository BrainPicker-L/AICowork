# Agent-B03: 移除开发环境依赖

**任务 ID**: B-03
**优先级**: 🟡 中 - 影响生产环境运行

---

## 问题描述

发现多处依赖 `process.env.NODE_ENV` 的代码，导致在打包后可能行为异常：
1. `util.ts` 使用 `process.env.NODE_ENV` 判断环境
2. `logger.ts` 根据环境变量设置日志级别
3. 可能在生产环境仍输出调试信息

---

## 执行步骤

### 步骤 1: 修复 util.ts 环境判断

**文件**: `src/electron/libs/util.ts`

**问题**: 第 8 行 - 使用 `process.env.NODE_ENV` 不可靠

```typescript
// 当前代码
export function isDev(): boolean {
  return process.env.NODE_ENV == "development";
}

// 修复后 - 使用 app.isPackaged
import { app } from 'electron';

let _isDev: boolean | null = null;

export function isDev(): boolean {
  if (_isDev === null) {
    // 方法 1: 使用 Electron 的 app.isPackaged（最可靠）
    if (app && typeof app.isPackaged === 'boolean') {
      _isDev = !app.isPackaged;
    } else {
      // 方法 2: 检查环境变量
      _isDev = process.env.NODE_ENV === 'development';
    }
  }
  return _isDev;
}

export function isProd(): boolean {
  return !isDev();
}
```

### 步骤 2: 修复 logger.ts 环境判断

**文件**: `src/electron/logger.ts`

**问题**: 第 62 行和 132 行 - 依赖环境变量设置日志级别

```typescript
// 当前代码
if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
  globalLoggerInstance.level = 'debug';
}

// 修复后
import { isDev } from './libs/util.js';

function initializeLogger() {
  // 使用统一的环境判断
  if (isDev() || process.env.DEBUG) {
    globalLoggerInstance.level = 'debug';
  } else {
    globalLoggerInstance.level = 'info';
  }

  // 生产环境可以根据需要调整
  if (isProd() && process.env.LOG_LEVEL) {
    globalLoggerInstance.level = process.env.LOG_LEVEL as any;
  }
}
```

### 步骤 3: 修复 preload.cts 环境判断

**文件**: `src/electron/preload.cts`

**问题**: 第 21 行 - 开发环境判断可能不准确

```typescript
// 当前代码
if (process.env.NODE_ENV === 'development') {
  console.error("Failed to parse server event:", error);
}

// 修复后 - 使用 contextBridge 隔离
const isDev = () => {
  try {
    // 从主进程获取环境信息（更可靠）
    return process.env.NODE_ENV === 'development' ||
           process.defaultApp || // 检测是否在开发模式运行
           /node_modules[/]electron[/]/.test(process.execPath);
  } catch {
    return false;
  }
};

onServerEvent: (callback: (event: any) => void) => {
  const cb = (_: Electron.IpcRendererEvent, payload: string) => {
    try {
      const event = JSON.parse(payload);
      callback(event);
    } catch (error) {
      // 只在开发环境输出详细错误
      if (isDev()) {
        console.error("[Preload] Failed to parse server event:", error, "Payload:", payload);
      }
    }
  };
  electron.ipcRenderer.on("server-event", cb);
  return () => electron.ipcRenderer.off("server-event", cb);
}
```

### 步骤 4: 检查所有使用 process.env 的地方

**搜索并修复以下模式**:

```bash
# 搜索所有使用 process.env 的文件
grep -r "process\.env" src/
```

需要检查的常见模式：
- `process.env.NODE_ENV` → 使用 `isDev()`
- `process.env.DEBUG` → 保留（可用于调试）
- `process.env.HOME` → 使用 `app.getPath('home')`
- `process.env.USERNAME` → 使用 `app.getName()` 或 `os.userInfo()`

### 步骤 5: 创建环境配置模块

**新建文件**: `src/electron/config/env.ts`

```typescript
/**
 * 环境配置模块
 * 提供统一的环境判断和配置获取
 */

import { app } from 'electron';
import os from 'os';

/** 缓存的环境状态 */
let cachedIsDev: boolean | null = null;
let cachedPlatform: NodeJS.Platform | null = null;

/**
 * 判断是否是开发环境
 * 优先使用 app.isPackaged，回退到环境变量
 */
export function isDev(): boolean {
  if (cachedIsDev === null) {
    if (app && typeof app.isPackaged === 'boolean') {
      // Electron 打包后 app.isPackaged 为 true
      cachedIsDev = !app.isPackaged;
    } else {
      // 回退到环境变量
      cachedIsDev = process.env.NODE_ENV === 'development';
    }
  }
  return cachedIsDev;
}

/** 判断是否是生产环境 */
export function isProd(): boolean {
  return !isDev();
}

/** 获取当前平台 */
export function getPlatform(): NodeJS.Platform {
  if (cachedPlatform === null) {
    cachedPlatform = process.platform;
  }
  return cachedPlatform;
}

/** 获取用户数据目录 */
export function getUserDataPath(): string {
  if (app) {
    return app.getPath('userData');
  }
  // 回退到环境变量
  return process.env.APPDATA ||
         process.env.HOME ||
         os.homedir();
}

/** 获取日志级别 */
export function getLogLevel(): string {
  // 优先使用环境变量覆盖
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }
  // 开发环境默认 debug，生产环境默认 info
  return isDev() ? 'debug' : 'info';
}

/** 是否启用调试模式 */
export function isDebugMode(): boolean {
  return !!process.env.DEBUG || isDev();
}

/** 获取应用版本 */
export function getAppVersion(): string {
  if (app && app.getVersion) {
    return app.getVersion();
  }
  return process.env.npm_package_version || '0.0.0';
}
```

---

## 输出格式

```markdown
# B-03 执行结果

## 修复的文件

### src/electron/libs/util.ts
- 使用 app.isPackaged 判断环境
- 添加缓存优化

### src/electron/logger.ts
- 使用统一环境判断
- 生产环境日志级别正确

### src/electron/preload.cts
- 改进开发环境检测
- 添加更好的错误隔离

### src/electron/config/env.ts (新建)
- 统一的环境配置模块
- 提供可靠的环境判断

## 验证测试

- [ ] 打包后应用正常运行
- [ ] 生产环境不输出调试日志
- [ ] 开发环境可以调试
- [ ] 环境切换无副作用
```

---

**注意事项**:
- 优先使用 Electron API 而不是环境变量
- 为环境判断添加缓存
- 确保生产环境不泄露调试信息
