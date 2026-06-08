// Copy the sql.js WASM binaries into /public so the browser can fetch them.
// Bundlers honour sql.js's `browser` field and load `sql-wasm-browser.js`,
// which requests `sql-wasm-browser.wasm`; the plain build requests
// `sql-wasm.wasm`. We copy both so locateFile (which returns `/<name>`)
// always resolves regardless of which build the bundler picks.
// Runs automatically before every build (npm `prebuild`).
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "node_modules/sql.js/dist");
const publicDir = resolve(root, "public");
mkdirSync(publicDir, { recursive: true });

for (const name of ["sql-wasm.wasm", "sql-wasm-browser.wasm"]) {
  copyFileSync(resolve(dist, name), resolve(publicDir, name));
  console.log(`copied ${name} -> public/`);
}
