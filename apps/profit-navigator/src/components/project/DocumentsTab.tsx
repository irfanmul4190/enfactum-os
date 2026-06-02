import ProjectDocuments from "@/components/ProjectDocuments";
import type { ProjectDocument } from "@/components/ProjectDocuments";

interface Props {
  projectId: string;
  documents: ProjectDocument[];
  onAdd: (doc: Omit<ProjectDocument, "document_id">) => void;
  onDelete: (id: string) => void;
}

export function DocumentsTab({ projectId, documents, onAdd, onDelete }: Props) {
  return (
    <ProjectDocuments
      projectId={projectId}
      documents={documents}
      onAdd={onAdd}
      onDelete={onDelete}
    />
  );
}
