import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Zap } from "lucide-react";
import { API_URL } from "@/lib/api";

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      localStorage.setItem("noderift_token", urlToken);
      navigate("/dashboard");
      return;
    }

    const existingToken = localStorage.getItem("noderift_token");
    if (existingToken && existingToken !== "test_token" && existingToken !== "test") {
      navigate("/dashboard");
    }
  }, [searchParams, navigate]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google/login`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-200">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/50 p-8 shadow-xl backdrop-blur-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-500/20">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Welcome to Noderift</h2>
          <p className="text-sm text-slate-400 text-center">Sign in to access your workflows</p>
        </div>

        <button
          id="google-login-btn"
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-700 bg-slate-800 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-700 cursor-pointer"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <p className="mt-6 text-center text-xs text-slate-500">
          By signing in, you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}
