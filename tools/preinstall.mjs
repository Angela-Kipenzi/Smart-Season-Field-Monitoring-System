import fs from "node:fs";
import path from "node:path";

function rmIfExists(relativePath) {
  const fullPath = path.join(process.cwd(), relativePath);
  try {
    fs.rmSync(fullPath, { force: true });
  } catch {
    // ignore
  }
}

rmIfExists("package-lock.json");
rmIfExists("yarn.lock");

const userAgent = process.env.npm_config_user_agent ?? "";
if (!userAgent.startsWith("pnpm/")) {
  process.stderr.write("Use pnpm instead\n");
  process.exit(1);
}

