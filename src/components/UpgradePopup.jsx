import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

const UpgradePopup = ({ open, onClose, planName }) => {
  const navigate = useNavigate();
  const displayPlan = planName ? planName.toString().charAt(0).toUpperCase() + planName.toString().slice(1) : null;

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const handleUpgrade = () => {
    if (onClose) onClose();
    navigate("/subscription");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Upgrade plan required"
        className="mx-4 w-full max-w-md rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-6 text-slate-100 shadow-2xl animate-in zoom-in-95 duration-300"
      >
        <div className="flex items-center justify-center mb-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full border border-indigo-400/40 bg-indigo-500/20 text-2xl animate-bounce"
            style={{ animationIterationCount: 1 }}
          >
            🚫
          </div>
        </div>
        <h2 className="text-center text-2xl font-extrabold tracking-tight">Limit Reached 🚫</h2>
        <p className="mt-3 text-center text-sm text-indigo-100/80">
          You've reached the usage limit for your current plan. Upgrade your STEMS AI plan to continue learning without interruptions.
        </p>
        {displayPlan && (
          <p className="mt-3 text-center text-xs text-indigo-200/70">
            Current plan: <span className="font-semibold text-indigo-100">{displayPlan}</span>
          </p>
        )}
        <p className="mt-1 text-center text-xs text-indigo-200/70">Upgrade to Pro for unlimited access.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={handleUpgrade}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:opacity-90"
          >
            Upgrade Now
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto border-indigo-300/30 bg-transparent text-indigo-100 hover:bg-white/10"
          >
            Maybe Later
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpgradePopup;
