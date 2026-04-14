"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, TrendingUp, Globe, Settings, ChevronDown,
  ChevronRight, Activity, BookOpen, Home, Menu, X,
  Layers, DollarSign, Scale
} from "lucide-react";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  badge?: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    label: "Overview",
    href: "/",
    icon: <Home size={16} />,
  },
  {
    label: "Available Models",
    icon: <Layers size={16} />,
    children: [
      {
        label: "GDP Nowcasting (DFM)",
        href: "/models/nowcasting",
        icon: <TrendingUp size={16} />,
        badge: "Live",
      },
      {
        label: "Quarterly Projection (QPM)",
        href: "/models/qpm",
        icon: <Activity size={16} />,
        badge: "Live",
      },
      {
        label: "Input-Output Analysis",
        icon: <BarChart3 size={16} />,
        badge: "Soon",
      },
      {
        label: "CGE Model (1-2-3)",
        icon: <Globe size={16} />,
        badge: "Soon",
      },
      {
        label: "Fiscal Programming",
        icon: <DollarSign size={16} />,
        badge: "Soon",
      },
      {
        label: "Trade Policy (PE)",
        icon: <Scale size={16} />,
        badge: "Soon",
      },
    ],
  },
  {
    label: "Methodology",
    href: "/methodology",
    icon: <BookOpen size={16} />,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings size={16} />,
  },
];

function NavLink({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const isActive = item.href ? pathname === item.href : false;

  const badgeClass =
    item.badge === "Live"
      ? "badge-live"
      : item.badge === "Soon"
      ? "badge-soon"
      : "badge-available";

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-semibold
                     uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span className="flex items-center gap-2">
            {item.icon}
            {item.label}
          </span>
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        {open && (
          <div className="ml-2 mt-1 space-y-0.5">
            {item.children.map((child) => (
              <NavLink key={child.label} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const content = (
    <span
      className={`sidebar-link ${isActive ? "active" : ""} ${
        !item.href ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <span className="flex items-center gap-2.5 flex-1">
        {item.icon}
        <span>{item.label}</span>
      </span>
      {item.badge && <span className={badgeClass}>{item.badge}</span>}
    </span>
  );

  if (!item.href) return <div>{content}</div>;
  return <Link href={item.href}>{content}</Link>;
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">Policy Lab</div>
            <div className="text-slate-400 text-xs">Uzbekistan</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink key={item.label} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10">
        <div className="text-xs text-slate-500 leading-relaxed">
          Powered by{" "}
          <span className="text-teal-400 font-medium">DFM · Kalman Filter</span>
          <br />
          © 2025 CEER Uzbekistan
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 z-40"
             style={{ background: "#0d1f3c" }}>
        <SidebarContent />
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg text-white shadow-lg"
        style={{ background: "#0d1f3c" }}
      >
        <Menu size={20} />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 h-full flex flex-col" style={{ background: "#0d1f3c" }}>
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
