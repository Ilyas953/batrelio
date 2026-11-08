// End-to-end tests: starts the production build locally and runs real flows against it.
// Usage: npm run build && npm run test:e2e
//
// The suites use the Supabase project of .env.local. They only create throwaway data
// (accounts e2e-…@example.com, counters for documentation IP addresses) and delete it at the end.
// Nothing is bought or sent: test accounts get fictional numbers and simulated SMS.
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createContext } from "../tests/e2e/helpers.mjs";
import { effortSuite } from "../tests/e2e/effort.e2e.mjs";
import { messagesSuite } from "../tests/e2e/messages.e2e.mjs";
import { missionsSuite } from "../tests/e2e/missions.e2e.mjs";
import { navigationSuite } from "../tests/e2e/navigation.e2e.mjs";
import { securitySuite } from "../tests/e2e/security.e2e.mjs";
import { simulationSuite } from "../tests/e2e/simulation.e2e.mjs";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE = `http://localhost:${PORT}`;
const SUITES = { "Mode test et simulateur": simulationSuite, "Messages personnalisés": messagesSuite,
  "Onglets": navigationSuite, "Visites et missions partagées": missionsSuite,
  "Moins d'efforts": effortSuite, "Sécurité": securitySuite };

function readActionIds() {
  const manifestPath = ".next/server/server-reference-manifest.json";
  if (!existsSync(".next/BUILD_ID") || !existsSync(manifestPath)) {
    throw new Error("Aucun build trouvé : lancez d'abord npm run build.");
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  return Object.fromEntries(Object.entries(manifest.node).map(([id, entry]) => [entry.exportedName, id]));
}

async function startServer() {
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], { stdio: ["ignore", "pipe", "pipe"] });
  let output = "";
  server.stdout.on("data", (chunk) => (output += chunk));
  server.stderr.on("data", (chunk) => (output += chunk));

  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      if ((await fetch(`${BASE}/connexion`)).ok) return { server, logs: () => output };
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  server.kill();
  throw new Error(`Le serveur ne démarre pas sur le port ${PORT} :\n${output}`);
}

async function main() {
  const actionIds = readActionIds();
  console.log(`Serveur de test sur ${BASE} · base Supabase de .env.local (données jetables, supprimées à la fin)\n`);
  const { server, logs } = await startServer();
  let failed = 0;
  let passed = 0;

  try {
    for (const [name, suite] of Object.entries(SUITES)) {
      console.log(name);
      const context = createContext(BASE, actionIds);
      try {
        await suite(context);
      } catch (error) {
        context.check("la suite s'exécute jusqu'au bout", false, error instanceof Error ? error.stack : String(error));
      } finally {
        await context.cleanup();
      }
      passed += context.results.filter((result) => result.ok).length;
      failed += context.results.filter((result) => !result.ok).length;
      console.log("");
    }
  } finally {
    server.kill();
  }

  console.log(`${passed} vérifications réussies, ${failed} en échec`);
  if (failed > 0) {
    console.log(`\nJournal du serveur :\n${logs().slice(-4000)}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
