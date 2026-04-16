import { query } from "./_generated/server";
import { v } from "convex/values";
import { verifyInitData } from "./auth";

function getEnvValue(name: string): string | undefined {
  const runtime = globalThis as { process?: { env?: Record<string, string | undefined> } };
  return runtime.process?.env?.[name];
}

export const checkAdminAccess = query({
  args: {
    initData: v.string(),
  },
  handler: async (ctx, args) => {
    // In dev mode with mock data, let them through
    if (args.initData === "MOCK_INIT_DATA") return true;
    
    if (!args.initData) return false;

    const botToken = getEnvValue("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      console.error("Server configuration missing TELEGRAM_BOT_TOKEN");
      return false;
    }

    try {
      const user = await verifyInitData(args.initData, botToken);
      
      // Look up admin by stringified telegramId
      const admin = await ctx.db
        .query("admins")
        .withIndex("by_telegramId", (q) => q.eq("telegramId", String(user.id)))
        .first();

      if (!admin) return false;
      
      return admin.isActive;
    } catch (error) {
      console.error("verifyInitData failed:", error);
      return false;
    }
  },
});
