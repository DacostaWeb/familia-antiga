// Operações sobre tarefas — a lógica passa por aqui para os ecrãs ficarem finos.
import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { db } from './db';
import { lerCamposTarefa, type CamposTarefa, type Resolvida } from './types';
import { resumoPrazo, proximaOcorrencia as proxima } from './dates';

export type Tarefa = {
  id: string;
  criadoEm: string;
  apagadoEm: string | null;
  doc: Y.Doc;
  map: Y.Map<unknown>;
  campos: CamposTarefa;
};

export type ItemLinha = {
  id: string;
  criadoEm: string;
  apagadoEm: string | null;
};

export function mapDe(doc: Y.Doc): Y.Map<unknown> {
  return doc.getMap('estado');
}

export type ListaItens<T> = { lista: T[]; recarregar: () => void };

// Lista de itens de uma área, com os seus documentos abertos.
export function usarItens<T>(area: string, montar: (linhas: ItemLinha[]) => Promise<T[]>): ListaItens<T> {
  const [lista, setLista] = useState<T[]>([]);
  const [marcador, setMarcador] = useState(0);
  useEffect(() => {
    let vivo = true;
    void (async () => {
      const linhas = await db.itens.where('area').equals(area).toArray();
      const listaNova = await montar(linhas);
      if (vivo) setLista(listaNova);
    })();
    return () => {
      vivo = false;
    };
    // montar é recriado a cada render; a lista depende só da área e do marcador.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area, marcador]);
  return { lista, recarregar: () => setMarcador((m) => m + 1) };
}

export function concluirTarefa(map: Y.Map<unknown>): void {
  const doc = map.doc;
  if (!doc) return;
  doc.transact(() => {
    const campos = lerCamposTarefa(map);
    const resolvidas: Resolvida[] = [...campos.resolvidas, { quando: new Date().toISOString(), prazo: resumoPrazo(campos.prazo) }];
    map.set('resolvidas', resolvidas);
    if (campos.repeticao !== 'nenhuma') {
      // Concluir cria a ocorrência seguinte; a anterior fica no histórico.
      map.set('prazo', proxima(campos.prazo, campos.repeticao));
    } else {
      map.set('concluidaEm', new Date().toISOString());
    }
  });
}

export function reabrirTarefa(map: Y.Map<unknown>): void {
  const doc = map.doc;
  if (!doc) return;
  doc.transact(() => {
    const campos = lerCamposTarefa(map);
    // Desfazer: tira a última entrada das resolvidas e volta a abrir.
    map.set('resolvidas', campos.resolvidas.slice(0, -1));
    map.set('concluidaEm', null);
  });
}

export type EntradaChecklist = { texto: string; feito: boolean };

export type YMapCampos = Y.Map<unknown>;

export function checklistArrayDe(map: Y.Map<unknown>): Y.Array<Y.Map<unknown>> | undefined {
  return map.get('checklist') as Y.Array<Y.Map<unknown>> | undefined;
}

export function entradaChecklist(arr: Y.Array<Y.Map<unknown>>, i: number): Y.Map<unknown> | undefined {
  return arr.get(i);
}

export function checklistDe(map: Y.Map<unknown>): Y.Array<Y.Map<unknown>> {
  let arr = map.get('checklist') as Y.Array<Y.Map<unknown>> | undefined;
  if (!arr) {
    arr = new Y.Array<Y.Map<unknown>>();
    map.set('checklist', arr);
  }
  return arr;
}

export function lerChecklist(arr: Y.Array<Y.Map<unknown>>): EntradaChecklist[] {
  return arr.map((m) => ({ texto: (m.get('texto') as string) ?? '', feito: (m.get('feito') as boolean) ?? false }));
}

export function acrescentarChecklist(arr: Y.Array<Y.Map<unknown>>, texto: string): void {
  const m = new Y.Map<unknown>();
  m.set('texto', texto);
  m.set('feito', false);
  arr.push([m]);
}
