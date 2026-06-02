import { db } from '@/integrations/supabase/db';

interface LogEventParams {
  module?: string;
  entity_type: string;
  entity_id: string;
  event_type: string;
  payload: Record<string, any>;
  actor_id?: string;
}

/**
 * Insert an event into the events table.
 * Fires and forgets — errors are logged but don't throw.
 */
export async function logEvent({
  module = 'enflow',
  entity_type,
  entity_id,
  event_type,
  payload,
  actor_id,
}: LogEventParams) {
  try {
    await db.from('events').insert({
      module,
      entity_type,
      entity_id,
      event_type,
      payload,
      actor_id: actor_id ?? null,
      occurred_at: new Date().toISOString(),
    });
  } catch (err) {
    if (import.meta.env.DEV) console.error('[logEvent] Failed to log event:', event_type, err);
  }
}
