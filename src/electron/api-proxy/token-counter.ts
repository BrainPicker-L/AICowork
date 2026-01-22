/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @Email       None
 *
 * Token 计算工具
 * 使用 @anthropic-ai/tokenizer 进行精确计算，失败时使用估算
 */

import type { AnthropicRequest } from '../libs/api-adapter.js';
import { log } from '../logger.js';

// 用于追踪是否已显示过警告
let tokenizerWarningShown = false;

// Tokenizer 缓存（异步初始化）
let tokenizerModule: typeof import('@anthropic-ai/tokenizer') | null = null;
let tokenizerLoadAttempted = false;

// 在模块加载时尝试导入 tokenizer（非阻塞）
import('@anthropic-ai/tokenizer').then((module) => {
  tokenizerModule = module;
}).catch(() => {
  tokenizerLoadAttempted = true;
});

/**
 * 计算 token 数量
 * @param request Anthropic API 请求
 * @returns token 计数
 */
export function estimateTokens(request: AnthropicRequest): {
  input: number;
  cache_creation: number;
} {
  let totalTokens = 0;

  // 1. 系统提示词
  if (request.system) {
    totalTokens += countTextTokens(String(request.system));
  }

  // 2. 消息内容
  if (request.messages && Array.isArray(request.messages)) {
    for (const message of request.messages) {
      if (message.content) {
        if (typeof message.content === 'string') {
          totalTokens += countTextTokens(message.content);
        } else if (Array.isArray(message.content)) {
          for (const block of message.content) {
            switch (block.type) {
              case 'text':
                if ('text' in block) {
                  totalTokens += countTextTokens(block.text);
                }
                break;
              case 'tool_use':
                totalTokens += countTextTokens('name' in block ? block.name : '');
                totalTokens += countTextTokens(JSON.stringify('input' in block ? block.input : {}));
                break;
              case 'tool_result':
                const content = typeof block.content === 'string'
                  ? block.content
                  : JSON.stringify(block.content);
                totalTokens += countTextTokens(content);
                break;
              case 'image':
                // 图片固定成本（约 1600 tokens）
                totalTokens += 1600;
                break;
            }
          }
        }
      }
    }
  }

  // 3. 工具定义
  if (request.tools && Array.isArray(request.tools)) {
    for (const tool of request.tools) {
      totalTokens += countTextTokens(tool.name || '');
      totalTokens += countTextTokens(tool.description || '');
      if (tool.input_schema) {
        totalTokens += countTextTokens(JSON.stringify(tool.input_schema));
      }
    }
  }

  return {
    input: totalTokens,
    cache_creation: 0,
  };
}

/**
 * 计算文本的 token 数量
 *
 * 方法：
 * 1. 优先使用 @anthropic-ai/tokenizer 进行精确计算
 * 2. Tokenizer 不可用时，使用字符级别估算：
 *    - 中文字符：约 0.7 字符/token (约 1.4 tokens/字符)
 *    - 其他字符：约 4 字符/token (约 0.25 tokens/字符)
 *
 * 注意：估算可能有 ±20% 误差，生产环境建议安装 tokenizer
 *
 * @param text 待计算文本
 * @returns token 数量
 */
function countTextTokens(text: string): number {
  if (!text) return 0;

  try {
    // 尝试使用缓存的 tokenizer
    if (tokenizerModule && tokenizerModule.countTokens) {
      return tokenizerModule.countTokens(text);
    }
  } catch (error) {
    // 只显示一次警告
    if (!tokenizerWarningShown) {
      log.warn('[token-counter] @anthropic-ai/tokenizer not available, using estimation (±20% accuracy)');
      log.warn('[token-counter] For accurate token counting, install: npm install @anthropic-ai/tokenizer');
      tokenizerWarningShown = true;
    }
    // Tokenizer 不可用时，使用估算
    // 中文约 0.7 字符/token，英文约 4 字符/token
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars / 0.7 + otherChars / 4);
  }
}
