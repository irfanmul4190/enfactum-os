import { useState } from 'react';
import { useTags, useAddTag, useDeleteTag } from '@/hooks/useTags';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  accountId: string;
}

export function TagsTab({ accountId }: Props) {
  const { data: tags = [], isLoading } = useTags(accountId);
  const addTag = useAddTag();
  const deleteTag = useDeleteTag();
  const { canWrite } = useAuth();
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const tag = input.trim();
    if (!tag) return;
    if (tags.some(t => t.tag.toLowerCase() === tag.toLowerCase())) {
      toast.error('Tag already exists');
      return;
    }
    addTag.mutate(
      { accountId, tag },
      {
        onSuccess: () => { toast.success('Tag added'); setInput(''); },
        onError: (err) => toast.error('Failed: ' + (err as Error).message),
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteTag.mutate(
      { id, accountId },
      {
        onError: (err) => toast.error('Failed: ' + (err as Error).message),
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  if (isLoading) return <div className="text-xs text-muted-foreground p-2">Loading...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Tags ({tags.length})</h3>
      </div>

      {canWrite && (
        <div className="flex gap-2">
          <Input
            placeholder="Add a tag (e.g. Retainer, FMCG, Priority)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8 px-3 flex-shrink-0"
            onClick={handleAdd}
            disabled={addTag.isPending || !input.trim()}
          >
            <Plus className="h-3 w-3 mr-1" />Add
          </Button>
        </div>
      )}

      {tags.length === 0 ? (
        <p className="text-xs text-muted-foreground">No tags yet. Tags help you filter and group this client across all apps.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map(t => (
            <Badge
              key={t.id}
              variant="secondary"
              className="text-xs px-2.5 py-1 flex items-center gap-1.5"
            >
              {t.tag}
              {canWrite && (
                <button
                  onClick={() => handleDelete(t.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}