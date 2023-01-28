import esbuild from "esbuild";
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const DUCKDB_DIST = path.dirname(require.resolve("@duckdb/duckdb-wasm"));

function printErr(err) {
  if (err) return console.log(err);
}

fs.copyFile(
  path.resolve(DUCKDB_DIST, "duckdb-mvp.wasm"),
  "./public/duckdb-mvp.wasm",
  printErr
);
fs.copyFile(
  path.resolve(DUCKDB_DIST, "duckdb-eh.wasm"),
  "./public/duckdb-eh.wasm",
  printErr
);
fs.copyFile(
  path.resolve(DUCKDB_DIST, "duckdb-browser-mvp.worker.js"),
  "./public/duckdb-browser-mvp.worker.js",
  printErr
);
fs.copyFile(
  path.resolve(DUCKDB_DIST, "duckdb-browser-eh.worker.js"),
  "./public/duckdb-browser-eh.worker.js",
  printErr
);

await esbuild.build({
  entryPoints: ["src/index.tsx"],
  outdir: "public",
  platform: "browser",
  format: "iife",
  target: "esnext",
  bundle: true,
  minify: false,
  sourcemap: false,
});
