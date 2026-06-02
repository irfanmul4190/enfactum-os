import { useState, useEffect, useRef } from "react";
import { Search, X, FolderKanban, Building2, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: 'activity' | 'partner';
  title: string;
  subtitle: string;
  activityId?: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        // Search activities
        const { data: activities } = await supabase
          .from('activities')
          .select('id, activity_id, name, market, bu')
          .or(`activity_id.ilike.%${query}%,name.ilike.%${query}%`)
          .limit(5);

        // Search partners
        const { data: partners } = await supabase
          .from('partners')
          .select('id, name, market, type')
          .ilike('name', `%${query}%`)
          .limit(5);

        const searchResults: SearchResult[] = [
          ...(activities || []).map(a => ({
            id: a.id,
            type: 'activity' as const,
            title: a.name,
            subtitle: `${a.activity_id} • ${a.bu} • ${a.market}`,
            activityId: a.activity_id,
          })),
          ...(partners || []).map(p => ({
            id: p.id,
            type: 'partner' as const,
            title: p.name,
            subtitle: `${p.type} • ${p.market}`,
          })),
        ];

        setResults(searchResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    if (result.type === 'activity') {
      navigate(`/activities/${result.id}`);
    } else {
      navigate(`/partners/${result.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors w-64"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search activities, partners...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
          <div className="flex items-center border-b px-4">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by Activity ID or Partner Name..."
              className="border-0 focus-visible:ring-0 text-base h-14"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                Searching...
              </div>
            ) : results.length > 0 ? (
              <div className="p-2">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                      index === selectedIndex
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <div className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                      index === selectedIndex ? "bg-primary-foreground/20" : "bg-muted"
                    )}>
                      {result.type === 'activity' ? (
                        <FolderKanban className="h-4 w-4" />
                      ) : (
                        <Building2 className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      <p className={cn(
                        "text-xs truncate",
                        index === selectedIndex ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        {result.subtitle}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : query ? (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No results found for "{query}"
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Type to search activities and partners
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 px-4 py-2.5 border-t bg-muted/30 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded">↵</kbd> Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded">Esc</kbd> Close
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
