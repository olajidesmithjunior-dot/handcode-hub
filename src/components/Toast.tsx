import React, { useEffect, useState } from "react";
import { 
  CheckCircle, 
  X, 
  Terminal, 
  Sparkles, 
  Code2, 
  FileText, 
  Palette, 
  MessageSquare, 
  Bot 
} from "lucide-react";
import { ModuleType } from "../types";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: ModuleType;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ toast, onClose, duration = 4000 }: ToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast) return;

    setProgress(100);
    const intervalTime = 40;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev - step;
        return next <= 0 ? 0 : next;
      });
    }, intervalTime);

    const closeTimer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearInterval(timer);
      clearTimeout(closeTimer);
    };
  }, [toast, onClose, duration]);

  if (!toast) return null;

  // Render appropriate icons depending on matching item category
  const getIcon = () => {
    switch (toast.type) {
      case "social":
        return <Sparkles className="h-5 w-5 text-purple-400" />;
      case "code":
        return <Code2 className="h-5 w-5 text-cyan-400" />;
      case "copy":
        return <FileText className="h-5 w-5 text-emerald-400" />;
      case "design":
        return <Palette className="h-5 w-5 text-pink-400" />;
      case "manychat":
        return <MessageSquare className="h-5 w-5 text-amber-400" />;
      case "brief":
        return <Bot className="h-5 w-5 text-orange-400" />;
      default:
        return <Terminal className="h-5 w-5 text-cyan-400" />;
    }
  };

  const getModuleBadgeLabel = () => {
    switch (toast.type) {
      case "social": return "Réseaux & Branding";
      case "code": return "Composants & Scripting";
      case "copy": return "Assistant Copy & SEO";
      case "design": return "Moodboard & SVG";
      case "manychat": return "Auto-Tunnels IA";
      case "brief": return "Brief IA & Devis";
      default: return "Bibliothèque";
    }
  };

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[#0a0a0d] border border-orange-500/20 rounded-xl overflow-hidden shadow-[0_4px_30px_rgba(255,107,0,0.15)] backdrop-blur-md animate-fade-in-up"
      style={{
        animation: "slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards"
      }}
    >
      <div className="p-4 flex items-start gap-3.5">
        {/* Module specific icon container with dynamic outline glow */}
        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 shrink-0">
          {getIcon()}
        </div>

        {/* Content messages */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase">
              {getModuleBadgeLabel()}
            </span>
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          </div>
          <h4 className="text-xs font-bold text-white tracking-wide font-sans leading-none">{toast.title}</h4>
          {toast.description && (
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{toast.description}</p>
          )}
        </div>

        {/* Manual dismissed action */}
        <button 
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors cursor-pointer p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Decorative timing countdown progress bar */}
      <div className="h-[2px] w-full bg-white/5">
        <div 
          className="h-full bg-gradient-to-r from-orange-500 to-cyan-500 transition-all duration-75"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Embedded local raw style injector for helper entries */}
      <style>{`
        @keyframes slideInUp {
          from {
            transform: translateY(1.5rem);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
