# Agent-B01: 修复配置保存失败

**任务 ID**: B-01
**优先级**: 🔴 高 - 用户报告的核心问题

---

## 问题描述

用户报告"保存配置失败"，主要问题在 `config-store.ts`：
1. 使用同步文件操作可能导致阻塞
2. 目录创建没有验证结果
3. 错误处理不完整，没有通知用户
4. 文件权限错误未处理

---

## 执行步骤

### 步骤 1: 修复 config-store.ts

**文件**: `src/electron/libs/config-store.ts`

**问题 1**: 第 200-202 行 - 目录创建没有验证
```typescript
// 当前代码
if (!existsSync(userDataPath)) {
  mkdirSync(userDataPath, { recursive: true });
}

// 修复后
if (!existsSync(userDataPath)) {
  try {
    mkdirSync(userDataPath, { recursive: true });
    // 验证创建成功
    if (!existsSync(userDataPath)) {
      throw new Error(`Failed to create directory: ${userDataPath}`);
    }
  } catch (error) {
    log.error(`Failed to create config directory: ${userDataPath}`, error);
    throw new Error(`Cannot create config directory. Please check file permissions.`);
  }
}
```

**问题 2**: 第 225 行 - 同步写入改为异步
```typescript
// 当前代码
writeFileSync(configPath, JSON.stringify(configToSave, null, 2), "utf8");

// 修复后 - 使用 Promise 包装异步操作
await writeFile(configPath, JSON.stringify(configToSave, null, 2), "utf8");
```

**问题 3**: 添加文件权限检查
```typescript
// 在保存前检查目录权限
try {
  const testFile = path.join(userDataPath, '.write-test');
  await writeFile(testFile, 'test');
  await unlink(testFile);
} catch (error) {
  throw new Error(`Config directory is not writable: ${userDataPath}`);
}
```

### 步骤 2: 修复 claude-settings.ts

**文件**: `src/electron/libs/claude-settings.ts`

**问题**: 第 53-58 行 - 错误没有通知用户

```typescript
// 当前代码
try {
  saveApiConfig(config);
  log.debug("[claude-settings] Persisted config to api-config.json");
} catch (e) {
  log.error("[claude-settings] Failed to persist config:", e);
}

// 修复后 - 返回结果给调用者
export async function saveApiConfigWithNotification(config: ApiConfig): Promise<{ success: boolean; error?: string }> {
  try {
    saveApiConfig(config);
    log.debug("[claude-settings] Persisted config to api-config.json");
    return { success: true };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    log.error("[claude-settings] Failed to persist config:", e);
    return { success: false, error: errorMessage };
  }
}
```

### 步骤 3: 更新 IPC 处理器

**文件**: `src/electron/main.ts` 或相关 IPC 处理文件

确保 `save-api-config` 处理器返回详细的错误信息：
```typescript
ipcMain.handle("save-api-config", async (_event, config: ApiConfig) => {
  try {
    const result = await saveApiConfigWithNotification(config);
    return result;
  } catch (error) {
    log.error("IPC: Failed to save API config", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
});
```

### 步骤 4: 增强前端错误显示

**文件**: `src/ui/components/SettingsModal.tsx`

确保错误消息能正确显示给用户：
```typescript
// 检查返回的错误消息
if (result.error) {
  // 显示详细错误
  setError(result.error);
  // 如果是权限错误，显示额外提示
  if (result.error.includes('permission') || result.error.includes('writable')) {
    setError(result.error + "\n\n请检查应用是否有写入配置文件的权限。");
  }
}
```

---

## 输出格式

```markdown
# B-01 执行结果

## 修复的文件

### src/electron/libs/config-store.ts
- 目录创建添加验证
- 改用异步文件操作
- 添加权限检查

### src/electron/libs/claude-settings.ts
- 添加返回值通知机制

### src/ui/components/SettingsModal.tsx
- 增强错误消息显示

## 测试验证

- [ ] 配置保存在 Windows 上成功
- [ ] 配置保存在 macOS 上成功
- [ ] 配置保存在 Linux 上成功
- [ ] 权限错误正确显示给用户
- [ ] 目录不存在时自动创建
```

---

**注意事项**:
- 保持向后兼容性
- 确保所有平台路径处理正确
- 测试不同权限场景
