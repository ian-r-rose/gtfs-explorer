import JSZip from "jszip";
import { AsyncDuckDB } from "@duckdb/duckdb-wasm";

import gtfsZip from "./gtfsexport.zip";

export async function loadGTFS(db: AsyncDuckDB) {
  const [content, conn] = await Promise.all([
    JSZip.loadAsync(gtfsZip),
    db.connect(),
  ]);

  for (const [name, data] of Object.entries(content.files)) {
    const text = await data.async("text");
    const tname = name.split(".")[0];
    await db.registerFileText(name, text);
    await conn.insertCSVFromPath(name, {
      schema: "main",
      name: tname,
      detect: true,
      header: true,
    });
    const results = await conn.query(`SELECT * FROM ${tname} LIMIT 10`);
    console.log(results);
  }
  conn.close(); // Fire and forget connection closing
}
