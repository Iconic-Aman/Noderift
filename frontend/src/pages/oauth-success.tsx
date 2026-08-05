import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

export function OAuthSuccess() {
  const [searchParams] = useSearchParams();
  const provider = searchParams.get('provider') || 'OAuth';

  useEffect(() => {
    // Auto close popup window if opened in popup mode
    if (window.opener) {
      setTimeout(() => {
        window.close();
      }, 2000);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4 shadow-2xl">
        <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
        <h1 className="text-2xl font-bold capitalize">{provider} Connected!</h1>
        <p className="text-sm text-slate-400">
          Your authorization was successful. You can now close this window or return to Noderift.
        </p>
        <button
          onClick={() => (window.opener ? window.close() : (window.location.href = '/dashboard'))}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition"
        >
          {window.opener ? 'Close Window' : 'Go to Dashboard'}
        </button>
      </div>
    </div>
  );
}
