import { ConfigField } from "@/types/workflow";
import { cn } from "@/lib/utils";
import Editor from "@monaco-editor/react";

interface Props {
  field: ConfigField;
  value: any;
  onChange: (value: any) => void;
}

export function ConfigFieldInput({ field, value, onChange }: Props) {
  const baseCls = "w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-600 transition-colors";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.preventDefault();
    const text = e.dataTransfer.getData("text/plain");
    if (text) {
      const target = e.currentTarget;
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      const val = target.value;
      const nextVal = val.substring(0, start) + text + val.substring(end);
      onChange(nextVal);
      
      // Refocus and place cursor right after inserted variable
      setTimeout(() => {
        target.focus();
        target.setSelectionRange(start + text.length, start + text.length);
      }, 0);
    }
  };

  switch (field.type) {
    case "code":
      return (
        <div 
          className="h-[200px] w-full overflow-hidden rounded-lg border border-slate-700 nodrag nopan"
          onKeyDown={handleKeyDown}
          onDragOver={e => e.stopPropagation()}
          onDrop={e => e.stopPropagation()}
        >
          <Editor
            height="100%"
            defaultLanguage="python"
            theme="vs-dark"
            value={value || field.defaultValue || ""}
            onChange={(val) => onChange(val)}
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
        <textarea 
          value={value || ""} 
          onChange={e => onChange(e.target.value)} 
          onKeyDown={handleKeyDown} 
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          placeholder={field.placeholder} 
          rows={3} 
          className={cn(baseCls, "resize-none")} 
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
        <input 
          type="number" 
          value={value ?? field.defaultValue ?? ""} 
          onChange={e => onChange(parseFloat(e.target.value) || 0)} 
          onKeyDown={handleKeyDown} 
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          placeholder={field.placeholder} 
          className={baseCls} 
        />
      );
    case "toggle":
      return (
        <button onClick={() => onChange(!value)} className={cn("relative h-6 w-11 rounded-full transition-colors", value ? "bg-blue-500" : "bg-slate-700")}>
          <span className={cn("absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform", value && "translate-x-5")} />
        </button>
      );
    default:
      return (
        <input 
          type="text" 
          value={value || ""} 
          onChange={e => onChange(e.target.value)} 
          onKeyDown={handleKeyDown} 
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          placeholder={field.placeholder} 
          className={baseCls} 
        />
      );
  }
}


