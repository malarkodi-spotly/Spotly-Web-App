import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, ShieldAlert } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  doubleConfirm?: boolean;
  secondTitle?: string;
  secondMessage?: string;
  secondConfirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  doubleConfirm = false,
  secondTitle,
  secondMessage,
  secondConfirmText,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);

  // Reset step to 1 whenever dialog opens or closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFirstConfirm = () => {
    if (doubleConfirm) {
      setStep(2);
    } else {
      onConfirm();
    }
  };

  const handleSecondConfirm = () => {
    setStep(1);
    onConfirm();
  };

  const handleCancel = () => {
    setStep(1);
    onCancel();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-xs cursor-pointer p-4 select-none"
      onClick={handleCancel}
    >
      <div
        className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full mx-auto shadow-2xl cursor-default transition-all duration-200 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 1 ? (
          <>
            {/* Step 1 Header */}
            <div className="flex items-start gap-3.5 mb-4">
              {variant === "danger" ? (
                <div className="w-11 h-11 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
              ) : variant === "warning" ? (
                <div className="w-11 h-11 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-neutral-900 leading-snug">{title}</h3>
                  {doubleConfirm && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0 font-mono">
                      Step 1/2
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-neutral-600 text-sm leading-relaxed mb-6">{message}</p>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl h-11 border-slate-200 font-bold hover:bg-slate-50 cursor-pointer text-slate-700"
                onClick={handleCancel}
                data-testid="button-cancel-confirm"
              >
                {cancelText}
              </Button>
              <Button
                type="button"
                variant={variant === "danger" ? "destructive" : "default"}
                className={`flex-1 rounded-xl h-11 font-bold cursor-pointer ${
                  variant === "danger"
                    ? "!bg-red-600 hover:!bg-red-700 !text-white shadow-md shadow-red-600/30"
                    : variant === "warning"
                    ? "!bg-amber-600 hover:!bg-amber-700 !text-white shadow-md shadow-amber-600/30"
                    : "!bg-[#241e98] hover:!bg-[#1b1675] !text-white"
                }`}
                onClick={handleFirstConfirm}
                data-testid="button-confirm-action"
              >
                {doubleConfirm ? (
                  <>
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    {confirmText}
                  </>
                ) : (
                  confirmText
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Step 2: Final Double Confirmation */}
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-red-100/90 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3.5 ring-8 ring-red-50 shadow-md shadow-red-500/10">
                <ShieldAlert className="w-8 h-8 text-red-600" />
              </div>
              <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 mb-2 font-mono">
                Final Step 2 of 2
              </span>
              <h3 className="text-xl font-black text-neutral-900 tracking-tight mb-2">
                {secondTitle || "Are you absolutely sure?"}
              </h3>
              <p className="text-neutral-600 text-xs leading-relaxed font-medium">
                {secondMessage ||
                  "This is a permanent action. All associated records, bookings, and data will be permanently deleted and cannot be undone."}
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <Button
                type="button"
                variant="destructive"
                className="w-full h-11 !bg-red-600 hover:!bg-red-700 !text-white font-extrabold rounded-xl shadow-lg shadow-red-600/25 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                onClick={handleSecondConfirm}
                data-testid="button-final-double-confirm"
              >
                <Trash2 className="w-4 h-4" />
                {secondConfirmText || "Yes, Permanently Delete"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 rounded-xl border-slate-200 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                onClick={handleCancel}
                data-testid="button-cancel-second-confirm"
              >
                Cancel / Keep
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
