import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { apiFetch } from "@/lib/api";

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // Just use a test token for dev mode or a real key
        localStorage.setItem("noderift_token", password || "test_token");
        navigate("/");
      } else {
        setError("Use Google Login instead or contact admin.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to authenticate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-200">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/50 p-8 shadow-xl backdrop-blur-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-500/20">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">{isLogin ? "Welcome back" : "Create account"}</h2>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium text-blue-400 hover:text-blue-300"
          >
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
