/**
 * Rules 规则管理存储库
 * 管理项目 .claude/rules/ 目录下的规则文件
 */

import { promises as fs } from 'fs';
import { join, dirname, basename, normalize } from 'path';
import { app } from 'electron';
import { log } from '../logger.js';

/**
 * 获取项目 .claude 目录路径
 */
function getClaudeDir(): string {
    // 尝试从当前工作目录获取
    const cwd = process.cwd();
    return join(cwd, '.claude');
}

/**
 * 获取 rules 目录路径
 */
function getRulesDir(): string {
    return join(getClaudeDir(), 'rules');
}

/**
 * 确保 rules 目录存在
 */
async function ensureRulesDir(): Promise<void> {
    const rulesDir = getRulesDir();
    try {
        await fs.access(rulesDir);
    } catch {
        await fs.mkdir(rulesDir, { recursive: true });
    }
}

/**
 * 验证规则文件名
 */
function validateRuleName(name: string): string {
    const trimmed = name.trim();

    // 必须是 .md 文件
    if (!trimmed.endsWith('.md')) {
        throw new Error('规则文件必须是 .md 格式');
    }

    // 使用 normalize 和 basename 清理路径
    const normalized = normalize(trimmed);
    const cleanName = basename(normalized);

    // 验证清理后的名称
    if (cleanName !== trimmed || normalized !== trimmed) {
        throw new Error('规则文件名包含非法字符或路径');
    }

    // 只允许字母、数字、连字符、下划线和点
    const validNameRegex = /^[a-zA-Z0-9_.-]+\.md$/;
    if (!validNameRegex.test(cleanName)) {
        throw new Error('规则文件名只能包含字母、数字、连字符、下划线和点');
    }

    return cleanName;
}

/**
 * 获取所有规则文件列表
 */
export async function getRulesList(): Promise<{ success: boolean; error?: string; rules: Array<{ name: string; path: string; content: string; language: string; modified: number }> }> {
    try {
        await ensureRulesDir();
        const rulesDir = getRulesDir();
        const entries = await fs.readdir(rulesDir, { withFileTypes: true });

        const rules: Array<{ name: string; path: string; content: string; language: string; modified: number }> = [];

        for (const entry of entries) {
            if (entry.isFile() && entry.name.endsWith('.md')) {
                const filePath = join(rulesDir, entry.name);
                const content = await fs.readFile(filePath, 'utf-8');
                const stats = await fs.stat(filePath);

                rules.push({
                    name: entry.name,
                    path: filePath,
                    content,
                    language: 'markdown',
                    modified: stats.mtimeMs,
                });
            }
        }

        return { success: true, rules };
    } catch (error) {
        log.error('[rules-store] Failed to get rules list:', error);
        return { success: false, error: error instanceof Error ? error.message : '获取规则列表失败', rules: [] };
    }
}

/**
 * 获取规则文件内容
 */
export async function getRuleContent(rulePath: string): Promise<{ success: boolean; error?: string; content?: string }> {
    try {
        const content = await fs.readFile(rulePath, 'utf-8');
        return { success: true, content };
    } catch (error) {
        log.error('[rules-store] Failed to get rule content:', error);
        return { success: false, error: error instanceof Error ? error.message : '读取规则文件失败' };
    }
}

/**
 * 保存规则文件
 */
export async function saveRule(rulePath: string, content: string): Promise<{ success: boolean; error?: string }> {
    try {
        await ensureRulesDir();
        await fs.writeFile(rulePath, content, 'utf-8');
        log.info(`[rules-store] Rule saved: ${rulePath}`);
        return { success: true };
    } catch (error) {
        log.error('[rules-store] Failed to save rule:', error);
        return { success: false, error: error instanceof Error ? error.message : '保存规则失败' };
    }
}

/**
 * 创建新规则文件
 */
export async function createRule(name: string, content: string): Promise<{ success: boolean; error?: string; path?: string }> {
    try {
        await ensureRulesDir();

        // 验证文件名
        const cleanName = validateRuleName(name);

        const rulePath = join(getRulesDir(), cleanName);

        // 检查文件是否已存在
        try {
            await fs.access(rulePath);
            return { success: false, error: '规则文件已存在' };
        } catch {
            // 文件不存在，可以创建
        }

        await fs.writeFile(rulePath, content, 'utf-8');
        log.info(`[rules-store] Rule created: ${cleanName}`);

        return { success: true, path: rulePath };
    } catch (error) {
        if (error instanceof Error && error.message.includes('规则文件')) {
            return { success: false, error: error.message };
        }
        log.error('[rules-store] Failed to create rule:', error);
        return { success: false, error: error instanceof Error ? error.message : '创建规则失败' };
    }
}

/**
 * 删除规则文件
 */
export async function deleteRule(rulePath: string): Promise<{ success: boolean; error?: string }> {
    try {
        await fs.unlink(rulePath);
        log.info(`[rules-store] Rule deleted: ${rulePath}`);
        return { success: true };
    } catch (error) {
        log.error('[rules-store] Failed to delete rule:', error);
        return { success: false, error: error instanceof Error ? error.message : '删除规则失败' };
    }
}

/**
 * 获取 Claude.md 配置
 */
export async function getClaudeConfig(): Promise<{ success: boolean; error?: string; config?: { path: string; content: string; exists: boolean; modified?: number } }> {
    try {
        const claudeDir = getClaudeDir();
        const configPath = join(claudeDir, 'CLAUDE.md');

        let exists = false;
        let content = '';
        let modified: number | undefined;

        try {
            await fs.access(configPath);
            const stats = await fs.stat(configPath);
            content = await fs.readFile(configPath, 'utf-8');
            exists = true;
            modified = stats.mtimeMs;
        } catch {
            // 文件不存在
        }

        return { success: true, config: { path: configPath, content, exists, modified } };
    } catch (error) {
        log.error('[rules-store] Failed to get Claude config:', error);
        return { success: false, error: error instanceof Error ? error.message : '获取配置失败' };
    }
}

/**
 * 保存 Claude.md 配置
 */
export async function saveClaudeConfig(content: string): Promise<{ success: boolean; error?: string }> {
    try {
        const claudeDir = getClaudeDir();
        const configPath = join(claudeDir, 'CLAUDE.md');

        // 确保 .claude 目录存在
        try {
            await fs.access(claudeDir);
        } catch {
            await fs.mkdir(claudeDir, { recursive: true });
        }

        await fs.writeFile(configPath, content, 'utf-8');
        log.info('[rules-store] Claude config saved');
        return { success: true };
    } catch (error) {
        log.error('[rules-store] Failed to save Claude config:', error);
        return { success: false, error: error instanceof Error ? error.message : '保存配置失败' };
    }
}

/**
 * 删除 Claude.md 配置
 */
export async function deleteClaudeConfig(): Promise<{ success: boolean; error?: string }> {
    try {
        const claudeDir = getClaudeDir();
        const configPath = join(claudeDir, 'CLAUDE.md');

        await fs.unlink(configPath);
        log.info('[rules-store] Claude config deleted');
        return { success: true };
    } catch (error) {
        log.error('[rules-store] Failed to delete Claude config:', error);
        return { success: false, error: error instanceof Error ? error.message : '删除配置失败' };
    }
}

/**
 * 打开 Claude 配置目录
 */
export async function openClaudeDirectory(): Promise<{ success: boolean; error?: string }> {
    try {
        const { shell } = await import('electron');
        shell.openPath(getClaudeDir());
        return { success: true };
    } catch (error) {
        log.error('[rules-store] Failed to open directory:', error);
        return { success: false, error: error instanceof Error ? error.message : '打开目录失败' };
    }
}
