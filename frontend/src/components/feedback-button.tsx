import { useState } from "react";
import { MessageSquarePlus, X, Send, Star, Loader2, CheckCircle2 } from "lucide-react";
import { API_URL } from "@/lib/api";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("noderift_token");
  if (!token) return null; // only show when logged in

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/feedback/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message, rating }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to send feedback");
      }
      setSent(true);
      setTimeout(() => {
        setOpen(false);
        setSent(false);
        setMessage("");
        setRating(null);
      }, 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.04] active:scale-[0.97] transition-all duration-200 border border-indigo-500/50 cursor-pointer"
      >
        <MessageSquarePlus className="h-3.5 w-3.5" />
        Feedback
      </button>

      {/* Modal Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:pb-24 sm:pr-6"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          {/* Glass card */}
          <div className="w-full max-w-sm bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md p-6 mx-4 sm:mx-0 animate-in slide-in-from-bottom-4 duration-200">

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-white">Share feedback</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">We read every message</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {sent ? (
              /* Success state */
              <div className="flex flex-col items-center py-6 gap-3">
                <CheckCircle2 className="h-10 w-10 text-green-400" />
                <p className="text-sm font-semibold text-white">Thanks for your feedback!</p>
                <p className="text-xs text-slate-500">We appreciate you helping us improve.</p>
              </div>
            ) : (
              <>
                {/* Star Rating */}
                <div className="mb-4">
                  <p className="text-[11px] text-slate-500 mb-2 uppercase tracking-wider font-semibold">How's your experience?</p>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star === rating ? null : star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="cursor-pointer transition-transform hover:scale-110"
                      >
                        <Star
                          className="h-6 w-6 transition-colors duration-100"
                          style={{
                            fill: star <= (hoverRating ?? rating ?? 0) ? "#fbbf24" : "transparent",
                            color: star <= (hoverRating ?? rating ?? 0) ? "#fbbf24" : "#475569",
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message box */}
                <textarea
                  className="w-full h-28 resize-none rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 text-sm text-slate-200 placeholder-slate-600 p-3 transition-colors"
                  placeholder="What's on your mind? Bug, idea, praise — anything goes..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />

                {error && (
                  <p className="text-xs text-red-400 mt-2">{error}</p>
                )}

                {/* Send button */}
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || loading}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/20 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  {loading ? "Sending..." : "Send Feedback"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
