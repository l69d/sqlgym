// Copy the sql.js WASM binary into /public so the browser can fetch it at
// /sql-wasm.wasm. Runs automatically before every build (npm `prebuild`),
// so deploys never depend on a stale committed copy.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = resolve(root, "node_modules/sql.js/dist/sql-wasm.wasm");
const dest = resolve(root, "public/sql-wasm.wasm");

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log("copied sql-wasm.wasm -> public/");
