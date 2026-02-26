/**
 * 钉钉配置存储（多机器人）
 * 以字典形式管理多个钉钉机器人配置
 */

import { app } from "electron";
import { join } from "path";
import { promises as fs } from "fs";
import { log } from "../logger.js";
import type { DingTalkConfig } from "../types.js";
import { DEFAULT_DINGTALK_CONFIG } from "../types.js";

interface DingTalkStore {
  bots: Record<string, DingTalkConfig>;
}

function getConfigPath(): string {
  return join(app.getPath("userData"), "dingtalk-config.json");
}

async function readStore(): Promise<DingTalkStore> {
  const configPath = getConfigPath();
  try {
    await fs.access(configPath);
    const raw = await fs.readFile(configPath, "utf8");
    const parsed = JSON.parse(raw);

    // 兼容旧版单机器人格式：如果有 clientId 直接在顶层，迁移到 bots 字典
    if (parsed.clientId && !parsed.bots) {
      const legacyConfig: DingTalkConfig = { ...DEFAULT_DINGTALK_CONFIG, ...parsed };
      const store: DingTalkStore = { bots: { default: legacyConfig } };
      await writeStore(store);
      log.info("[dingtalk-store] Migrated legacy single-bot config to multi-bot format");
      return store;
    }

    return { bots: parsed.bots || {} };
  } catch {
    return { bots: {} };
  }
}

async function writeStore(store: DingTalkStore): Promise<void> {
  const configPath = getConfigPath();
  await fs.writeFile(configPath, JSON.stringify(store, null, 2), "utf8");
}

/**
 * 加载所有机器人配置
 */
export async function loadDingTalkBots(): Promise<Record<string, DingTalkConfig>> {
  const store = await readStore();
  return store.bots;
}

/**
 * 加载指定机器人配置
 */
export async function loadDingTalkBot(name: string): Promise<DingTalkConfig | null> {
  const store = await readStore();
  const config = store.bots[name];
  return config ? { ...DEFAULT_DINGTALK_CONFIG, ...config } : null;
}

/**
 * 保存（创建/更新）指定机器人配置
 */
export async function saveDingTalkBot(name: string, config: DingTalkConfig): Promise<void> {
  const store = await readStore();
  store.bots[name] = config;
  try {
    await writeStore(store);
    log.info(`[dingtalk-store] Bot '${name}' saved successfully`);
  } catch (error) {
    log.error(`[dingtalk-store] Failed to save bot '${name}':`, error);
    throw error;
  }
}

/**
 * 删除指定机器人配置
 */
export async function deleteDingTalkBot(name: string): Promise<void> {
  const store = await readStore();
  if (!(name in store.bots)) {
    return;
  }
  delete store.bots[name];
  try {
    await writeStore(store);
    log.info(`[dingtalk-store] Bot '${name}' deleted`);
  } catch (error) {
    log.error(`[dingtalk-store] Failed to delete bot '${name}':`, error);
    throw error;
  }
}

/**
 * 获取机器人列表（供 UI 使用）
 */
export async function getDingTalkBotList(): Promise<Array<{ name: string; config: DingTalkConfig }>> {
  const bots = await loadDingTalkBots();
  return Object.entries(bots).map(([name, config]) => ({
    name,
    config: { ...DEFAULT_DINGTALK_CONFIG, ...config },
  }));
}

/**
 * 校验钉钉配置
 */
export function validateDingTalkConfig(config: Partial<DingTalkConfig>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.clientId || !config.clientId.trim()) {
    errors.push("Client ID (AppKey) is required");
  }
  if (!config.clientSecret || !config.clientSecret.trim()) {
    errors.push("Client Secret (AppSecret) is required");
  }
  if (config.messageType === "card") {
    if (!config.cardTemplateId || !config.cardTemplateId.trim()) {
      errors.push("Card Template ID is required when message type is 'card'");
    }
  }
  if (config.dmPolicy === "allowlist" && (!config.allowFrom || config.allowFrom.length === 0)) {
    errors.push("At least one allowed user ID is required when DM policy is 'allowlist'");
  }
  if (config.groupPolicy === "allowlist" && (!config.allowGroups || config.allowGroups.length === 0)) {
    errors.push("At least one allowed group ID is required when group policy is 'allowlist'");
  }

  return { valid: errors.length === 0, errors };
}
