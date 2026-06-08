import { useRef, useState, useEffect } from "react";
import { ConfigField } from "@/types/workflow";
import { cn } from "@/lib/utils";
import Editor, { OnMount } from "@monaco-editor/react";
import { VariableInput } from "./variable-input";

interface Props {
  field: ConfigField;
  value: any;
  onChange: (value: any) => void;
  parentNodes?: any[];
}

export function ConfigFieldInput({ field, value, onChange, parentNodes = [] }: Props) {
  const baseCls = "w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-600 transition-colors";
  const monacoRef = useRef<any>(null);
  const editorRef = useRef<any>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => e.stopPropagation();

  // Monaco: insert Python input_data[...] at cursor
  const handleMonacoDrop = (e: React.DragEvent) => {
    const varData = e.dataTransfer.getData("application/x-noderift-var");
    if (!varData || !editorRef.current || !monacoRef.current) return;
    const { python } = JSON.parse(varData);
    const editor = editorRef.current;
    const pos = editor.getPosition();
    if (!pos) return;
    editor.executeEdits("drag-var", [{ range: new monacoRef.current.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column), text: python }]);
    editor.focus();
  };

  const handleMonacoMount: OnMount = (editor, monaco) => {
    monacoRef.current = monaco;
    editorRef.current = editor;
  };

  switch (field.type) {
    case "code":
      return (
        <div
          className="h-[200px] w-full overflow-hidden rounded-lg border border-slate-700 nodrag nopan"
          onKeyDown={handleKeyDown}
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={e => { e.stopPropagation(); handleMonacoDrop(e); }}
        >
          <Editor
            height="100%"
            defaultLanguage="python"
            theme="vs-dark"
            value={value || ""}
            onChange={(val) => onChange(val)}
            onMount={handleMonacoMount}
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              scrollBeyondLastLine: false,
              padding: { top: 8, bottom: 8 },
            }}
          />
        </div>
      );
    case "textarea":
      return (
        <VariableInput
          isTextArea={true}
          value={value || ""}
          onChange={onChange}
          placeholder={field.placeholder}
          parentNodes={parentNodes}
        />
      );
    case "select":
      return (
        <select value={value || ""} onChange={e => onChange(e.target.value)} onKeyDown={handleKeyDown} className={baseCls}>
          <option value="">Select...</option>
          {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case "number":
      return (
        <input type="number" value={value ?? field.defaultValue ?? ""} onChange={e => onChange(parseFloat(e.target.value) || 0)}
          onKeyDown={handleKeyDown} className={baseCls} />
      );
    case "toggle":
      return (
        <button onClick={() => onChange(!value)} className={cn("relative h-6 w-11 rounded-full transition-colors", value ? "bg-blue-500" : "bg-slate-700")}>
          <span className={cn("absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform", value && "translate-x-5")} />
        </button>
      );
    case "credential": {
      const [creds, setCreds] = useState<{id: string; name: string}[]>([]);
      useEffect(() => {
        import("@/lib/api").then(({ apiFetch }) =>
          apiFetch("/credentials/").then((data: any[]) => setCreds(data)).catch(() => setCreds([]))
        );
      }, []);
      return (
        <select value={value || ""} onChange={e => onChange(e.target.value)} onKeyDown={handleKeyDown} className={baseCls}>
          <option value="">No credential</option>
          {creds.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      );
    }
    default:
      return (
        <VariableInput
          isTextArea={false}
          value={value || ""}
          onChange={onChange}
          placeholder={field.placeholder}
          parentNodes={parentNodes}
        />
      );
  }
}
