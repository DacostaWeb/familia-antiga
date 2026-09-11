// Cliente Supabase — nulo quando não configurado (a app funciona só local).
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const cliente: SupabaseClient | null =
  url && chave ? createClient(url, chave, { auth: { persistSession: true, autoRefreshToken: true } }) : null;

export function clienteObrigatorio(): SupabaseClient {
  if (!cliente) throw new Error('Supabase não está configurado');
  return cliente;
}
