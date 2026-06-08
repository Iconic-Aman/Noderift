import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

export function VariableInput({
  value,
  onChange,
  placeholder,
  isTextArea = false,
  parentNodes = [],
  rows = 4
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  isTextArea?: boolean;
  parentNodes?: any[];
  rows?: number;
}) {
  const [activeTooltip, setActiveTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [clickedVar, setClickedVar] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  const segments: { type: "text" | "variable"; text: string; full: string }[] = [];
  const regex = /\{\{([^}]+)\}\}/g;
  let lastIndex = 0;
  let match;
  const strVal = String(value || "");

  while ((match = regex.exec(strVal)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        text: strVal.substring(lastIndex, match.index),
        full: strVal.substring(lastIndex, match.index)
      });
    }
    segments.push({
      type: "variable",
      text: match[1],
      full: match[0]
    });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < strVal.length) {
    segments.push({
      type: "text",
      text: strVal.substring(lastIndex),
      full: strVal.substring(lastIndex)
    });
  }

  const getVarValue = (varPath: string) => {
    const parts = varPath.split(".");
    const nodeId = parts[0];
    const node = parentNodes.find(n => n.id === nodeId);
    if (!node) return "Node not found";
    let curr = node.data.output;
    if (!curr) return "No output execution data yet";
    for (let i = 1; i < parts.length; i++) {
      if (curr && typeof curr === "object" && parts[i] in curr) {
        curr = curr[parts[i]];
      } else {
        return "Undefined";
      }
    }
    return typeof curr === "object" ? JSON.stringify(curr) : String(curr);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const varData = e.dataTransfer.getData("application/x-noderift-var");
    const text = varData ? JSON.parse(varData).template : e.dataTransfer.getData("text/plain");
    if (!text) return;
    const target = textareaRef.current;
    if (!target) return;
    const start = target.selectionStart || 0;
    const end = target.selectionEnd || 0;
    const nextVal = target.value.substring(0, start) + text + target.value.substring(end);
    onChange(nextVal);
    setTimeout(() => { target.focus(); target.setSelectionRange(start + text.length, start + text.length); }, 0);
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const overlay = containerRef.current?.querySelector(".overlay-mirror");
    if (overlay) {
      overlay.scrollTop = e.currentTarget.scrollTop;
      overlay.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const baseCls = "w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-600 transition-colors";

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Absolute overlay mirror ON TOP (z-10) with pointer-events-none */}
      <div
        className={cn(
          "overlay-mirror absolute inset-0 w-full overflow-hidden select-none pointer-events-none text-sm font-normal text-slate-200 px-3 py-2 border border-transparent whitespace-pre-wrap break-words z-10",
          isTextArea ? "min-h-[80px]" : "h-9 leading-5"
        )}
        style={{
          fontFamily: 'inherit',
          lineHeight: '1.25rem',
        }}
      >
        {segments.map((seg, idx) => {
          if (seg.type === "text") {
            // Invisible placeholder text to match text sizing exactly
            return <span key={idx} className="opacity-0">{seg.text}</span>;
          } else {
            const varVal = getVarValue(seg.text);
            const isClicked = clickedVar === seg.text;
            return (
              <span
                key={idx}
                className={cn(
                  "inline-block px-1.5 py-0.5 rounded border pointer-events-auto cursor-pointer select-none mx-0.5 text-xs transition-colors font-semibold",
                  isClicked 
                    ? "bg-emerald-600/35 border-emerald-500/50 text-emerald-300" 
                    : "bg-blue-600/35 border-blue-500/50 text-blue-300 hover:bg-blue-500/40"
                )}
                title="Click to toggle value"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const containerRect = containerRef.current?.getBoundingClientRect();
                  if (containerRect) {
                    setActiveTooltip({
                      text: varVal,
                      x: rect.left - containerRect.left + rect.width / 2,
                      y: rect.top - containerRect.top - 8
                    });
                  }
                }}
                onMouseLeave={() => setActiveTooltip(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setClickedVar(isClicked ? null : seg.text);
                }}
              >
                {isClicked ? varVal : seg.full}
              </span>
            );
          }
        })}
        <span className="inline-block w-0 h-0">&nbsp;</span>
      </div>

      {/* Actual input underneath (z-0) */}
      {isTextArea ? (
        <textarea
          ref={textareaRef as any}
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          onScroll={handleScroll as any}
          onKeyDown={handleKeyDown}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          placeholder={placeholder}
          rows={rows}
          className={cn(
            baseCls,
            "resize-y min-h-[80px] text-slate-200 bg-transparent relative z-0 selection:bg-blue-500/30"
          )}
          style={{
            lineHeight: '1.25rem',
          }}
        />
      ) : (
        <input
          ref={textareaRef as any}
          type="text"
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          onScroll={handleScroll as any}
          onKeyDown={handleKeyDown}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          placeholder={placeholder}
          className={cn(
            baseCls,
            "h-9 text-slate-200 bg-transparent relative z-0 selection:bg-blue-500/30"
          )}
          style={{
            lineHeight: '1.25rem',
          }}
        />
      )}

      {/* Floating Tooltip */}
      {activeTooltip && (
        <div
          className="absolute z-50 pointer-events-none px-2 py-1 text-[10px] font-mono bg-slate-950 border border-slate-700 text-slate-300 rounded shadow-2xl max-w-[260px] truncate"
          style={{
            left: `${activeTooltip.x}px`,
            top: `${activeTooltip.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {activeTooltip.text}
        </div>
      )}
    </div>
  );
}
