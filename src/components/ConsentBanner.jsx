import { useEffect, useState } from "react";
import { CONSENT_KEY, PIXEL_ID, initTracking } from "../lib/tracking";

// Analytics stay off until a visitor chooses. Nothing renders when no tracker
// is configured, so the prompt never asks for consent it would not use.
export default function ConsentBanner() {
  const [decided, setDecided] = useState(true);

  useEffect(() => {
    let stored = null;
    try {
      stored = localStorage.getItem(CONSENT_KEY);
    } catch (_) {
      /* Storage blocked — treat as undecided and keep trackers off. */
    }
    if (stored === "granted") initTracking();
    setDecided(Boolean(stored));
  }, []);

  if (decided || !PIXEL_ID) return null;

  const choose = (value) => {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch (_) {
      /* Nothing persists, but the prompt should still close. */
    }
    if (value === "granted") initTracking();
    setDecided(true);
  };

  return (
    <div
      role="dialog"
      aria-label="Analytics consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0f141b]/95 px-4 py-3 backdrop-blur"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-snug text-slate-300">
          We use analytics cookies to measure how the site performs.{" "}
          <a href="/privacy" className="underline hover:text-white">
            Privacy policy
          </a>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="rounded-md border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
