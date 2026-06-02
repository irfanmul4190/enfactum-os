export interface CustomTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  createdAt: string;
  defaults: {
    title?: string;
    type: string;
    paymentTerms?: string;
    autoRenew?: boolean;
    scopeSummary?: string;
    deliverables?: { title: string; description: string }[];
  };
}

const STORAGE_KEY = "enforge_custom_templates";

export function getCustomTemplates(): CustomTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomTemplate(template: CustomTemplate) {
  const existing = getCustomTemplates();
  existing.push(template);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function deleteCustomTemplate(id: string) {
  const existing = getCustomTemplates().filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}
