import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/supabase";

export type LookupKind = "department" | "role" | "designation";

export interface Lookup {
  id: string;
  kind: LookupKind;
  value: string;
  sort_order: number;
  active: boolean;
}

const LOOKUPS_KEY = ["hr_lookups"] as const;

async function fetchLookups(): Promise<Lookup[]> {
  const { data, error } = await db
    .from("hr_lookups")
    .select("id, kind, value, sort_order, active")
    .order("kind", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("value", { ascending: true });
  if (error) throw error;
  return (data as Lookup[] | null) ?? [];
}

export function useLookups(kind?: LookupKind, opts?: { includeInactive?: boolean }) {
  const q = useQuery({ queryKey: LOOKUPS_KEY, queryFn: fetchLookups });
  const filtered = (q.data ?? []).filter(l =>
    (kind ? l.kind === kind : true) &&
    (opts?.includeInactive ? true : l.active),
  );
  return { ...q, data: filtered };
}

export function useCreateLookup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { kind: LookupKind; value: string }) => {
      const trimmed = input.value.trim();
      if (!trimmed) throw new Error("Value cannot be blank");
      const { data, error } = await db
        .from("hr_lookups")
        .insert({ kind: input.kind, value: trimmed })
        .select("id, kind, value, sort_order, active")
        .single();
      if (error) throw error;
      return data as Lookup;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LOOKUPS_KEY }),
  });
}

export function useUpdateLookup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; active?: boolean; value?: string }) => {
      const patch: Record<string, unknown> = {};
      if (input.active !== undefined) patch.active = input.active;
      if (input.value !== undefined) patch.value = input.value.trim();
      const { error } = await db.from("hr_lookups").update(patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LOOKUPS_KEY }),
  });
}

export function useDeleteLookup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("hr_lookups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LOOKUPS_KEY }),
  });
}
