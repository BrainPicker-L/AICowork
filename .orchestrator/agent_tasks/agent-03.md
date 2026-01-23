# Agent-03: 类型定义与配置分析

## 输入参数
- 项目根目录: c:\myproject\AICowork
- 分析文件列表:
  - types/index.d.ts
  - src/ui/electron.d.ts
  - vite.config.ts
  - tsconfig.json
  - package.json
  - package-lock.json (如有)
  - .env.* (如有)

## 分析任务

### 1. 类型定义问题
- 类型定义与实际使用不匹配
- 缺失的类型定义（使用any）
- 重复或冗余的类型定义
- 不正确的泛型使用
- 类型声明文件问题

### 2. 类型导入导出
- 未使用的类型导入
- 类型导出混乱
- 循环依赖

### 3. 配置文件问题
- tsconfig.json配置不当
- vite配置问题
- 依赖版本冲突
- 环境变量配置

### 4. 类型安全
- any类型的不当使用
- 类型断言滥用
- 类型守卫缺失

## 输出格式

将结果保存到 `.orchestrator/results/agent-03-result.json`，格式如下：

```json
{
  "task_id": "T-03",
  "task_name": "类型定义与配置分析",
  "status": "completed",
  "findings": [
    {
      "file": "types/index.d.ts",
      "line": 15,
      "severity": "moderate",
      "category": "类型定义不匹配",
      "description": "问题描述",
      "code_snippet": "相关代码片段",
      "fix_suggestion": "修复建议",
      "impact": "影响说明"
    }
  ]
}
```

## 严重程度定义
- **critical**: 严重类型错误，导致编译错误或运行时错误
- **moderate**: 类型定义不准确，但代码可以运行
- **minor**: 类型定义优化建议

## 开始执行
请立即开始分析，使用Read工具读取每个文件，详细分析后输出结果。
