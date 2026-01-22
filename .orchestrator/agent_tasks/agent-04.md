# Agent-04: 共享模块与工具函数分析

## 输入参数
- 项目根目录: c:\myproject\Claude-Cowork
- 分析目录:
  - src/shared/
  - 所有utils/目录

## 分析任务

### 1. 共享模块分析
- src/shared/deletion-detection.ts 重点分析
- 共享代码的模块化程度
- 代码复用性

### 2. 工具函数质量
- 函数单一职责
- 参数验证
- 返回值类型正确性
- 错误处理

### 3. 删除检测逻辑（重点）
- 正则表达式正确性
- 边界情况处理
- 漏检或误检可能性
- 性能问题

### 4. 代码问题
- 过时注释
- 未使用函数
- 重复代码
- 逻辑错误

### 5. 测试覆盖
- 缺少测试的关键函数
- 需要添加测试的边界情况

## 输出格式

将结果保存到 `.orchestrator/results/agent-04-result.json`，格式如下：

```json
{
  "task_id": "T-04",
  "task_name": "共享模块与工具函数分析",
  "status": "completed",
  "findings": [
    {
      "file": "src/shared/deletion-detection.ts",
      "line": 25,
      "severity": "critical",
      "category": "逻辑错误",
      "description": "问题描述",
      "code_snippet": "相关代码片段",
      "fix_suggestion": "修复建议",
      "impact": "影响说明"
    }
  ]
}
```

## 严重程度定义
- **critical**: 严重Bug，影响核心功能
- **moderate**: 中等问题，影响可维护性
- **minor**: 轻微问题，优化建议

## 开始执行
请立即开始分析，使用Read工具读取每个文件，详细分析后输出结果。
