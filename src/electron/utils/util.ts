import { getCurrentApiConfig, buildEnvForConfig } from "../services/claude-settings.js";

// Build enhanced PATH for packaged environment
export function getEnhancedEnv(): Record<string, string | undefined> {

  const config = getCurrentApiConfig();
  if (!config) {
    return {
      ...process.env,
    };
  }
  
  const env = buildEnvForConfig(config);
  return {
    ...process.env,
    ...env,
  };
}

/**
 * 生成会话标题
 *
 * 使用 SDK 的 unstable_v2_prompt API 来生成简短的会话标题。
 * 如果 API 调用失败，将使用用户输入的前 5 个单词作为后备标题。
 *
 * 重要：此函数永远不会抛出错误，始终返回一个有效标题。
 *
 * @param userIntent - 用户的原始输入
 * @returns 生成的会话标题
 */
export const generateSessionTitle = async (userIntent: string | null): Promise<string> => {
  // 空输入返回默认标题
  if (!userIntent) return "新会话";

  // 生成后备标题（基于用户输入的前 5 个单词）
  const getFallbackTitle = (input: string): string => {
    const words = input.trim().split(/\s+/).slice(0, 5);
    return words.join(" ") + (input.trim().split(/\s+/).length > 5 ? "..." : "");
  };

  // 直接返回后备标题，不调用 SDK
  // 原因：
  // 1. unstable_v2_prompt 在打包后可能不稳定
  // 2. 标题生成失败不应该阻止会话启动
  // 3. 后备标题已经足够实用
  return getFallbackTitle(userIntent);

  /* TODO: 未来可以重新启用 SDK 标题生成，但需要确保：
   * 1. 不会因为 SDK 错误而阻止会话启动
   * 2. 有超时机制避免长时间等待
   * 3. 在打包环境中测试通过
   */
};
