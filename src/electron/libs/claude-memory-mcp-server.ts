/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-22
 * @updated     2026-01-22
 * @Email       None
 *
 * Claude Memory Tool MCP 服务器
 * 实现 memory_20250818 工具类型的标准命令
 */

import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { handleMemoryToolCommand } from "./claude-memory-tool.js";
import { log } from "../logger.js";

/**
 * 创建 Claude Memory Tool MCP 服务器
 * 返回包含标准 memory 工具的 MCP 服务器配置
 */
export async function createClaudeMemoryToolServer(): Promise<any> {
  try {
    // 创建 Memory Tool 的 MCP 服务器
    const serverConfig = createSdkMcpServer({
      name: "memory",
      version: "20250818",
      tools: [
        // view 命令
        tool(
          "view",
          "显示目录内容或文件内容",
          {
            path: z.string().describe("要查看的路径（如 /memories 或 /memories/notes.txt）"),
            view_range: z.tuple([z.number(), z.number()]).optional().describe("可选：查看特定行范围 [start, end]"),
          },
          async (args) => {
            log.info("[Claude Memory Tool] view called:", args);
            try {
              const result = await handleMemoryToolCommand('view', args);
              return {
                content: [{ type: "text", text: result }],
              };
            } catch (error) {
              log.error("[Claude Memory Tool] view error:", error);
              return {
                content: [{ type: "text", text: `查看失败: ${error}` }],
                isError: true,
              };
            }
          }
        ),

        // create 命令
        tool(
          "create",
          "创建新文件",
          {
            path: z.string().describe("文件路径（如 /memories/notes.txt）"),
            file_text: z.string().describe("文件内容"),
          },
          async (args) => {
            log.info("[Claude Memory Tool] create called:", args);
            try {
              const result = await handleMemoryToolCommand('create', args);
              return {
                content: [{ type: "text", text: result }],
              };
            } catch (error) {
              log.error("[Claude Memory Tool] create error:", error);
              return {
                content: [{ type: "text", text: `创建失败: ${error}` }],
                isError: true,
              };
            }
          }
        ),

        // str_replace 命令
        tool(
          "str_replace",
          "替换文件中的文本",
          {
            path: z.string().describe("文件路径"),
            old_str: z.string().describe("要替换的旧文本"),
            new_str: z.string().describe("新文本"),
          },
          async (args) => {
            log.info("[Claude Memory Tool] str_replace called:", args);
            try {
              const result = await handleMemoryToolCommand('str_replace', args);
              return {
                content: [{ type: "text", text: result }],
              };
            } catch (error) {
              log.error("[Claude Memory Tool] str_replace error:", error);
              return {
                content: [{ type: "text", text: `替换失败: ${error}` }],
                isError: true,
              };
            }
          }
        ),

        // insert 命令
        tool(
          "insert",
          "在指定行插入文本",
          {
            path: z.string().describe("文件路径"),
            insert_line: z.number().describe("插入位置的行号"),
            insert_text: z.string().describe("要插入的文本"),
          },
          async (args) => {
            log.info("[Claude Memory Tool] insert called:", args);
            try {
              const result = await handleMemoryToolCommand('insert', args);
              return {
                content: [{ type: "text", text: result }],
              };
            } catch (error) {
              log.error("[Claude Memory Tool] insert error:", error);
              return {
                content: [{ type: "text", text: `插入失败: ${error}` }],
                isError: true,
              };
            }
          }
        ),

        // delete 命令
        tool(
          "delete",
          "删除文件或目录",
          {
            path: z.string().describe("要删除的文件或目录路径"),
          },
          async (args) => {
            log.info("[Claude Memory Tool] delete called:", args);
            try {
              const result = await handleMemoryToolCommand('delete', args);
              return {
                content: [{ type: "text", text: result }],
              };
            } catch (error) {
              log.error("[Claude Memory Tool] delete error:", error);
              return {
                content: [{ type: "text", text: `删除失败: ${error}` }],
                isError: true,
              };
            }
          }
        ),

        // rename 命令
        tool(
          "rename",
          "重命名或移动文件/目录",
          {
            old_path: z.string().describe("源路径"),
            new_path: z.string().describe("目标路径"),
          },
          async (args) => {
            log.info("[Claude Memory Tool] rename called:", args);
            try {
              const result = await handleMemoryToolCommand('rename', args);
              return {
                content: [{ type: "text", text: result }],
              };
            } catch (error) {
              log.error("[Claude Memory Tool] rename error:", error);
              return {
                content: [{ type: "text", text: `重命名失败: ${error}` }],
                isError: true,
              };
            }
          }
        ),
      ],
    });

    log.info("[Claude Memory Tool] MCP server created successfully");
    return serverConfig;
  } catch (error) {
    log.error("[Claude Memory Tool] Failed to create server:", error);
    throw error;
  }
}
