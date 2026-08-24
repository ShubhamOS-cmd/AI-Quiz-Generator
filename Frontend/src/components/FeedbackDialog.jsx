import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function FeedbackDialog({ open, title = 'Notice', message, confirmLabel = 'OK', onConfirm, onClose, destructive = false }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/30 px-4" role="presentation">
            <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-2xl p-6" role="dialog" aria-modal="true" aria-labelledby="feedback-dialog-title">
                <div className="flex items-start justify-between gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${destructive ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                        {destructive ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    </div>
                    <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700" aria-label="Close dialog">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <h2 id="feedback-dialog-title" className="text-lg font-bold text-slate-900 mt-4">{title}</h2>
                <p className="text-sm text-slate-600 mt-1">{message}</p>
                <div className="flex justify-end gap-2 mt-6">
                    {onConfirm && (
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">
                            Cancel
                        </button>
                    )}
                    <button type="button" onClick={onConfirm || onClose} className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
