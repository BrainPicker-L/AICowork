/**
 * 记忆 MCP 服务器
 * 使用 SDK MCP 功能注册记忆工具
 */

import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { memorySearch, memoryStore, memoryAsk, getMemoryToolConfig } from "./memory-tools.js";
import { log } from "../logger.js";

/**
 * 创建记忆 MCP 服务器
 * 返回包含记忆工具的 MCP 服务器配置
 */
export async function createMemoryMcpServer(): Promise<any> {
  try {
    const memConfig = getMemoryToolConfig();

    // 创建记忆工具的 MCP 服务器
    // createSdkMcpServer 返回 McpSdkServerConfigWithInstance
    const serverConfig = createSdkMcpServer({
      name: "memory-tools",
      version: "1.0.0",
      tools: [
        // memory_search 工具
        tool(
          "memory_search",
          "从长期记忆中搜索相关信息。用于查找之前存储的项目信息、技术决策、用户偏好等。",
          {
            query: z.string().describe("搜索关键词或问题"),
            k: z.number().optional().default(6).describe("返回结果数量，默认6"),
          },
          async (args) => {
            log.info("[Memory MCP] memory_search called:", args);
            try {
              const result = await memorySearch(
                args.query,
                args.k ?? memConfig.defaultK
              );
              return {
                content: [{ type: "text", text: result }],
              };
            } catch (error) {
              log.error("[Memory MCP] memory_search error:", error);
              return {
                content: [{ type: "text", text: `搜索失败: ${error instanceof Error ? error.message : String(error)}` }],
                isError: true,
              };
            }
          }
        ),

        // memory_store 工具
        tool(
          "memory_store",
          "将重要信息存储到长期记忆。用于记录项目决策、技术方案、用户偏好等重要信息。",
          {
            title: z.string().describe("信息标题（简短描述）"),
            text: z.string().describe("信息详细内容"),
            label: z.enum(["project", "preference", "technical", "context", "custom"]).optional().default("custom").describe("分类标签"),
          },
          async (args) => {
            log.info("[Memory MCP] memory_store called:", args);
            try {
              const result = await memoryStore(
                args.title,
                args.text,
                args.label ?? "custom"
              );
              return {
                content: [{ type: "text", text: result }],
              };
            } catch (error) {
              log.error("[Memory MCP] memory_store error:", error);
              return {
                content: [{ type: "text", text: `存储失败: ${error instanceof Error ? error.message : String(error)}` }],
                isError: true,
              };
            }
          }
        ),

        // memory_ask 工具
        tool(
          "memory_ask",
          "基于记忆的问答。使用 RAG（检索增强生成）技术，根据记忆内容回答问题。",
          {
            question: z.string().describe("要回答的问题"),
            k: z.number().optional().default(6).describe("检索相关记忆的数量，默认6"),
          },
          async (args) => {
            log.info("[Memory MCP] memory_ask called:", args);
            try {
              const result = await memoryAsk(
                args.question,
                args.k ?? memConfig.defaultK
              );
              return {
                content: [{ type: "text", text: result }],
              };
            } catch (error) {
              log.error("[Memory MCP] memory_ask error:", error);
              return {
                content: [{ type: "text", text: `问答失败: ${error instanceof Error ? error.message : String(error)}` }],
                isError: true,
              };
            }
          }
        ),
      ],
    });

    log.info("[Memory MCP] Server created successfully");
    return serverConfig;
  } catch (error) {
    log.error("[Memory MCP] Failed to create server:", error);
    throw error;
  }
}
