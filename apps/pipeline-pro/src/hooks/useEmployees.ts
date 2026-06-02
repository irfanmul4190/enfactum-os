import { useQuery } from '@tanstack/react-query';
import { db, type DbEmployee } from '@/integrations/supabase/db';

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await db
        .from('employees')
        .select('*')
        .order('name');

      if (error) throw error;
      return (data ?? []) as DbEmployee[];
    },
  });
}
