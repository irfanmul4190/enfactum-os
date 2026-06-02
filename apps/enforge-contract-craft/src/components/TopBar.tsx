import { useAuth } from "@/hooks/useAuth";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogOut, Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchContractsList } from "@/lib/contracts";
import type { ContractView } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

interface TopBarProps {
  title: string;
}

const DEMO_SEARCH: ContractView[] = [
  { id: "1", title: "Master Services Agreement — Acme Corp", type: "MSA", status: "active", value: 500000, currency: "SGD", start_date: "2025-01-01", end_date: "2025-12-31", auto_renew: true, account_name: "Acme Corp", deal_title: "Acme Digital Transformation", owner_name: "Rahul Sharma", created_at: "2025-01-01", renewal_date: null, account_id: null, deal_id: null, owner_id: null, scope_summary: null, deliverables: null, payment_terms: null, client_signer_name: null, client_signer_email: null, enfactum_signer_id: null, internal_notes: null, file_url: null, signed_file_url: null, signed_at: null },
  { id: "2", title: "SOW — Mobile App Development", type: "SOW", status: "draft", value: 120000, currency: "SGD", start_date: "2025-03-01", end_date: "2025-09-30", auto_renew: false, account_name: "TechStart Inc", deal_title: "TechStart Mobile Project", owner_name: "Priya Patel", created_at: "2025-02-15", renewal_date: null, account_id: null, deal_id: null, owner_id: null, scope_summary: null, deliverables: null, payment_terms: null, client_signer_name: null, client_signer_email: null, enfactum_signer_id: null, internal_notes: null, file_url: null, signed_file_url: null, signed_at: null },
];

export function TopBar({ title }: TopBarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const name = user?.user_metadata?.full_name || user?.email || "User";
  const avatar = user?.user_metadata?.avatar_url;
  const initials = name.slice(0, 2).toUpperCase();

  // Cmd+K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  const { data: allContracts = [] } = useQuery<ContractView[]>({
    queryKey: ["contracts-search"],
    queryFn: async () => {
      if (!isSupabaseConfigured) return DEMO_SEARCH;
      return fetchContractsList();
    },
    staleTime: 30000,
  });

  const results = query.trim().length > 0
    ? allContracts.filter(c => {
        const q = query.toLowerCase();
        return c.title.toLowerCase().includes(q) ||
          (c.account_name?.toLowerCase().includes(q)) ||
          c.type.toLowerCase().includes(q);
      }).slice(0, 8)
    : [];

  return (
    <>
      <header className="h-14 flex items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex gap-2 text-muted-foreground h-8 w-56 justify-start"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-3.5 w-3.5" />
            <span className="text-xs">Quick search…</span>
            <kbd className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatar} />
              <AvatarFallback className="bg-secondary text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground hidden sm:inline">{name}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-lg p-0 gap-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="sr-only">Quick Search</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Search contracts by title, account, or type…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          {query.trim().length > 0 && (
            <div className="border-t max-h-64 overflow-auto">
              {results.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">No results found.</p>
              ) : (
                results.map(c => (
                  <button
                    key={c.id}
                    className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center justify-between gap-3 border-b border-border last:border-b-0"
                    onClick={() => {
                      setSearchOpen(false);
                      navigate(`/contracts/${c.id}`);
                    }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.account_name || c.type}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </button>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
