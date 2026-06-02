import { useRef } from 'react';
import { useDocuments, useUploadDocument, useDeleteDocument, useDocumentUrl } from '@/hooks/useDocuments';
import { useEmployee } from '@/contexts/EmployeeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, FileText, File, Presentation } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  dealId: string;
  accountId: string;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.ms-powerpoint',
];

function FileIcon({ type }: { type: string | null }) {
  if (type === 'pdf') return <FileText className="h-4 w-4 text-red-400" />;
  if (type === 'pptx' || type === 'ppt') return <Presentation className="h-4 w-4 text-orange-400" />;
  return <File className="h-4 w-4 text-blue-400" />;
}

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsTab({ dealId, accountId }: Props) {
  const { data: documents = [], isLoading } = useDocuments(dealId);
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();
  const getUrl = useDocumentUrl();
  const { employee } = useEmployee();
  const { canWrite } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only PDF, Word, and PowerPoint files are allowed');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File must be under 20MB');
      return;
    }

    uploadDocument.mutate(
      { file, dealId, accountId, uploadedBy: employee?.id },
      {
        onSuccess: () => toast.success(`"${file.name}" uploaded`),
        onError: (err) => toast.error('Upload failed: ' + (err as Error).message),
      }
    );
    e.target.value = '';
  };

  const handleOpen = async (filePath: string, fileName: string) => {
    try {
      const url = await getUrl(filePath);
      if (url) window.open(url, '_blank');
      else toast.error('Could not get file URL');
    } catch {
      toast.error('Could not open file');
    }
  };

  const handleDelete = (id: string, filePath: string) => {
    deleteDocument.mutate(
      { id, filePath, dealId },
      {
        onSuccess: () => toast.success('Document removed'),
        onError: (err) => toast.error('Failed: ' + (err as Error).message),
      }
    );
  };

  if (isLoading) return <div className="text-xs text-muted-foreground p-2">Loading...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Documents ({documents.length})</h3>
        {canWrite && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadDocument.isPending}
            >
              <Upload className="h-3 w-3 mr-1" />
              {uploadDocument.isPending ? 'Uploading...' : 'Upload'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.pptx,.ppt"
              className="hidden"
              onChange={handleUpload}
            />
          </>
        )}
      </div>

      {documents.length === 0 ? (
        <p className="text-xs text-muted-foreground">No documents yet. Upload a PDF, Word, or PowerPoint file.</p>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
              <button
                className="flex items-center gap-2.5 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                onClick={() => handleOpen(doc.file_path, doc.file_name)}
              >
                <FileIcon type={doc.file_type} />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{doc.file_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {doc.file_type?.toUpperCase()} {doc.file_size ? `· ${formatSize(doc.file_size)}` : ''}
                    {' · '}{new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
              </button>
              {canWrite && (
                <button onClick={() => handleDelete(doc.id, doc.file_path)} className="text-muted-foreground hover:text-destructive transition-colors p-1 flex-shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}