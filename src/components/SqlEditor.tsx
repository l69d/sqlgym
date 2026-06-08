"use client";

import dynamic from "next/dynamic";
import { sql, SQLite } from "@codemirror/lang-sql";
import { EditorView } from "@codemirror/view";

// Load CodeMirror only in the browser — it touches the DOM on mount.
const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse bg-[var(--panel-2)]" />
  ),
});

const fontTheme = EditorView.theme({
  "&": { backgroundColor: "transparent", height: "100%" },
  ".cm-gutters": { backgroundColor: "transparent", border: "none" },
  ".cm-content": { caretColor: "#34d399" },
});

export function SqlEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      theme="dark"
      height="100%"
      extensions={[sql({ dialect: SQLite, upperCaseKeywords: true }), fontTheme]}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: true,
        tabSize: 2,
      }}
      style={{ height: "100%", fontSize: 13.5 }}
    />
  );
}
