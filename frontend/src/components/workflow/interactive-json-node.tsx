interface JSONNodeProps {
  val: any;
  nodeId: string;
  path: string;
  isLast?: boolean;
  indentLevel?: number;
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
          return (
            <div key={k} style={{ paddingLeft: "12px" }}>
              <span
                draggable="true"
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", `{{${nodeId}.${nextPath}}}`);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => {
                  navigator.clipboard.writeText(`{{${nodeId}.${nextPath}}}`);
                }}
                className="text-blue-400 font-semibold hover:underline cursor-grab select-none active:scale-95 text-[10px]"
                title="Drag or click to copy variable"
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
