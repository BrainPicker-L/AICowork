/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @Email       None
 *
 * API 代理服务器
 * 将第三方 API 伪装成 Anthropic 官方 API，解决 /count_tokens 端点缺失问题
 */

import { createServer, IncomingMessage, ServerResponse, Server } from 'http';
import { log } from '../logger.js';
import { estimateTokens } from './token-counter.js';
import { saveApiConfig, type ApiConfig } from '../libs/config-store.js';
import type { AnthropicRequest } from '../libs/api-adapter.js';
import { getApiAdapter } from '../libs/api-adapter.js';

/** 代理服务器端口 */
const PROXY_PORT = 35721;

/** 代理服务器实例 */
let proxyServer: Server | null = null;

/** 当前配置 */
let currentConfig: ApiConfig | null = null;

/**
 * 启动代理服务器
 * @param config API 配置
 * @returns 代理服务器 URL
 */
export function startProxyServer(config: ApiConfig): string {
  // 如果服务器已在运行，先停止
  if (proxyServer) {
    log.info('[API Proxy] 代理服务器已在运行，先停止旧实例');
    stopProxyServer();
  }

  currentConfig = config;

  // 创建 HTTP 服务器 - 监听所有路径
  proxyServer = createServer((req, res) => {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, anthropic-version');

    // 处理 OPTIONS 预检请求
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const path = req.url || '';

    // 拦截 /count_tokens 端点（无论路径前缀是什么）
    if (req.method === 'POST' && path.endsWith('/count_tokens')) {
      handleCountTokens(req, res);
      return;
    }

    // 所有其他请求都转发到第三方 API
    handleForwardRequest(req, res, path);
  });

  // 监听端口
  proxyServer.listen(PROXY_PORT, '127.0.0.1', () => {
    log.info('[API Proxy] 代理服务器启动成功');
    log.info(`[API Proxy] 代理 URL: http://127.0.0.1:${PROXY_PORT}`);
    log.info(`[API Proxy] 目标 API: ${config.baseURL}`);
    log.info(`[API Proxy] 模型: ${config.model}`);
  });

  // 错误处理
  proxyServer.on('error', (err: Error) => {
    log.error('[API Proxy] 代理服务器错误:', err);
  });

  return `http://127.0.0.1:${PROXY_PORT}`;
}

/**
 * 停止代理服务器
 */
export function stopProxyServer(): void {
  if (proxyServer) {
    log.info('[API Proxy] 正在停止代理服务器...');
    proxyServer.close((err) => {
      if (err) {
        log.error('[API Proxy] 停止代理服务器时出错:', err);
      } else {
        log.info('[API Proxy] 代理服务器已停止');
      }
    });
    proxyServer = null;
    currentConfig = null;
  }
}

/**
 * 获取代理服务器状态
 */
export function getProxyStatus(): {
  running: boolean;
  url?: string;
  targetApi?: string;
  model?: string;
} {
  if (!proxyServer) {
    return { running: false };
  }
  return {
    running: true,
    url: `http://127.0.0.1:${PROXY_PORT}`,
    targetApi: currentConfig?.baseURL,
    model: currentConfig?.model,
  };
}

/**
 * 处理 /count_tokens 请求
 * 不转发到第三方 API，直接返回估算值
 */
async function handleCountTokens(req: IncomingMessage, res: ServerResponse): Promise<void> {
  let body = '';

  req.on('data', (chunk: Buffer) => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const request = JSON.parse(body) as AnthropicRequest;

      log.info('[API Proxy] count_tokens 请求:', {
        model: request.model,
        messagesCount: request.messages?.length || 0,
        hasSystem: !!request.system,
        hasTools: !!request.tools,
      });

      // 估算 token 数
      const tokenCount = estimateTokens(request);

      log.info('[API Proxy] count_tokens 估算结果:', tokenCount);

      // 返回结果
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          input_tokens: tokenCount.input,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        })
      );
    } catch (error) {
      log.error('[API Proxy] count_tokens 处理失败:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: {
            message: `Failed to count tokens: ${error instanceof Error ? error.message : String(error)}`,
            type: 'internal_error',
          },
        })
      );
    }
  });
}

/**
 * 处理所有转发请求
 * 使用 ApiAdapter 进行格式转换后转发到第三方 API
 */
async function handleForwardRequest(req: IncomingMessage, res: ServerResponse, requestPath: string): Promise<void> {
  let body = '';

  req.on('data', (chunk: Buffer) => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const request = JSON.parse(body) as AnthropicRequest;

      // 检测是否为流式请求
      const isStreaming = request.stream === true;

      log.info('[API Proxy] 转发请求:', {
        requestPath,
        model: request.model,
        baseURL: currentConfig?.baseURL,
        apiType: currentConfig?.apiType,
        messagesCount: request.messages?.length || 0,
        streaming: isStreaming,
      });

      if (!currentConfig) {
        throw new Error('Proxy server not configured');
      }

      // 获取 API 适配器（传递 config 以支持 forceOpenaiFormat 标志）
      const apiType = currentConfig.apiType || 'anthropic';
      const adapter = getApiAdapter(apiType, currentConfig);

      // 使用适配器转换请求
      const transformedRequest = adapter.transformRequest(request, currentConfig);
      log.info(`[API Proxy] 转发到: ${transformedRequest.url}`);
      log.info(`[API Proxy] 发送请求体:`, JSON.stringify(transformedRequest.body, null, 2));

      // 转发请求到第三方 API
      const response = await fetch(transformedRequest.url, {
        method: 'POST',
        headers: transformedRequest.headers,
        body: JSON.stringify(transformedRequest.body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        log.error('[API Proxy] 第三方 API 返回错误:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });

        // 检测端点不可用错误，自动回退到 OpenAI 格式
        const isEndpointError =
          errorText.includes('API 端点不存在') ||
          errorText.includes('请求参数错误') ||
          errorText.includes('endpoint') && errorText.includes('not found') ||
          response.status === 404;

        // 如果是端点错误且未强制使用 OpenAI 格式，尝试回退
        if (isEndpointError && !currentConfig.forceOpenaiFormat) {
          log.warn('[API Proxy] 检测到端点不可用，自动切换到 OpenAI 兼容格式');

          // 更新配置
          currentConfig.forceOpenaiFormat = true;

          // 保存配置以便下次使用
          try {
            saveApiConfig(currentConfig);
            log.info('[API Proxy] 已保存 OpenAI 格式配置');
          } catch (e) {
            log.warn('[API Proxy] 保存配置失败:', e);
          }

          // 使用新适配器重试
          const retryAdapter = getApiAdapter(apiType, currentConfig);
          const retryRequest = retryAdapter.transformRequest(request, currentConfig);
          log.info(`[API Proxy] 重试到: ${retryRequest.url}`);

          const retryResponse = await fetch(retryRequest.url, {
            method: 'POST',
            headers: retryRequest.headers,
            body: JSON.stringify(retryRequest.body),
          });

          if (retryResponse.ok) {
            // 重试成功，处理响应
            const responseData = await retryResponse.text();
            const transformedResponse = retryAdapter.transformResponse(
              JSON.parse(responseData),
              currentConfig
            );

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(transformedResponse));
            log.info('[API Proxy] 使用 OpenAI 格式请求成功');
            return;
          } else {
            // 重试也失败，返回错误
            const retryError = await retryResponse.text();
            log.error('[API Proxy] OpenAI 格式重试失败:', retryError);
            res.writeHead(retryResponse.status, { 'Content-Type': 'application/json' });
            res.end(retryError);
            return;
          }
        }

        // 非端点错误或已强制使用 OpenAI 格式，返回原始错误
        res.writeHead(response.status, { 'Content-Type': 'application/json' });
        res.end(errorText);
        return;
      }

      // 处理流式响应
      if (isStreaming) {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });

        // 管道传输流式响应
        const reader = response.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });

              // 如果适配器有流式转换器，使用它
              const transformedChunk = adapter.transformStream
                ? adapter.transformStream(chunk, currentConfig)
                : chunk;

              if (transformedChunk) {
                res.write(transformedChunk);
              }
            }
          } finally {
            reader.releaseLock();
            res.end();
          }
        } else {
          res.end();
        }

        log.info('[API Proxy] 流式请求完成');
      } else {
        // 非流式响应
        const responseData = await response.text();

        // 使用适配器转换响应
        const transformedResponse = adapter.transformResponse(
          JSON.parse(responseData),
          currentConfig
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(transformedResponse));

        log.info('[API Proxy] 转发请求成功');
      }
    } catch (error) {
      log.error('[API Proxy] 转发请求失败:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: {
            message: `Internal server error: ${error instanceof Error ? error.message : String(error)}`,
            type: 'internal_error',
          },
        })
      );
    }
  });
}
