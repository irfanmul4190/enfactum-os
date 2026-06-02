import { useQuery } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';

export interface DbEvent {
  id: string;
  module: string | null;
  entity_type: string | null;
  entity_id: string | null;
  event_type: string | null;
  payload: Record<string, any> | null;
  actor_id: string | null;
  occurred_at: string | null;
  created_at: string | null;
}

export function useEntityEvents(entityType: string, entityId: string | undefined) {
  return useQuery({
    queryKey: ['events', entityType, entityId],
    queryFn: async () => {
      if (!entityId) return [];
      const { data, error } = await db
        .from('events')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('occurred_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as DbEvent[];
    },
    enabled: !!entityId,
  });
}

export function useRecentEvents(module: string, limit = 15) {
  return useQuery({
    queryKey: ['events', 'recent', module, limit],
    queryFn: async () => {
      const { data, error } = await db
        .from('events')
        .select('*')
        .eq('module', module)
        .order('occurred_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []) as DbEvent[];
    },
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });
}

export function useAllEvents() {
  return useQuery({
    queryKey: ['events', 'all'],
    queryFn: async () => {
      const { data, error } = await db
        .from('events')
        .select('*')
        .order('occurred_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return (data ?? []) as DbEvent[];
    },
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}
