# Agent-02: React前端代码分析

## 输入参数
- 项目根目录: c:\myproject\Claude-Cowork
- 分析文件列表:
  - src/ui/App.tsx
  - src/ui/main.tsx
  - src/ui/components/*
  - src/ui/hooks/*
  - src/ui/store/*
  - src/ui/utils/*
  - src/ui/config/*

## 分析任务

### 1. React最佳实践违反
- 缺少React.memo必要的使用
- 不正确的useEffect依赖
- useState/useCallback/useMemo误用
- 过度的重渲染
- 缺少key属性或key使用不当

### 2. 组件设计问题
- 过大的组件文件（>300行）
- 职责不清晰的组件
- Props drilling
- 缺少PropTypes或类型定义

### 3. 状态管理问题
- Zustand store结构不合理
- 不必要的全局状态
- 状态更新逻辑问题

### 4. UI/UX问题
- 可访问性问题
- 未处理的边界情况
- 错误状态处理不当

### 5. 代码质量
- 过时注释
- 未使用代码
- 类型错误
- 样式硬编码

## 输出格式

将结果保存到 `.orchestrator/results/agent-02-result.json`，格式如下：

```json
{
  "task_id": "T-02",
  "task_name": "React前端代码分析",
  "status": "completed",
  "findings": [
    {
      "file": "src/ui/App.tsx",
      "line": 85,
      "severity": "moderate",
      "category": "React最佳实践",
      "description": "问题描述",
      "code_snippet": "相关代码片段",
      "fix_suggestion": "修复建议",
      "impact": "影响说明"
    }
  ]
}
```

## 严重程度定义
- **critical**: 严重Bug，影响功能或用户体验
- **moderate**: 中等问题，影响性能或可维护性
- **minor**: 轻微问题，代码风格建议

## 开始执行
请立即开始分析，使用Read工具读取每个文件，详细分析后输出结果。
