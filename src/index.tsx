import { createRoot } from "react-dom/client";
import React from "react";

import App from "./app";

import { initializeDuckDB } from "./duckdb";
import { loadGTFS } from "./load";

async () => {
  const db = await initializeDuckDB();
  // await loadGTFS(db);

  const conn = await db.connect();

  const results = await conn.query(`
    WITH most_common_shapes AS (
      SELECT route_id, mode(shape_id) as shape_id
      FROM trips
      GROUP BY route_id
    ),
    shape_by_route AS (
        SELECT
          most_common_shapes.route_id,
          shapes.shape_id,
          shapes.shape_pt_lon,
          shapes.shape_pt_lat
        FROM most_common_shapes
        INNER JOIN shapes ON shapes.shape_id = most_common_shapes.shape_id
        ORDER BY most_common_shapes.route_id, shapes.shape_pt_sequence
    )
    SELECT route_id, list(list_pack(shape_pt_lon, shape_pt_lat)) AS lonlat
    FROM shape_by_route
    GROUP BY route_id
    `);
  console.log(results.toString());
  // window.result = results;
};

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(<App />);
