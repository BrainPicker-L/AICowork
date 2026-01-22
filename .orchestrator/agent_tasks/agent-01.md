# Agent-01: Electron主进程代码分析

## 输入参数
- 项目根目录: c:\myproject\Claude-Cowork
- 分析文件列表:
  - src/electron/main.ts
  - src/electron/ipc-handlers.ts
  - src/electron/libs/runner.ts
  - src/electron/libs/claude-settings.ts
  - src/electron/libs/config-store.ts
  - src/electron/libs/session-store.ts
  - src/electron/libs/util.ts
  - src/electron/libs/api-adapter.ts
  - src/electron/error-handling.ts
  - src/electron/handlers/*
  - src/electron/utils/*
  - src/electron/config/*
  - src/electron/preload.cts

## 分析任务

### 1. 屎山代码识别
- 重复代码（DRY原则违反）
- 过长函数（>50行）
- 过深嵌套（>3层）
- 复杂条件表达式
- 魔法数字和字符串

### 2. 过时/不匹配注释
- 注释与代码行为不符
- 无效的TODO/FIXME注释
- 重复或冗余注释
- 缺少必要注释的复杂逻辑

### 3. 未使用代码
- 未导入的模块
- 未使用的变量、函数、类型
- 死代码（不可达的代码路径）

### 4. Bug和问题
- 类型错误（any滥用、类型不匹配）
- 异常处理缺失或不当
- 资源泄漏（文件句柄、连接未关闭）
- 竞态条件（异步操作未正确等待）
- 逻辑错误

## 输出格式

将结果保存到 `.orchestrator/results/agent-01-result.json`，格式如下：

```json
{
  "task_id": "T-01",
  "task_name": "Electron主进程代码分析",
  "status": "completed",
  "findings": [
    {
      "file": "src/electron/main.ts",
      "line": 42,
      "severity": "critical",
      "category": "类型错误",
      "description": "问题描述",
      "code_snippet": "相关代码片段",
      "fix_suggestion": "修复建议",
      "impact": "影响说明"
    }
  ]
}
```

## 严重程度定义
- **critical**: 严重Bug，影响功能或安全
- **moderate**: 中等问题，影响可维护性
- **minor**: 轻微问题，代码风格或优化建议

## 开始执行
请立即开始分析，使用Read工具读取每个文件，详细分析后输出结果。
