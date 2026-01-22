/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @Email       None
 *
 * API 代理服务器模块
 * 提供 Anthropic API 兼容的本地代理，解决第三方 API /count_tokens 端点缺失问题
 */

// 导出代理服务器控制函数
export { startProxyServer, stopProxyServer, getProxyStatus } from './server.js';
// 导出 token 计算工具
export { estimateTokens } from './token-counter.js';
