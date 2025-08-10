#!/usr/bin/env node
import fs from "fs";
import os from "os";
import path from "path";

function getClaudeConfigPath() {
  const home = os.homedir();
  if (process.platform === "win32") {
    return path.join(home, "AppData", "Roaming", "Claude", "claude_desktop_config.json");
  } else if (process.platform === "darwin") {
    return path.join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json");
  } else {
    return path.join(home, ".config", "Claude", "claude_desktop_config.json");
  }
}

function getGeminiCLIConfigPath() {
  return path.join(os.homedir(), ".gemini", "settings.json");
}

function getVSCodeConfigPath() {
  const home = os.homedir();
  if (process.platform === "win32") {
    return path.join(home, "AppData", "Roaming", "Code", "User", "mcp.json");
  } else if (process.platform === "darwin") {
    return path.join(home, "Library", "Application Support", "Code", "User", "mcp.json");
  } else {
    return path.join(home, ".config", "Code", "User", "mcp.json");
  }
}

function getCursorConfigPath() {
  const home = os.homedir();
  if (process.platform === "win32") {
    return path.join(home, "AppData", "Roaming", "Cursor", "User", "mcp.json");
  } else if (process.platform === "darwin") {
    return path.join(home, "Library", "Application Support", "Cursor", "User", "mcp.json");
  } else {
    return path.join(home, ".config", "Cursor", "User", "mcp.json");
  }
}

function updateMCPConfig(filePath, name, cmd, args, env) {
  let config = {};
  try {
    if (fs.existsSync(filePath)) {
      config = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (e) {
    console.warn(`⚠ Could not read ${filePath}, starting fresh`);
    config = {};
  }

  const envObj = (env ?? []).reduce((acc, val) => {
    const [key, value] = val.split("=");
    acc[key] = value;
    return acc;
  }, {});

  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  config.mcpServers[name] = {
    command: cmd,
    args: args,
    ...(env && Object.keys(envObj).length > 0 ? { env: envObj } : {}),
  };

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
  console.log(`✅ Updated ${filePath} for MCP server "${name}"`);
}

function installMCPServer(name, cmd, args, env) {
  const paths = {
    claude: getClaudeConfigPath(),
    gemini: getGeminiCLIConfigPath(),
    vscode: getVSCodeConfigPath(),
    cursor: getCursorConfigPath(),
  };

  let updated = false;

  for (const [app, filePath] of Object.entries(paths)) {
    const dir = path.dirname(filePath);
    if (fs.existsSync(dir)) { // app folder exists → assume installed
      updateMCPConfig(filePath, name, cmd, args, env);
      updated = true;
    }
  }

  if (!updated) {
    console.warn("⚠ No supported apps detected. Nothing was updated.");
  }
}

// CLI usage: node install-mcp.js my-server npx my-package --arg1 val1
const [, , serverName, command, ...rest] = process.argv;

if (!serverName || !command) {
  console.error("Usage: node install-mcp.js <serverName> <command> [args...]");
  process.exit(1);
}

installMCPServer(serverName, command, rest, []);
