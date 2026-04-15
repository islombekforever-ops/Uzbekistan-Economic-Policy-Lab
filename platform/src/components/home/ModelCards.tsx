"use client";
import Link from "next/link";
import { TrendingUp, Activity, BarChart3, Globe, DollarSign, Scale, ArrowRight } from "lucide-react";

const models = [
  {
    id: "nowcasting",
    title: "GDP Nowcasting",
    subtitle: "Dynamic Factor Model",
    description:
      "Real-time GDP growth nowcasts using 35 monthly and quarterly indicators via a Mixed-Frequency DFM with Kalman filter and EM algorithm.",
    icon: <TrendingUp size={24} />,
    badge: "Live",
    href: "/models/nowcasting",
    color: "#0d9488",
    tags: ["DFM", "Kalman Filter", "EM Algorithm", "35 Indicators"],
  },
  {
    id: "qpm",
    title: "Quarterly Projection",
    subtitle: "QPM — New Keynesian DSGE",
    description:
      "Structural monetary policy model with IS curve, hybrid Phillips curve, forward-looking Taylor rule, and UIP. Calibrated for Uzbekistan by CEER.",
    icon: <Activity size={24} />,
    badge: "Live",
    href: "/models/qpm",
    color: "#3b82f6",
    tags: ["DSGE", "IRF", "Taylor Rule", "UIP"],
  },
  {
    id: "io",
    title: "Input-Output Model",
    subtitle: "136-Sector Leontief",
    description:
      "Full Leontief I-O model from Uzbekistan StatCom 2022 TZV table. Backward/forward linkage maps, output multipliers, and demand shock simulator across all 136 NACE sectors.",
    icon: <BarChart3 size={24} />,
    badge: "Live",
    href: "/models/io",
    color: "#8b5cf6",
    tags: ["Leontief", "Multipliers", "Sector Analysis", "136 Sectors"],
  },
  {
    id: "cge",
    title: "CGE Model (1-2-3)",
    subtitle: "Computable General Equilibrium",
    description:
      "Economy-wide CGE model for trade, fiscal and exchange-rate policy simulations. Johansen linearised 1-2-3 framework calibrated to Uzbekistan 2022 SAM.",
    icon: <Globe size={24} />,
    badge: "Live",
    href: "/models/cge",
    color: "#f59e0b",
    tags: ["CGE", "Armington", "CET", "SAM"],
  },
  {
    id: "fpp",
    title: "Fiscal Programming",
    subtitle: "CAEM Framework",
    description:
      "Financial programming model linking fiscal, monetary, external, and real sectors for comprehensive macroeconomic consistency.",
    icon: <DollarSign size={24} />,
    badge: "Soon",
    href: null,
    color: "#ec4899",
    tags: ["Fiscal", "Monetary", "IMF Framework"],
  },
  {
    id: "pe",
    title: "Trade Policy (PE)",
    subtitle: "Partial Equilibrium — WITS-SMART",
    description:
      "Tariff and trade liberalisation impact analysis using WITS-SMART partial equilibrium methodology with welfare decomposition.",
    icon: <Scale size={24} />,
    badge: "Soon",
    href: null,
    color: "#06b6d4",
    tags: ["Trade", "Tariffs", "WITS", "PE"],
  },
];

export function ModelCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {models.map((m) => (
        <ModelCard key={m.id} model={m} />
      ))}
    </div>
  );
}

function ModelCard({ model }: { model: (typeof models)[0] }) {
  const isAvailable = model.badge === "Live";

  const CardContent = () => (
    <div
      className={`bg-white rounded-xl p-6 border transition-all duration-200 h-full flex flex-col
                  ${
                    isAvailable
                      ? "border-slate-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                      : "border-slate-100 opacity-80"
                  }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
          style={{ background: model.color }}
        >
          {model.icon}
        </div>
        <span
          className={
            model.badge === "Live"
              ? "badge-live"
              : model.badge === "Soon"
              ? "badge-soon"
              : "badge-available"
          }
        >
          {model.badge}
        </span>
      </div>

      {/* Title */}
      <div className="mb-3">
        <h3 className="font-bold text-slate-900 text-base">{model.title}</h3>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">{model.subtitle}</p>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 leading-relaxed flex-1">{model.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mt-4">
        {model.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-0.5 rounded-md font-medium"
            style={{
              background: model.color + "18",
              color: model.color,
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Link */}
      {isAvailable && (
        <div
          className="mt-4 flex items-center gap-1 text-sm font-semibold"
          style={{ color: model.color }}
        >
          Open Model <ArrowRight size={14} />
        </div>
      )}
    </div>
  );

  if (model.href) {
    return (
      <Link href={model.href} className="flex">
        <CardContent />
      </Link>
    );
  }
  return (
    <div className="flex">
      <CardContent />
    </div>
  );
}
