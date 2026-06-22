import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ENV_FILE = path.join(process.cwd(), ".env.local");

// POST - update .env.local with new key-value pairs
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Only allow specific keys
  const ALLOWED_KEYS = ["DEEPSEEK_API_KEY"];
  const entries = Object.entries(body).filter(([key]) =>
    ALLOWED_KEYS.includes(key)
  );

  if (entries.length === 0) {
    return NextResponse.json(
      { error: "No valid keys provided" },
      { status: 400 }
    );
  }

  try {
    // Read existing .env.local
    let content = "";
    if (fs.existsSync(ENV_FILE)) {
      content = fs.readFileSync(ENV_FILE, "utf-8");
    }

    // Update or add each key
    for (const [key, value] of entries) {
      const regex = new RegExp(`^${key}=.*$`, "m");
      const newLine = `${key}=${value}`;

      if (regex.test(content)) {
        content = content.replace(regex, newLine);
      } else {
        content = content.trimEnd() + "\n" + newLine + "\n";
      }
    }

    fs.writeFileSync(ENV_FILE, content, "utf-8");

    return NextResponse.json({
      ok: true,
      message: "Environment updated. Restart the dev server to apply changes.",
    });
  } catch (err) {
    console.error("[env API] Failed to write .env.local:", err);
    return NextResponse.json(
      { error: "Failed to write .env.local" },
      { status: 500 }
    );
  }
}
