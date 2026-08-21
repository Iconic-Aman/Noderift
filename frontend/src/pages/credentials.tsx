import { FormEvent, useEffect, useState } from "react";
import { KeyRound, Loader2, Plus, Trash2, WalletCards } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { AppNavbar } from "@/components/navbar/app-navbar";

type Credential = {
  id: string;
  name: string;
  type: string;
  created_at: string;
};

const defaultSecretJson = '{\n  "_composio_api_key": ""\n}';

export function Credentials() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("custom");
  const [secretJson, setSecretJson] = useState(defaultSecretJson);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/credentials/");
      setCredentials(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load credentials");
    } finally {
      setLoading(false);
    }
  };

  const createCredential = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    let parsedData: Record<string, unknown>;
    try {
      parsedData = JSON.parse(secretJson);
    } catch {
      setError("Credential data must be valid JSON.");
      return;
    }

    if (!name.trim()) {
      setError("Credential name is required.");
      return;
    }

    try {
      setSaving(true);
      const created = await apiFetch("/credentials/", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          type,
          data: parsedData,
        }),
      });
      setCredentials((prev) => [created, ...prev]);
      setName("");
      setType("custom");
      setSecretJson(defaultSecretJson);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save credential");
    } finally {
      setSaving(false);
    }
  };

  const deleteCredential = async (id: string) => {
    try {
      await apiFetch(`/credentials/${id}`, { method: "DELETE" });
      setCredentials((prev) => prev.filter((credential) => credential.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete credential");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <AppNavbar title="Credentials" subtitle="Encrypted Integration Keys" showBack={true} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 md:px-8 pt-28 pb-12">
        <div>
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            <form onSubmit={createCredential} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 h-fit">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-300">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Add Credential</h2>
                </div>
              </div>

              <label className="mb-2 block text-xs font-medium text-slate-400">Name</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Composio production key"
                className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              />

              <label className="mb-2 block text-xs font-medium text-slate-400">Type</label>
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value="custom">Custom</option>
                <option value="api_key">API Key</option>
                <option value="oauth2">OAuth2</option>
                <option value="basic_auth">Basic Auth</option>
              </select>

              <label className="mb-2 block text-xs font-medium text-slate-400">Credential Data JSON</label>
              <textarea
                value={secretJson}
                onChange={(event) => setSecretJson(event.target.value)}
                spellCheck={false}
                className="h-36 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-100 outline-none focus:border-blue-500"
              />

              {error && <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}

              <button
                type="submit"
                disabled={saving}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60 cursor-pointer"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {saving ? "Saving..." : "Save Credential"}
              </button>
            </form>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-white">Saved Credentials</h2>
                  <p className="text-xs text-slate-500">Secret values stay encrypted and are not shown here.</p>
                </div>
                <WalletCards className="h-5 w-5 text-slate-500" />
              </div>

              {loading ? (
                <div className="flex h-40 items-center justify-center text-slate-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading credentials...
                </div>
              ) : credentials.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 text-center text-slate-500">
                  <KeyRound className="mb-2 h-7 w-7 opacity-50" />
                  <p className="text-sm">No credentials yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {credentials.map((credential) => (
                    <div key={credential.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                      <div>
                        <div className="font-medium text-slate-100">{credential.name}</div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <span className="rounded bg-slate-800 px-2 py-0.5">{credential.type}</span>
                          <span>{new Date(credential.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteCredential(credential.id)}
                        className="rounded p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
                        title="Delete credential"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
