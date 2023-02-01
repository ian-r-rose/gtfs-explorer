import JSZip from "jszip";
import { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import * as arrow from "apache-arrow";

import gtfsZip from "./gtfsexport.zip";

const SCHEMAS: {
  [table: string]: { [column: string]: arrow.DataType } | undefined;
} = {
  agency: {
    agency_id: new arrow.Utf8(),
    agency_name: new arrow.Utf8(),
    agency_url: new arrow.Utf8(),
    agency_timezone: new arrow.Utf8(),
    agency_lang: new arrow.Utf8(),
    agency_phone: new arrow.Utf8(),
    agency_fare_url: new arrow.Utf8(),
    agency_email: new arrow.Utf8(),
  },
  stops: {
    stop_id: new arrow.Utf8(),
    stop_code: new arrow.Utf8(),
    stop_name: new arrow.Utf8(),
    stop_desc: new arrow.Utf8(),
    stop_lat: new arrow.Float16(),
    stop_lon: new arrow.Float16(),
    zone_id: new arrow.Utf8(),
    stop_url: new arrow.Utf8(),
    location_type: new arrow.Int8(), // TODO: investigate dictionary type
    parent_station: new arrow.Utf8(),
    stop_timezone: new arrow.Utf8(),
    wheelchair_boarding: new arrow.Int8(), // TODO: investigate dictionary type
    level_id: new arrow.Utf8(),
    platform_code: new arrow.Utf8(),
  },
  routes: {
    route_id: new arrow.Utf8(),
    agency_id: new arrow.Utf8(),
    route_short_name: new arrow.Utf8(),
    route_long_name: new arrow.Utf8(),
    route_desc: new arrow.Utf8(),
    route_type: new arrow.Int8(), // TODO: investigate dictionary type
    route_url: new arrow.Utf8(),
    route_color: new arrow.Utf8(),
    route_text_color: new arrow.Utf8(),
    route_sort_order: new arrow.Int16(),
    continuous_pickup: new arrow.Int8(), // TODO: investigate dictionary type
    continuous_drop_off: new arrow.Int8(), // TODO: investigate dictionary type
  },
  trips: {
    route_id: new arrow.Utf8(),
    service_id: new arrow.Utf8(),
    trip_id: new arrow.Utf8(),
    trip_headsign: new arrow.Utf8(),
    trip_short_name: new arrow.Utf8(),
    direction_id: new arrow.Int8(), // TODO: investigate dictionary type
    block_id: new arrow.Utf8(),
    shape_id: new arrow.Utf8(),
    wheelchair_accessible: new arrow.Int8(), // TODO: investigate dictionary type
    bikes_allowed: new arrow.Int8(), // TODO: investigate dictionary type
  },
  stop_times: {
    trip_id: new arrow.Utf8(),
    arrival_time: new arrow.Utf8(), // Not a Time because it has >24:00 times
    departure_time: new arrow.Utf8(), // Not a Time because it has >24:00 times
    stop_id: new arrow.Utf8(),
    stop_sequence: new arrow.Uint16(),
    stop_headsign: new arrow.Utf8(),
    pickup_type: new arrow.Int8(), // TODO: investigate dictionary type
    drop_off_type: new arrow.Int8(), // TODO: investigate dictionary type
    continuous_pickup: new arrow.Int8(), // TODO: investigate dictionary type
    continuous_drop_off: new arrow.Int8(), // TODO: investigate dictionary type
    shape_dist_traveled: new arrow.Float16(),
    timepoint: new arrow.Int8(), // TODO: investigate dictionary type
  },
  calendar: {
    service_id: new arrow.Utf8(),
    monday: new arrow.Int8(), // TODO: investigate dictionary type
    tuesday: new arrow.Int8(), // TODO: investigate dictionary type
    wednesday: new arrow.Int8(), // TODO: investigate dictionary type
    thursday: new arrow.Int8(), // TODO: investigate dictionary type
    friday: new arrow.Int8(), // TODO: investigate dictionary type
    saturday: new arrow.Int8(), // TODO: investigate dictionary type
    sunday: new arrow.Int8(), // TODO: investigate dictionary type
    start_date: new arrow.DateDay(),
    end_date: new arrow.DateDay(),
  },
  calendar_dates: {
    service_id: new arrow.Utf8(),
    date: new arrow.DateDay(),
    exception_type: new arrow.Int8(), // TODO: investigate dictionary type
  },
  fare_attributes: undefined,
  fare_rules: undefined,
  shapes: {
    shape_id: new arrow.Utf8(),
    shape_pt_lat: new arrow.Float16(),
    shape_pt_lon: new arrow.Float16(),
    shape_pt_sequence: new arrow.Uint16(),
    shape_dist_traveled: new arrow.Float16(),
  },
  frequencies: undefined,
  transfers: undefined,
  pathways: undefined,
  levels: undefined,
  feed_info: undefined,
  translations: undefined,
  attributions: undefined,
};

export async function loadGTFS(db: AsyncDuckDB) {
  const [content, conn] = await Promise.all([
    JSZip.loadAsync(gtfsZip),
    db.connect(),
  ]);
  console.log("Unzipped");

  for (const [name, data] of Object.entries(content.files)) {
    const text = await data.async("text");
    const tname = name.split(".")[0];
    const schema = SCHEMAS[tname];
    await db.registerFileText(name, text);
    if (schema !== undefined) {
      const columns = text.split("\n", 1)[0].trim().split(",");
      const subset: { [col: string]: arrow.DataType } = {};
      for (const c of columns) {
        if (!(c in schema)) {
          console.warn(`Unexpected column ${c} in ${tname}`);
          subset[c] = new arrow.Utf8();
        } else {
          subset[c] = schema[c];
        }
      }

      await conn.insertCSVFromPath(name, {
        schema: "main",
        name: tname,
        detect: false,
        columns: subset,
        header: true,
        dateFormat: "%Y%m%d",
      });
    } else {
      await conn.insertCSVFromPath(name, {
        schema: "main",
        name: tname,
        detect: true,
        header: true,
        dateFormat: "%Y%m%d",
      });
    }
    console.log(`Loaded ${tname}`);
  }
  conn.close(); // Fire and forget connection closing
}
