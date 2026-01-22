/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-22
 * @updated     2026-01-22
 * @Email       None
 *
 * 技能元数据存储 - 存储用户的备注和标签
 * 不修改原始技能文件，元数据独立存储
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { log } from '../logger.js';

/**
 * 技能标签
 */
export interface SkillTag {
  id: string;
  name: string;
  color: string; // 标签颜色（用于显示）
  createdAt: number;
}

/**
 * 技能元数据（用户的备注和标签）
 */
export interface SkillMetadata {
  skillName: string;
  note?: string;      // 用户备注（中文说明等）
  tags: string[];     // 关联的标签 ID 列表
  updatedAt: number;
}

/**
 * 元数据存储完整结构
 */
interface MetadataStore {
  tags: Record<string, SkillTag>;       // 标签字典：tagId -> SkillTag
  skills: Record<string, SkillMetadata>; // 技能元数据：skillName -> SkillMetadata
}

// 获取元数据文件路径
function getMetadataFilePath(): string {
  return join(homedir(), '.claude', 'skills-metadata.json');
}

/**
 * 读取元数据存储
 */
async function readMetadataStore(): Promise<MetadataStore> {
  try {
    const filePath = getMetadataFilePath();
    await fs.access(filePath);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    // 文件不存在或读取失败，返回空存储
    return { tags: {}, skills: {} };
  }
}

/**
 * 写入元数据存储
 */
async function writeMetadataStore(store: MetadataStore): Promise<void> {
  const filePath = getMetadataFilePath();
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

/**
 * 获取所有标签
 */
export async function getAllTags(): Promise<SkillTag[]> {
  try {
    const store = await readMetadataStore();
    return Object.values(store.tags);
  } catch (error) {
    log.error('[skills-metadata] Failed to get tags:', error);
    return [];
  }
}

/**
 * 创建标签
 */
export async function createTag(name: string, color: string = '#6366f1'): Promise<SkillTag> {
  const store = await readMetadataStore();

  // 检查标签名是否已存在
  const existingTag = Object.values(store.tags).find(tag => tag.name === name);
  if (existingTag) {
    throw new Error('标签名称已存在');
  }

  const tag: SkillTag = {
    id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    color,
    createdAt: Date.now(),
  };

  store.tags[tag.id] = tag;
  await writeMetadataStore(store);

  log.info(`[skills-metadata] Created tag: ${name} (${tag.id})`);
  return tag;
}

/**
 * 删除标签
 */
export async function deleteTag(tagId: string): Promise<void> {
  const store = await readMetadataStore();

  if (!store.tags[tagId]) {
    throw new Error('标签不存在');
  }

  // 从所有技能中移除该标签
  for (const skillName in store.skills) {
    const skill = store.skills[skillName];
    skill.tags = skill.tags.filter(id => id !== tagId);
  }

  // 删除标签
  delete store.tags[tagId];
  await writeMetadataStore(store);

  log.info(`[skills-metadata] Deleted tag: ${tagId}`);
}

/**
 * 更新标签
 */
export async function updateTag(tagId: string, updates: { name?: string; color?: string }): Promise<SkillTag> {
  const store = await readMetadataStore();

  if (!store.tags[tagId]) {
    throw new Error('标签不存在');
  }

  // 检查新名称是否与其他标签冲突
  if (updates.name && updates.name !== store.tags[tagId].name) {
    const existingTag = Object.values(store.tags).find(tag => tag.name === updates.name);
    if (existingTag) {
      throw new Error('标签名称已存在');
    }
  }

  Object.assign(store.tags[tagId], updates);
  await writeMetadataStore(store);

  log.info(`[skills-metadata] Updated tag: ${tagId}`);
  return store.tags[tagId];
}

/**
 * 获取技能元数据
 */
export async function getSkillMetadata(skillName: string): Promise<SkillMetadata | null> {
  try {
    const store = await readMetadataStore();
    return store.skills[skillName] || null;
  } catch (error) {
    log.error('[skills-metadata] Failed to get skill metadata:', error);
    return null;
  }
}

/**
 * 设置技能备注
 */
export async function setSkillNote(skillName: string, note: string): Promise<void> {
  const store = await readMetadataStore();

  if (!store.skills[skillName]) {
    store.skills[skillName] = {
      skillName,
      tags: [],
      updatedAt: Date.now(),
    };
  }

  store.skills[skillName].note = note;
  store.skills[skillName].updatedAt = Date.now();

  await writeMetadataStore(store);
  log.info(`[skills-metadata] Set note for skill: ${skillName}`);
}

/**
 * 删除技能备注
 */
export async function deleteSkillNote(skillName: string): Promise<void> {
  const store = await readMetadataStore();

  if (store.skills[skillName]) {
    delete store.skills[skillName].note;
    store.skills[skillName].updatedAt = Date.now();
    await writeMetadataStore(store);
    log.info(`[skills-metadata] Deleted note for skill: ${skillName}`);
  }
}

/**
 * 为技能添加标签
 */
export async function addTagToSkill(skillName: string, tagId: string): Promise<void> {
  const store = await readMetadataStore();

  if (!store.tags[tagId]) {
    throw new Error('标签不存在');
  }

  if (!store.skills[skillName]) {
    store.skills[skillName] = {
      skillName,
      tags: [],
      updatedAt: Date.now(),
    };
  }

  if (!store.skills[skillName].tags.includes(tagId)) {
    store.skills[skillName].tags.push(tagId);
    store.skills[skillName].updatedAt = Date.now();
    await writeMetadataStore(store);
    log.info(`[skills-metadata] Added tag ${tagId} to skill: ${skillName}`);
  }
}

/**
 * 从技能移除标签
 */
export async function removeTagFromSkill(skillName: string, tagId: string): Promise<void> {
  const store = await readMetadataStore();

  if (store.skills[skillName]) {
    const index = store.skills[skillName].tags.indexOf(tagId);
    if (index > -1) {
      store.skills[skillName].tags.splice(index, 1);
      store.skills[skillName].updatedAt = Date.now();
      await writeMetadataStore(store);
      log.info(`[skills-metadata] Removed tag ${tagId} from skill: ${skillName}`);
    }
  }
}

/**
 * 获取带有完整标签信息的技能元数据
 */
export async function getSkillMetadataWithTags(skillName: string): Promise<{
  metadata: SkillMetadata | null;
  tags: SkillTag[];
} | null> {
  try {
    const store = await readMetadataStore();
    const metadata = store.skills[skillName];

    if (!metadata) {
      return { metadata: null, tags: [] };
    }

    const tags = metadata.tags
      .map(tagId => store.tags[tagId])
      .filter(Boolean) as SkillTag[];

    return { metadata, tags };
  } catch (error) {
    log.error('[skills-metadata] Failed to get skill metadata with tags:', error);
    return null;
  }
}

/**
 * 获取所有技能的元数据（带标签）
 */
export async function getAllSkillsMetadata(): Promise<Record<string, {
  metadata: SkillMetadata;
  tags: SkillTag[];
}>> {
  try {
    const store = await readMetadataStore();
    const result: Record<string, {
      metadata: SkillMetadata;
      tags: SkillTag[];
    }> = {};

    for (const [skillName, metadata] of Object.entries(store.skills)) {
      const tags = metadata.tags
        .map(tagId => store.tags[tagId])
        .filter(Boolean) as SkillTag[];

      result[skillName] = { metadata, tags };
    }

    return result;
  } catch (error) {
    log.error('[skills-metadata] Failed to get all skills metadata:', error);
    return {};
  }
}
