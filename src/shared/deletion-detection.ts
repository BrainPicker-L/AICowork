/**
 * 删除操作检测模块
 *
 * 提供统一的删除命令检测逻辑，供前后端共享使用
 * 避免代码重复，确保检测规则一致性
 *
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @Email       None
 * @license     AGCPA v3.0
 */

// ==================== 删除检测模式常量 ====================

/** 子 Shell 删除命令模式 */
const SUBSHELL_DELETION_PATTERN = /\b(powershell|pwsh|cmd|cmd\.exe|bash|sh)\s+(-c\s+)?"?[^"]*?\b(rm|rmdir|del|erase|rd|unlink)\b/i;

/**
 * 检测工具输入是否是删除操作
 *
 * @param toolName - 工具名称 (如 "Bash", "Write")
 * @param input - 工具输入参数
 * @returns 是否是删除操作
 */
export function checkIfDeletionOperation(toolName: string, input: unknown): boolean {
  // Bash 工具需要检查命令内容
  if (toolName === "Bash" && input && typeof input === "object") {
    const cmd = (input as Record<string, unknown>).command;
    if (typeof cmd !== "string") {
      return false;
    }

    // 使用早期返回模式简化嵌套
    return checkBashDeletionCommand(cmd);
  }

  // Write 工具 - 检测空内容（可能是删除操作）
  if (toolName === "Write" && input && typeof input === "object") {
    const writeInput = input as Record<string, unknown>;
    const content = writeInput.content;
    // 如果内容为空或很短，可能是删除操作
    return typeof content === "string" && content.trim().length === 0;
  }

  return false;
}

/**
 * 检测 Bash 命令是否是删除操作
 *
 * @param cmd - Bash 命令字符串
 * @returns 是否是删除命令
 */
function checkBashDeletionCommand(cmd: string): boolean {
  // PowerShell 完整命令检测
  const powershellPatterns = [
    /\b(Remove-Item|Delete-Item|Remove-ItemProperty)\b/i,
    /\b(powershell|pwsh)(\s+(-Command|-c)\s+)?(".*?\b(Remove-Item|Delete-Item|Remove-ItemProperty)\b|'.*?\b(Remove-Item|Delete-Item|Remove-ItemProperty)\b)/i,
  ];
  if (patternsMatch(powershellPatterns, cmd)) return true;

  // 子Shell 删除命令
  if (SUBSHELL_DELETION_PATTERN.test(cmd)) return true;

  // Windows CMD 删除命令
  const windowsCmdPatterns = [
    /\b(cmd\.exe|cmd)\s+(\/c|\/k)\s+"[^"]*\b(del|erase|rmdir|rd)\b/i,
    /\|\s*(\w+\.exe)?\s*\b(del|erase)\s+/i,
    /[;&]\s*\b(del|erase|rmdir|rd)\s+/i,
  ];
  if (patternsMatch(windowsCmdPatterns, cmd)) return true;

  // Unix/Linux 删除命令
  const unixPatterns = [
    /\brm\s+[^$\s]/,  // 修复：检测 rm 后面跟任何参数（包括简单文件名）
    /\brm\s+[rf]+/,   // 选项模式：rm -rf, rm -f 等
    /\brmdir\s+/,
    /\bunlink\s+/,
  ];
  if (patternsMatch(unixPatterns, cmd)) return true;

  // 其他删除工具
  const otherDeletionPatterns = [
    /\btrash\s+(--empty|-e|--put|--rm|remove|delete)/,
    /\bshred\s+[-\w\s\\""'\$]+/,
    /\bwipe\s+/,
    /\bsrm\s+/,
  ];
  if (patternsMatch(otherDeletionPatterns, cmd)) return true;

  return false;
}

/**
 * 检查命令是否匹配任何给定的模式
 *
 * @param patterns - 正则表达式数组
 * @param cmd - 要检查的命令
 * @returns 是否匹配任一模式
 */
function patternsMatch(patterns: RegExp[], cmd: string): boolean {
  return patterns.some(pattern => pattern.test(cmd));
}

/**
 * 检查权限请求是否是删除操作（前端专用）
 *
 * @param request - 权限请求对象
 * @returns 是否是删除操作
 */
export function isDeletionPermissionRequest(
  request: { toolName: string; input: unknown } | undefined
): boolean {
  if (!request) return false;
  return checkIfDeletionOperation(request.toolName, request.input);
}

// 删除检测模式常量（用于文档或测试）
export const DELETION_PATTERNS = {
  powershell: [
    /\b(Remove-Item|Delete-Item|Remove-ItemProperty)\b/i,
    /\b(powershell|pwsh)(\s+(-Command|-c)\s+)?(".*?\b(Remove-Item|Delete-Item|Remove-ItemProperty)\b|'.*?\b(Remove-Item|Delete-Item|Remove-ItemProperty)\b)/i,
  ],
  subShell: /\b(powershell|pwsh|cmd|cmd\.exe|bash|sh)\s+(-c\s+)?"?[^"]*?\b(rm|rmdir|del|erase|rd|unlink)\b/i,
  windowsCmd: [
    /\b(cmd\.exe|cmd)\s+(\/c|\/k)\s+"[^"]*\b(del|erase|rmdir|rd)\b/i,
    /\|\s*(\w+\.exe)?\s*\b(del|erase)\s+/i,
    /[;&]\s*\b(del|erase|rmdir|rd)\s+/i,
  ],
  unix: [
    /\brm\s+[^$\s]/,  // 修复：检测 rm 后面跟任何参数（包括简单文件名）
    /\brm\s+[rf]+/,   // 选项模式：rm -rf, rm -f 等
    /\brmdir\s+/,
    /\bunlink\s+/,
  ],
  other: [
    /\btrash\s+(--empty|-e|--put|--rm|remove|delete)/,
    /\bshred\s+[-\w\s\\""'\$]+/,
    /\bwipe\s+/,
    /\bsrm\s+/,
  ],
} as const;

export default checkIfDeletionOperation;
