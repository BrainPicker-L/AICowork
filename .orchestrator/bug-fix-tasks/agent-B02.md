# Agent-B02: 修复平台兼容性

**任务 ID**: B-02
**优先级**: 🔴 高 - 影响跨平台使用

---

## 问题描述

发现多处平台兼容性问题：
1. 进程终止命令平台差异处理不当
2. 硬编码路径分隔符
3. Shell 命令引号处理差异
4. `process.cwd()` 在打包后可能错误

---

## 执行步骤

### 步骤 1: 修复 main.ts 进程终止

**文件**: `src/electron/main.ts`

**问题**: 第 18-29 行 - 平台特定命令没有充分处理

```typescript
// 当前代码
if (process.platform === 'win32') {
  execSync(`for /f "tokens=5" %a in ('netstat -ano ^| findstr :${DEV_PORT}') do taskkill /PID %a /F`, { stdio: 'ignore', shell: 'cmd.exe' });
} else {
  execSync(`lsof -ti:${DEV_PORT} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
}

// 修复后 - 添加错误处理和回退机制
async function killPortOccupier(port: number): Promise<boolean> {
  const { execSync } = await import('child_process');

  try {
    if (process.platform === 'win32') {
      // Windows 方法 1: PowerShell
      try {
        execSync(`powershell -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }"`, { stdio: 'ignore' });
        return true;
      } catch {
        // Windows 方法 2: netstat + taskkill
        execSync(`for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /PID %a /F`, { stdio: 'ignore', shell: 'cmd.exe' });
        return true;
      }
    } else {
      // Unix 方法
      execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
      return true;
    }
  } catch (error) {
    log.warn(`Failed to kill process on port ${port}:`, error);
    return false;
  }
}
```

### 步骤 2: 修复 pathResolver.ts

**文件**: `src/electron/pathResolver.ts`

**问题**: 第 21 行 - 使用 `process.cwd()` 可能在打包后错误

```typescript
// 当前代码
return path.join(process.cwd(), 'templateIcon.ico');

// 修复后 - 使用 app.getAppPath()
import { app } from 'electron';

export function getTemplateIconPath(): string {
  // 在开发环境使用当前目录，在生产环境使用资源目录
  const isDev = process.env.NODE_ENV === 'development';
  const basePath = isDev
    ? process.cwd()
    : process.resourcesPath || app.getAppPath();

  return path.join(basePath, 'templateIcon.ico');
}

// 更好的方案 - 放在资源文件夹
export function getTemplateIconPath(): string {
  const iconPath = path.join(__dirname, '../assets/templateIcon.ico');
  return iconPath;
}
```

### 步骤 3: 创建平台工具模块

**新建文件**: `src/electron/utils/platform.ts`

```typescript
/**
 * 平台兼容性工具函数
 */

import { platform } from 'process';
import path from 'path';

/** 当前平台类型 */
export type Platform = 'windows' | 'macos' | 'linux' | 'unknown';

/** 获取当前平台 */
export function getPlatform(): Platform {
  switch (platform) {
    case 'win32':
      return 'windows';
    case 'darwin':
      return 'macos';
    case 'linux':
      return 'linux';
    default:
      return 'unknown';
  }
}

/** 是否是 Windows */
export const isWindows = platform === 'win32';

/** 是否是 macOS */
export const isMacOS = platform === 'darwin';

/** 是否是 Linux */
export const isLinux = platform === 'linux';

/** 获取平台特定的路径分隔符 */
export function getPathSeparator(): string {
  return path.sep;
}

/** 获取平台特定的换行符 */
export function getLineEnding(): string {
  return isWindows ? '\r\n' : '\n';
}

/** 获取平台特定的 shell 可执行文件 */
export function getShellExecutable(): string {
  if (isWindows) return 'cmd.exe';
  if (isMacOS || isLinux) return '/bin/bash';
  return '/bin/sh';
}

/** 获取平台特定的删除命令模式 */
export function getPlatformDeletePatterns(): RegExp[] {
  if (isWindows) {
    return [
      /\b(Remove-Item|Delete-Item|Remove-ItemProperty)\b/i,
      /\b(powershell|pwsh)(\s+(-Command|-c)\s+)?(".*?\b(Remove-Item|Delete-Item|Remove-ItemProperty)\b|'.*?\b(Remove-Item|Delete-Item|Remove-ItemProperty)\b)/i,
      /\b(cmd\.exe|cmd)\s+(\/c|\/k)\s+"[^"]*\b(del|erase|rmdir|rd)\b/i,
      /\|\s*(\w+\.exe)?\s*\b(del|erase)\s+/i,
      /[;&]\s*\b(del|erase|rmdir|rd)\s+/i,
    ];
  }

  // Unix (macOS/Linux)
  return [
    /\brm\s+[-\w\s\\""'\$]+/,
    /\brmdir\s+/,
    /\bunlink\s+/,
    /\b(powershell|pwsh|bash|sh)\s+(-c\s+)?"?[^"]*?\b(rm|rmdir|unlink)\b/i,
  ];
}
```

### 步骤 4: 更新删除检测使用平台工具

**文件**: `src/shared/deletion-detection.ts`

```typescript
// 导入平台工具（注意：shared 模块不能直接依赖 electron）
// 保持现有实现，但添加平台检测辅助函数

/** 检测当前是否是 Windows 平台 */
export function isWindowsPlatform(): boolean {
  return typeof process !== 'undefined' && process.platform === 'win32';
}

/** 根据平台调整删除检测模式 */
function getPlatformSpecificPatterns(): RegExp[] {
  const basePatterns = [
    // PowerShell 跨平台
    /\b(Remove-Item|Delete-Item|Remove-ItemProperty)\b/i,
    /\b(powershell|pwsh)(\s+(-Command|-c)\s+)?(".*?\b(Remove-Item|Delete-Item|Remove-ItemProperty)\b|'.*?\b(Remove-Item|Delete-Item|Remove-ItemProperty)\b)/i,
  ];

  if (isWindowsPlatform()) {
    basePatterns.push(
      /\b(cmd\.exe|cmd)\s+(\/c|\/k)\s+"[^"]*\b(del|erase|rmdir|rd)\b/i,
      /\|\s*(\w+\.exe)?\s*\b(del|erase)\s+/i,
      /[;&]\s*\b(del|erase|rmdir|rd)\s+/i,
    );
  } else {
    basePatterns.push(
      /\brm\s+[-\w\s\\""'\$]+/,
      /\brmdir\s+/,
      /\bunlink\s+/,
    );
  }

  return basePatterns;
}
```

### 步骤 5: 修复 util.ts 环境判断

**文件**: `src/electron/libs/util.ts`

```typescript
// 当前代码
export function isDev(): boolean {
  return process.env.NODE_ENV == "development";
}

// 修复后 - 使用 app.isPackaged 判断
import { app } from 'electron';

export function isDev(): boolean {
  // 优先使用 app.isPackaged（更可靠）
  if (app && app.isPackaged !== undefined) {
    return !app.isPackaged;
  }
  // 回退到环境变量
  return process.env.NODE_ENV === 'development';
}

export function isProd(): boolean {
  return !isDev();
}
```

---

## 输出格式

```markdown
# B-02 执行结果

## 修复的文件

### src/electron/main.ts
- 修复进程终止命令
- 添加错误处理和回退机制

### src/electron/pathResolver.ts
- 使用 app.getAppPath() 替代 process.cwd()

### src/electron/utils/platform.ts (新建)
- 平台检测工具函数
- 平台特定常量

### src/shared/deletion-detection.ts
- 添加平台特定删除检测

### src/electron/libs/util.ts
- 改进环境判断

## 平台测试

- [ ] Windows 10/11 配置保存成功
- [ ] macOS 配置保存成功
- [ ] Linux 配置保存成功
- [ ] 进程终止在各平台正常工作
```

---

**注意事项**:
- 每个平台特定功能都要有回退方案
- 使用 Electron 的 API 而不是 Node.js 的 process
- 测试所有支持的操作系统
