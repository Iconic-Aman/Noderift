import { useState } from "react";
import { X, Sparkles, Eye, EyeOff, ExternalLink } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface LlmKeyModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const PROVIDERS = [
  {
    id: "openrouter",
    label: "OpenRouter",
    url: "https://openrouter.ai/keys",
    base_url: "https://openrouter.ai/api/v1",
    model: "cohere/north-mini-code:free",
    placeholder: "sk-or-v1-...",
    hint: "Free models available. Get key at openrouter.ai/keys",
  },
  {
    id: "groq",
    label: "Groq",
    url: "https://console.groq.com/keys",
    base_url: "https://api.groq.com/openai/v1",
    model: "llama-3.1-8b-instant",
    placeholder: "gsk_...",
    hint: "Free API. Get key at console.groq.com/keys",
  },
];

export function LlmKeyModal({ onClose, onSuccess }: LlmKeyModalProps) {
  const [provider, setProvider] = useState(PROVIDERS[0]);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(PROVIDERS[0].model);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleProviderChange = (id: string) => {
    const p = PROVIDERS.find((p) => p.id === id)!;
    setProvider(p);
    setModel(p.model);
    setApiKey("");
    setError("");
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError("API key is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await apiFetch("/credentials/", {
        method: "POST",
        body: JSON.stringify({
          name: "llm_key",
          type: "api_key",
          data: {
            provider: provider.id,
            api_key: apiKey.trim(),
            base_url: provider.base_url,
            model: model.trim() || provider.model,
          },
        }),
      });
      onSuccess();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to save key. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Configure LLM API Key</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-white transition-all cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-400 leading-relaxed">
            AI Mode requires an LLM API key. Your key is stored encrypted in your local database — it never leaves your machine.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Provider</label>
            <div className="flex gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-all cursor-pointer ${
                    provider.id === p.id
                      ? "border-violet-500 bg-violet-500/10 text-violet-300"
                      : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">{provider.hint}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">API Key</label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider.placeholder}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 pr-10 text-xs text-white placeholder-slate-600 outline-none focus:border-violet-500 transition-colors"
              />
              <button type="button" onClick={() => setShowKey((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer">
                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <a href={provider.url} target="_blank" rel="noopener noreferrer" className="mt-1.5 flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors">
              Get free API key <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Model <span className="text-slate-600 font-normal">(optional override)</span>
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 rounded-lg border border-slate-800 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer">
              Cancel
            </button>
            <button onClick={handleSave} disabled={loading} className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 py-2 text-xs font-semibold text-white hover:opacity-90 transition-all cursor-pointer disabled:opacity-50">
              {loading ? "Saving..." : "Save & Enable AI Mode"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
