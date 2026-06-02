import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Trash2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface ProjectDocument {
  id: string;
  project_id: string;
  category: "customer_po" | "customer_invoice" | "vendor_invoice" | "timesheet";
  file_name: string;
  file_size: number;
  file_type: string;
  object_url: string;
  uploaded_at: string;
  notes?: string;
}

const CATEGORIES = [
  { key: "customer_po" as const, label: "Customer PO", color: "default" as const },
  { key: "customer_invoice" as const, label: "Customer Invoice", color: "secondary" as const },
  { key: "vendor_invoice" as const, label: "Vendor Invoice", color: "outline" as const },
  { key: "timesheet" as const, label: "Timesheet", color: "secondary" as const },
];

let docIdCounter = 0;

interface Props {
  projectId: string;
  documents: ProjectDocument[];
  onAdd: (doc: ProjectDocument) => void;
  onDelete: (docId: string) => void;
}

export default function ProjectDocuments({ projectId, documents, onAdd, onDelete }: Props) {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<ProjectDocument["category"]>("customer_po");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const filtered = documents.filter(d => d.category === activeCategory);
  const activeCat = CATEGORIES.find(c => c.key === activeCategory)!;

  function processFiles(files: FileList) {
    Array.from(files).forEach(file => {
      const objectUrl = URL.createObjectURL(file);
      docIdCounter++;
      onAdd({
        id: `doc_${docIdCounter}_${Date.now()}`,
        project_id: projectId,
        category: activeCategory,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        object_url: objectUrl,
        uploaded_at: new Date().toISOString().split("T")[0],
      });
    });
    toast({ title: `${files.length} file(s) uploaded to ${activeCat.label}` });
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    processFiles(files);
    e.target.value = "";
  }

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [activeCategory, activeCat.label]);

  function handleDelete(doc: ProjectDocument) {
    URL.revokeObjectURL(doc.object_url);
    onDelete(doc.id);
    toast({ title: "Document removed" });
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div
      className={`glass-card overflow-hidden relative transition-all ${isDragging ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/10 backdrop-blur-sm rounded-lg border-2 border-dashed border-primary">
          <div className="text-center">
            <Upload className="h-10 w-10 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium text-primary">Drop files to upload to {activeCat.label}</p>
          </div>
        </div>
      )}
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--glass-border)" }}>
        <h3 className="text-base font-semibold">Project Documents</h3>
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-1" /> Upload
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.zip"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <div className="px-5 py-3 flex gap-2 flex-wrap border-b" style={{ borderColor: "var(--glass-border)" }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeCategory === cat.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {cat.label}
            <span className="ml-1.5 text-xs opacity-70">
              ({documents.filter(d => d.category === cat.key).length})
            </span>
          </button>
        ))}
      </div>

      <div className="p-5">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No {activeCat.label} documents uploaded yet.</p>
            <p className="text-xs mt-1">Click Upload to add files.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(doc => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(doc.file_size)} · {doc.uploaded_at}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => window.open(doc.object_url, "_blank")}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleDelete(doc)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
