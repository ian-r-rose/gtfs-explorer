import * as duckdb from "@duckdb/duckdb-wasm";

let _db: duckdb.AsyncDuckDB | null = null;

/**
 * Initialize a DuckDB instance and return it.
 */
export async function initializeDuckDB(): Promise<duckdb.AsyncDuckDB> {
  // If already initialized, return the instance.
  if (_db) {
    return _db;
  }
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

  // Cache the initialized instance.
  _db = db;

  return db;
}
