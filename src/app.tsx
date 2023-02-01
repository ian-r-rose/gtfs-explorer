import React from "react";
import * as duckdb from "@duckdb/duckdb-wasm";
import { initializeDuckDB } from "./duckdb";
import { loadGTFS } from "./load";

export default function App() {
  const [conn, setConn] = React.useState<duckdb.AsyncDuckDBConnection | null>(
    null
  );

  React.useEffect(() => {
    const init = async () => {
      const db = await initializeDuckDB();
      await loadGTFS(db);
      const conn = await db.connect();
      setConn(conn);
    };
    init();
  }, []);
  return <SQLForm conn={conn} />;
}

type SQLFormProps = {
  conn: duckdb.AsyncDuckDBConnection | null;
};

type SQLInputProps = {
  onSubmit: (value: string) => void;
};

type SQLOutputProps = {
  result: string;
};

const SQLInput = (props: SQLInputProps) => {
  const [value, setValue] = React.useState("");

  const onChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(evt.target.value);
  };

  const onKeyDown = (evt: React.KeyboardEvent) => {
    if (evt.shiftKey && evt.key === "Enter") {
      evt.stopPropagation();
      evt.preventDefault();
      props.onSubmit(value);
    }
  };

  return (
    <textarea
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      style={{ height: "480px", width: "640px" }}
    ></textarea>
  );
};

const SQLOutput = (props: SQLOutputProps) => {
  return (
    <pre style={{ height: "480px", width: "640px" }}>
      <code>{props.result}</code>
    </pre>
  );
};

const SQLForm = (props: SQLFormProps) => {
  const [result, setResult] = React.useState("");

  const onSubmit = async (value: string) => {
    if (!props.conn) {
      return;
    }
    const table = await props.conn.query(value);
    setResult(table.toString());
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-around",
      }}
    >
      <SQLInput onSubmit={onSubmit} />
      <SQLOutput result={result} />
    </div>
  );
};
