import { createRoot } from "react-dom/client";
import React from "react";

import App from "./app";

import * as duckdb from "@duckdb/duckdb-wasm";
import * as arrow from "apache-arrow";

import gtfsZip from "./gtfsexport.zip";
import JSZip from "jszip";

(async () => {
  const content = await JSZip.loadAsync(gtfsZip);
  for (const [name, data] of Object.entries(content.files)) {
    console.log(name, data);
  }

  try {
    const DUCKDB_CONFIG = await duckdb.selectBundle({
      mvp: {
        mainModule: "./duckdb-mvp.wasm",
        mainWorker: "./duckdb-browser-mvp.worker.js",
      },
      eh: {
        mainModule: "./duckdb-eh.wasm",
        mainWorker: "./duckdb-browser-eh.worker.js",
      },
    });

    const logger = new duckdb.ConsoleLogger();
    const worker = new Worker(DUCKDB_CONFIG.mainWorker!);
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(DUCKDB_CONFIG.mainModule, DUCKDB_CONFIG.pthreadWorker);

    const conn = await db.connect();
    const res = await conn.query<{ v: arrow.Int }>(
      `SELECT count(*)::INTEGER as v FROM generate_series(0, 100) t(v)`
    );
    console.log(res);

    await conn.close();
    await db.terminate();
    worker.terminate();
  } catch (e) {
    console.error(e);
  }
})();

console.log(gtfsZip);

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(<App />);
