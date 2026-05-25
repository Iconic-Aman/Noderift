interface JSONNodeProps {
  val: any;
  nodeId: string;
  path: string;
  isLast?: boolean;
  indentLevel?: number;
}

// Converts dotted path "nodeId.a.b.c" -> input_data["nodeId"]["a"]["b"]["c"]
function toPythonAccess(nodeId: string, path: string): string {
  const parts = path.split(".");
  return `input_data` + [nodeId, ...parts].map(p => `["${p}"]`).join("");
}

export const InteractiveJSONNode = ({ val, nodeId, path, isLast = true, indentLevel = 0 }: JSONNodeProps) => {
  const indent = "  ".repeat(indentLevel);

  if (val && typeof val === "object" && !Array.isArray(val)) {
    const keys = Object.keys(val);
    if (keys.length === 0) return <span>{"{}"}{isLast ? "" : ","}</span>;
    return (
      <span className="font-mono text-[10px] leading-relaxed text-slate-300">
        <span>{"{"}</span>
        {keys.map((k, i) => {
          const nextPath = path ? `${path}.${k}` : k;
          const templateVar = `{{${nodeId}.${nextPath}}}`;
          const pythonVar = toPythonAccess(nodeId, nextPath);
          return (
            <div key={k} style={{ paddingLeft: "12px" }}>
              <span
                draggable="true"
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", templateVar);
                  e.dataTransfer.setData("application/x-noderift-var", JSON.stringify({ template: templateVar, python: pythonVar }));
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => navigator.clipboard.writeText(templateVar)}
                className="text-blue-400 font-semibold hover:underline cursor-grab select-none active:scale-95 text-[10px]"
                title={`Drag into fields • Python: ${pythonVar}`}
              >
                "{k}"
              </span>
              <span className="text-slate-500">: </span>
              <InteractiveJSONNode
                val={val[k]}
                nodeId={nodeId}
                path={nextPath}
                isLast={i === keys.length - 1}
                indentLevel={indentLevel + 1}
              />
            </div>
          );
        })}
        <span>{indent}{"}"}{isLast ? "" : ","}</span>
      </span>
    );
  }

  if (Array.isArray(val)) {
    return (
      <span className="font-mono text-[10px] text-slate-500">
        [ {val.length} items ]{isLast ? "" : ","}
      </span>
    );
  }

  let valCls = "text-amber-400";
  if (typeof val === "number") valCls = "text-emerald-400 font-semibold";
  if (typeof val === "boolean") valCls = "text-purple-400 font-bold";
  if (val === null) valCls = "text-slate-500 italic";

  const renderedVal = typeof val === "string" ? `"${val}"` : String(val);

  return (
    <span className="font-mono text-[10px]">
      <span className={valCls}>{renderedVal}</span>
      {!isLast && <span className="text-slate-500">,</span>}
    </span>
  );
};
