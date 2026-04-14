"use client";
import { TrendingUp, Activity, BarChart3, Globe, DollarSign, Scale, ArrowRight } from "lucide-react";

const questions = [
  {
    q: "What is GDP growth right now?",
    model: "GDP Nowcasting (DFM)",
    href: "/models/nowcasting",
    icon: <TrendingUp size={16} />,
    color: "#0d9488",
    available: true,
  },
  {
    q: "How will inflation affect growth next year?",
    model: "Quarterly Projection (QPM)",
    href: null,
    icon: <Activity size={16} />,
    color: "#3b82f6",
    available: false,
  },
  {
    q: "Which sectors create the most jobs?",
    model: "Input-Output Model",
    href: null,
    icon: <BarChart3 size={16} />,
    color: "#8b5cf6",
    available: false,
  },
  {
    q: "What happens if we liberalise trade?",
    model: "Trade Policy (PE / CGE)",
    href: null,
    icon: <Globe size={16} />,
    color: "#f59e0b",
    available: false,
  },
  {
    q: "Is the fiscal stance sustainable?",
    model: "Fiscal Programming (CAEM)",
    href: null,
    icon: <DollarSign size={16} />,
    color: "#ec4899",
    available: false,
  },
  {
    q: "How do tariff changes affect welfare?",
    model: "Trade Policy (WITS-SMART)",
    href: null,
    icon: <Scale size={16} />,
    color: "#06b6d4",
    available: false,
  },
];

export function PolicyQuestions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {questions.map((q) => (
        <div
          key={q.q}
          className={`bg-white border rounded-xl p-4 flex items-start gap-3 transition-all
                      ${q.available ? "border-slate-200 hover:shadow-md cursor-pointer" : "border-slate-100 opacity-70"}`}
        >
          <div
            className="mt-0.5 w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white"
            style={{ background: q.color }}
          >
            {q.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 leading-snug">{q.q}</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              {q.model}
              {q.available && <ArrowRight size={10} style={{ color: q.color }} />}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
