import fs from 'fs'
import path from 'path'

/**
 * Load and parse config.json with environment variable substitution.
 * Replaces ${VAR_NAME} placeholders with environment variable values.
 */
export function loadConfig(configPath: string, environment: 'staging-settings' | 'production-settings' = 'staging-settings') {
  const configContent = fs.readFileSync(configPath, 'utf8')
  const configText = substituteEnvVars(configContent)
  const rawConfig = JSON.parse(configText)
  
  return rawConfig[environment] || rawConfig['staging-settings'] || rawConfig
}

/**
 * Replace environment variable placeholders in config text.
 * Supports ${ENV_VAR_NAME} syntax.
 * Throws error if required env var is missing.
 */
export function substituteEnvVars(text: string): string {
  return text.replace(/\$\{([A-Z_][A-Z0-9_]*)\}/g, (match, varName) => {
    const value = process.env[varName]
    if (value === undefined) {
      throw new Error(
        `Missing required environment variable: ${varName}\n` +
        `Please set ${varName} in your .env file or environment.`
      )
    }
    return value
  })
}

/**
 * Load config with optional fallback to defaults for missing non-critical vars.
 * Non-critical vars like porApiUrl can have defaults.
 */
export function loadConfigWithDefaults(
  configPath: string,
  environment: 'staging-settings' | 'production-settings' = 'staging-settings',
  defaults?: Record<string, string>,
) {
  let configContent = fs.readFileSync(configPath, 'utf8')
  
  // First pass: replace all env vars that exist
  configContent = configContent.replace(/\$\{([A-Z_][A-Z0-9_]*)\}/g, (match, varName) => {
    const value = process.env[varName]
    if (value !== undefined) {
      return value
    }
    // Check defaults
    if (defaults && defaults[varName]) {
      return defaults[varName]
    }
    // Return as-is if not found (will fail validation in zod)
    return match
  })
  
  const rawConfig = JSON.parse(configContent)
  return rawConfig[environment] || rawConfig['staging-settings'] || rawConfig
}
