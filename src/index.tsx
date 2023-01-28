import { createRoot } from "react-dom/client";
import React from "react";

import App from "./app";

import { initializeDuckDB } from "./duckdb";
import { loadGTFS } from "./load";

(async () => {
  const db = await initializeDuckDB();
  await loadGTFS(db);

  const conn = await db.connect();
  const results = await conn.query("SELECT * FROM stop_times LIMIT 10");
  console.log(results);
})();

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(<App />);
