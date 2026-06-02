import { useState } from "react";
import { Sun, Moon, Search, Menu, X, Download } from "lucide-react";
import posthog from "posthog-js";
import { useTheme } from "./ThemeProvider";
import { EnfactumLogo } from "./EnfactumLogo";
import { navSections } from "./navData";

interface SidebarProps {
  activeSection: string;
  onNavigate: (id: string) => void;
  onOpenSearch: () => void;
}

export function BrandSidebar({ activeSection, onNavigate, onOpenSearch }: SidebarProps) {
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (id: string, label: string) => {
    posthog.capture("nav_section_clicked", { section_name: label });
    onNavigate(id);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div>
          <EnfactumLogo size={22} />
          <div className="mt-1 text-[9px] font-semibold tracking-[0.1em] uppercase text-muted">
            Brandbook
          </div>
        </div>
        {/* Mobile close */}
        <button onClick={() => setMobileOpen(false)} className="md:hidden text-muted hover:text-foreground">
          <X size={20} />
        </button>
      </div>

      {/* Search trigger */}
      <div className="px-3 mb-3">
        <button
          onClick={() => { onOpenSearch(); setMobileOpen(false); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-elevated text-[13px] text-muted hover:text-foreground transition-colors duration-150"
          style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
        >
          <Search size={14} />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="text-[10px] font-mono-data border border-border rounded px-1.5 py-0.5 hidden sm:inline">⌘K</kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {navSections.map((section) => {
          const isVault = section.group === "AI Prompt Vault" || section.group === "Governance";
          return (
            <div key={section.group} className={`mb-4 ${isVault ? "relative" : ""}`}>
              {/* Vault glow background */}
              {isVault && (
                <div className="absolute -inset-x-1 -inset-y-1 rounded-xl bg-primary/[0.04] pointer-events-none" />
              )}
              <div className={`px-2 mb-1.5 text-[9px] font-semibold tracking-[0.12em] uppercase relative ${
                isVault ? "text-primary" : "text-muted"
              }`}>
                {section.group}
              </div>
              {section.items.map((item) => {
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id, item.label)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium relative transition-all duration-150 ${
                      active
                        ? "bg-[hsl(220_100%_50%/0.06)] text-primary border-l-2 border-primary"
                        : `${item.accent ? "text-primary" : "text-text-secondary"} hover:bg-[hsl(220_100%_50%/0.04)] hover:text-foreground border-l-2 border-transparent`
                    }`}
                    style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
                  >
                    <item.icon size={16} className={item.accent && !active ? "text-primary" : ""} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 border-t border-border space-y-2">
        <a
          href="/enfactum-brand-guidelines.pdf"
          download
          className="flex items-center gap-2 text-[13px] text-text-secondary hover:text-primary transition-all duration-300 w-full"
          style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
        >
          <Download size={16} />
          <span>Download PDF</span>
        </a>
        <button
          onClick={() => {
            const newTheme = theme === "light" ? "dark" : "light";
            toggle();
            posthog.capture("theme_toggled", { theme: newTheme });
          }}
          className="flex items-center gap-2 text-[13px] text-text-secondary hover:text-foreground transition-all duration-300"
          style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
        </button>
        <div className="text-[10px] font-mono-data text-muted">v1.0 — 2026</div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden bg-surface border border-border rounded-lg p-2 shadow-lg"
      >
        <Menu size={20} className="text-foreground" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop: always visible, mobile: slide in */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-60 bg-surface border-r border-border flex flex-col z-[70] transition-all duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
