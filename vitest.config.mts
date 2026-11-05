import { defineConfig } from "vitest/config";

// Fast tests of the business rules: no server, no database, no network.
// The flows across the real app and Supabase are covered by npm run test:e2e.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // "server-only" throws outside the React server bundle; the logic under test does not care.
    alias: { "server-only": new URL("./tests/stubs/server-only.ts", import.meta.url).pathname },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    // Placeholders: modules read them when loaded, no test ever reaches Supabase or Twilio.
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      SUPABASE_SECRET_KEY: "sb_secret_test",
      TWILIO_ACCOUNT_SID: "AC_test",
      TWILIO_AUTH_TOKEN: "12345",
    },
  },
});
