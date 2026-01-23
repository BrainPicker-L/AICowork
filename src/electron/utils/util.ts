import { unstable_v2_prompt } from "@anthropic-ai/claude-agent-sdk";
import type { SDKResultMessage } from "@anthropic-ai/claude-agent-sdk";
import { getCurrentApiConfig, buildEnvForConfig, getClaudeCodePath} from "../services/claude-settings.js";
import { app } from "electron";
import { log } from "../logger.js";

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

export const generateSessionTitle = async (userIntent: string | null) => {
  if (!userIntent) return "New Session";

  // Get the Claude Code path when needed, not at module load time
  const claudeCodePath = getClaudeCodePath();
  // Get fresh env each time to ensure latest API config is used
  const currentEnv = getEnhancedEnv();

  try {
    const result: SDKResultMessage = await unstable_v2_prompt(
      `please analyze the following user input to generate a short but clear title to identify this conversation theme:
      ${userIntent}
      directly output the title, do not include any other content`, {
      model: getCurrentApiConfig()?.model || "claude-sonnet",
      env: currentEnv,
      pathToClaudeCodeExecutable: claudeCodePath,
    });

    if (result.subtype === "success") {
      return result.result;
    }

    // Log any non-success result for debugging
    log.warn("Claude SDK returned non-success result:", result);
    return "New Session";
  } catch (error) {
    // Enhanced error logging for packaged app debugging
    log.error("Failed to generate session title:", error);
    log.debug("Claude Code path:", claudeCodePath);
    log.debug("Is packaged:", app.isPackaged);
    log.debug("Resources path:", process.resourcesPath);

    // Return a simple title based on user input as fallback
    if (userIntent) {
      const words = userIntent.trim().split(/\s+/).slice(0, 5);
      return words.join(" ").toUpperCase() + (userIntent.trim().split(/\s+/).length > 5 ? "..." : "");
    }

    return "New Session";
  }
};
