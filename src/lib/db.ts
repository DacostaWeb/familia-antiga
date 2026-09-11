import Dexie, { type Table } from 'dexie';
import * as Y from 'yjs';
import type { Anexo, Area, Item, PostIt } from './types';

export type LinhaAtualizacao = {
  id?: number; // sequência local
  itemId: string;
  update: Uint8Array;
  criadoEm: string;
  enviada: number; // 0 = só neste dispositivo; 1 = confirmada pelo servidor
};

export type Pref = { chave: string; valor: unknown };

class FamiliaDb extends Dexie {
  itens!: Table<Item, string>;
  atualizacoes!: Table<LinhaAtualizacao, number>;
  anexos!: Table<Anexo, number>;
  postits!: Table<PostIt, number>;
  prefs!: Table<Pref, string>;
  espelho!: Table<{ chave: string; fileId?: string; hash?: string; enviadoEm?: string }, string>;

  constructor() {
    super('familia');
    this.version(1).stores({
      itens: 'id, area, apagadoEm, criadoEm',
      atualizacoes: '++id, itemId, enviada',
      anexos: '++id, itemId, versao',
      postits: '++id, itemId, retiradoEm',
      prefs: 'chave',
      espelho: 'chave',
    });
  }
}

export const db = new FamiliaDb();

export function novoId(): string {
  return crypto.randomUUID();
}

const docs = new Map<string, Y.Doc>();

// Carrega o documento Yjs de um item, aplicando todas as atualizações guardadas.
export async function carregarDoc(itemId: string): Promise<Y.Doc> {
  const existente = docs.get(itemId);
  if (existente) return existente;
  const doc = new Y.Doc();
  const linhas = await db.atualizacoes.where('itemId').equals(itemId).toArray();
  if (linhas.length > 0) {
    Y.applyUpdate(doc, Y.mergeUpdates(linhas.map((l) => l.update)));
  }
  doc.on('update', (update, origem) => {
    if (origem === 'sync') return;
    void guardarUpdate(itemId, update);
  });
  docs.set(itemId, doc);
  return doc;
}

async function guardarUpdate(itemId: string, update: Uint8Array): Promise<void> {
  await db.atualizacoes.add({
    itemId,
    update,
    criadoEm: new Date().toISOString(),
    enviada: 0,
  });
  avisarGravacao();
}

export function esquecerDoc(itemId: string): void {
  const doc = docs.get(itemId);
  if (doc) {
    doc.destroy();
    docs.delete(itemId);
  }
}

export async function criarItem(area: Area): Promise<Item> {
  const item: Item = { id: novoId(), area, criadoEm: new Date().toISOString(), apagadoEm: null };
  await db.itens.add(item);
  return item;
}

// Apagar vai sempre para o caixote: só marca apagadoEm, nunca remove.
export async function apagarItem(item: Item): Promise<void> {
  await db.itens.update(item.id, { apagadoEm: new Date().toISOString() });
  esquecerDoc(item.id);
}

export async function restaurarItem(id: string): Promise<void> {
  await db.itens.update(id, { apagadoEm: null });
}

// Uns eventos simples para o estado de gravação ficar visível.
export type EstadoGravacao = 'gravado' | 'a-sincronizar' | 'sincronizado' | 'erro';
let ouvintes: Array<(e: EstadoGravacao) => void> = [];

export function aoGravar(fn: (e: EstadoGravacao) => void): () => void {
  ouvintes.push(fn);
  return () => {
    ouvintes = ouvintes.filter((o) => o !== fn);
  };
}

function avisarGravacao(): void {
  const estado = import.meta.env.VITE_SUPABASE_URL ? 'a-sincronizar' : 'gravado';
  for (const o of ouvintes) o(estado);
}

export function notificarGravacao(): void {
  avisarGravacao();
}

export async function pref<T>(chave: string, porOmissao: T): Promise<T> {
  const linha = await db.prefs.get(chave);
  return linha ? (linha.valor as T) : porOmissao;
}

export async function porPref(chave: string, valor: unknown): Promise<void> {
  await db.prefs.put({ chave, valor });
}
