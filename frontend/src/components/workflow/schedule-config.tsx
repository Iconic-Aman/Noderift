import { cn } from "@/lib/utils";

interface Props {
  cfg: Record<string, any>;
  onChange: (updates: Record<string, any>) => void;
}

const baseCls = "rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-600 transition-colors";

function parseTimeStr(timeStr: string) {
  const [h, m] = (timeStr || "12:00").split(":");
  const h24 = parseInt(h, 10) || 0;
  const minute = parseInt(m, 10) || 0;
  const ampm = h24 >= 12 ? "PM" : "AM";
  let hour12 = h24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute, ampm };
}

function formatTimeStr(hour12: number, minute: number, ampm: string): string {
  let h24 = hour12 % 12;
  if (ampm === "PM") h24 += 12;
  return `${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function ScheduleConfig({ cfg, onChange }: Props) {
  const frequency = cfg.frequency || (cfg.cron ? "cron" : "interval");
  const intervalValue = cfg.interval_value ?? 1;
  const intervalUnit = cfg.interval_unit || "hours";
  const timeValue = cfg.time || "12:00";
  const daysOfWeek = cfg.days_of_week || [];
  const customCron = cfg.cron || "0 * * * *";
  const timezoneValue = cfg.timezone || "UTC";

  const { hour12, minute, ampm } = parseTimeStr(timeValue);

  const update = (updates: Record<string, any>) => {
    const next = { ...cfg, ...updates };
    const f = next.frequency || (next.cron ? "cron" : "interval");
    const val = next.interval_value ?? 1;
    const unit = next.interval_unit || "hours";
    const timeStr = next.time || "12:00";
    const days = next.days_of_week || [];
    const custom = next.cron || "0 * * * *";

    let cron = "0 * * * *";
    if (f === "interval") {
      if (unit === "minutes") cron = `*/${val} * * * *`;
      else if (unit === "hours") cron = `0 */${val} * * *`;
      else if (unit === "days") cron = `0 0 */${val} * *`;
    } else if (f === "daily") {
      const [h, m] = timeStr.split(":");
      cron = `${parseInt(m, 10) || 0} ${parseInt(h, 10) || 0} * * *`;
    } else if (f === "weekly") {
      const [h, m] = timeStr.split(":");
      const daysStr = days.length > 0 ? days.join(",") : "*";
      cron = `${parseInt(m, 10) || 0} ${parseInt(h, 10) || 0} * * ${daysStr}`;
    } else if (f === "cron") {
      cron = custom;
    }
    onChange({ ...next, cron });
  };

  const handleTimePartChange = (part: "hour" | "minute" | "ampm", val: string) => {
    const nextH = part === "hour" ? parseInt(val, 10) : hour12;
    const nextM = part === "minute" ? parseInt(val, 10) : minute;
    const nextA = part === "ampm" ? val : ampm;
    update({ time: formatTimeStr(nextH, nextM, nextA) });
  };

  // Build range dropdown values based on unit
  const intervalMax = intervalUnit === "minutes" ? 59 : intervalUnit === "hours" ? 23 : 30;
  const intervalOptions = Array.from({ length: intervalMax }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">Trigger Frequency</label>
        <select value={frequency} onChange={e => update({ frequency: e.target.value })} className={cn(baseCls, "w-full")}>
          <option value="interval">Every Interval (Minutes/Hours/Days)</option>
          <option value="daily">Daily at Specific Time</option>
          <option value="weekly">Weekly on Specific Days</option>
          <option value="cron">Custom Cron Expression (Advanced)</option>
        </select>
      </div>

      {frequency === "interval" && (
        <div className="flex gap-2.5">
          <div className="flex-1">
            <label className="mb-1 block text-[11px] font-medium text-slate-400">Every</label>
            <select value={intervalValue} onChange={e => update({ interval_value: parseInt(e.target.value, 10) })} className={cn(baseCls, "w-full")}>
              {intervalOptions.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-[11px] font-medium text-slate-400">Unit</label>
            <select value={intervalUnit} onChange={e => update({ interval_unit: e.target.value, interval_value: 1 })} className={cn(baseCls, "w-full")}>
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </select>
          </div>
        </div>
      )}

      {(frequency === "daily" || frequency === "weekly") && (
        <div>
          <label className="mb-1 block text-[11px] font-medium text-slate-400">Trigger Time</label>
          <div className="flex gap-2">
            <select value={hour12} onChange={e => handleTimePartChange("hour", e.target.value)} className={cn(baseCls, "flex-1")}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <select value={minute} onChange={e => handleTimePartChange("minute", e.target.value)} className={cn(baseCls, "flex-1")}>
              {Array.from({ length: 60 }, (_, i) => i).map(m => (
                <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
              ))}
            </select>
            <select value={ampm} onChange={e => handleTimePartChange("ampm", e.target.value)} className={cn(baseCls, "flex-1")}>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>
      )}

      {frequency === "weekly" && (
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-slate-400">Days of the Week</label>
          <div className="flex flex-wrap gap-1.5">
            {[{ label: "M", value: "mon" }, { label: "T", value: "tue" }, { label: "W", value: "wed" }, { label: "T", value: "thu" }, { label: "F", value: "fri" }, { label: "S", value: "sat" }, { label: "S", value: "sun" }].map(d => {
              const isSelected = daysOfWeek.includes(d.value);
              return (
                <button key={d.value} type="button" onClick={() => { const next = isSelected ? daysOfWeek.filter((day: string) => day !== d.value) : [...daysOfWeek, d.value]; update({ days_of_week: next }); }}
                  className={cn("flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95", isSelected ? "bg-blue-600 border-blue-500 text-white font-bold" : "bg-slate-800 hover:bg-slate-700/60 border-slate-700/80 text-slate-400")}>
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {frequency === "cron" && (
        <div>
          <label className="mb-1 block text-[11px] font-medium text-slate-400">Cron Expression</label>
          <input type="text" value={customCron} onChange={e => update({ cron: e.target.value })} placeholder="e.g. 0 * * * *" className={cn(baseCls, "w-full")} />
        </div>
      )}
    </div>
  );
}
