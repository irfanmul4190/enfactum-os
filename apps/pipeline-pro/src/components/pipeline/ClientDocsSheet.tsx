import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { FileText, Link2, ExternalLink, FolderOpen, Users, FolderTree } from 'lucide-react';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import { useDocsByClientName, useOpenDocument, type DocSearchRow } from '@/hooks/useClientDocs';

function typeLabel(t: string | null): string {
  if (!t) return 'file';
  const map: Record<string, string> = {
    gslides: 'Google Slides', gdoc: 'Google Docs', gsheets: 'Google Sheets',
    gdrive: 'Google Drive', sharepoint: 'SharePoint', link: 'Link',
    pdf: 'PDF', pptx: 'PowerPoint', ppt: 'PowerPoint', docx: 'Word', doc: 'Word',
    xlsx: 'Excel', xls: 'Excel',
  };
  return map[t] ?? t.toUpperCase();
}

// Documents for one client, grouped by manager → project.
interface ProjectGroup { projectId: string; projectName: string; managerName: string; docs: DocSearchRow[]; }

export function ClientDocsSheet({
  clientName, open, onClose,
}: {
  clientName: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data = [], isLoading } = useDocsByClientName(open ? clientName : null);
  const openDocUrl = useOpenDocument();

  const groups = useMemo<ProjectGroup[]>(() => {
    const map = new Map<string, ProjectGroup>();
    for (const d of data) {
      const key = d.project_id ?? 'none';
      if (!map.has(key)) {
        map.set(key, {
          projectId: key,
          projectName: d.project_name ?? 'Untitled project',
          managerName: d.manager_name ?? '',
          docs: [],
        });
      }
      map.get(key)!.docs.push(d);
    }
    return Array.from(map.values()).sort((a, b) => a.projectName.localeCompare(b.projectName));
  }, [data]);

  const openDoc = async (d: DocSearchRow) => {
    const url = await openDocUrl({ source: d.source ?? 'upload', file_path: d.file_path, link_url: d.link_url });
    if (url) window.open(url, '_blank', 'noopener');
    else toast.error('Could not open document');
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-brand-blue" /> {clientName ?? 'Client'} — Documents
          </SheetTitle>
          <SheetDescription>
            Files &amp; links filed under this client in the document library.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {clientName && (
            <Button asChild variant="outline" size="sm" className="h-8 text-xs w-full">
              <Link to={`/documents?q=${encodeURIComponent(clientName)}`} onClick={onClose}>
                <FolderTree className="h-3 w-3 mr-1" /> Open in document library
              </Link>
            </Button>
          )}

          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : groups.length === 0 ? (
            <div className="rounded-md border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
              No documents filed for “{clientName}” yet.
              <br />
              Add them in the document library, then they appear here.
            </div>
          ) : (
            groups.map((g) => (
              <div key={g.projectId} className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" /> {g.projectName}
                  {g.managerName && (
                    <span className="text-[10px] text-muted-foreground font-normal flex items-center gap-0.5">
                      <Users className="h-3 w-3" /> {g.managerName}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {g.docs.map((d) => (
                    <button
                      key={d.id ?? ''}
                      onClick={() => openDoc(d)}
                      className="w-full flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-left hover:bg-muted/50 transition-colors group"
                    >
                      {d.source === 'link'
                        ? <Link2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        : <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                      <span className="text-sm truncate flex-1">{d.title}</span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0">{typeLabel(d.file_type)}</Badge>
                      <span className="text-[10px] text-muted-foreground hidden sm:inline">{formatDate(d.created_at ?? undefined)}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
