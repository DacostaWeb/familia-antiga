import { useEffect, useReducer, useState } from 'react';
import * as Y from 'yjs';
import { criarItem, apagarItem, carregarDoc, db } from '../lib/db';
import { usarItens, mapDe, type ItemLinha } from '../lib/tarefa';
import { agruparTarefas, type ComPrazo } from '../lib/dates';
import { lerCamposTarefa } from '../lib/types';
import Cartao from '../components/Cartao';
import { PostItCartao } from '../components/PostIt';
import { IconeMais } from '../icons';

type TarefaViva = { id: string; criadoEm: string; apagadoEm: string | null; map: Y.Map<unknown> };

type Props = {
  abrirArquivos: (pastaId: string | null) => void;
  abrirNotaArquivo: (id: string) => void;
};

function paraComPrazo(t: TarefaViva): { id: string } & ComPrazo & { map: Y.Map<unknown> } {
  const campos = lerCamposTarefa(t.map);
  return { id: t.id, criadoEm: t.criadoEm, prazo: campos.prazo, concluidaEm: campos.concluidaEm, map: t.map };
}

export default function Casa({ abrirArquivos, abrirNotaArquivo }: Props) {
  const { lista: tarefas, recarregar } = usarItens<TarefaViva>('tarefa', async (linhas: ItemLinha[]) => {
    const ativas = linhas.filter((l) => !l.apagadoEm);
    const vivas: TarefaViva[] = [];
    for (const l of ativas) {
      const doc = await carregarDoc(l.id);
      vivas.push({ id: l.id, criadoEm: l.criadoEm, apagadoEm: l.apagadoEm, map: mapDe(doc) });
    }
    return vivas;
  });
  const [postits, setPostits] = useState<Array<{ id: number; itemId: string; resumo: string }>>([]);

  // O agrupamento tem de reagir às mudanças de prazo/título feitas nos cartões:
  // ouvir os documentos e voltar a agrupar.
  const [, forcar] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const limpar = tarefas.map((t) => {
      const doc = t.map.doc;
      if (!doc) return () => {};
      doc.on('update', forcar);
      return () => doc.off('update', forcar);
    });
    return () => limpar.forEach((parar) => parar());
  }, [tarefas, forcar]);

  async function carregarPostits() {
    const ativos = (await db.postits.toArray()).filter((p) => !p.retiradoEm);
    const validos: Array<{ id: number; itemId: string; resumo: string }> = [];
    for (const p of ativos) {
      const item = await db.itens.get(p.itemId);
      if (item && !item.apagadoEm && p.id !== undefined) validos.push({ id: p.id, itemId: p.itemId, resumo: p.resumo });
    }
    setPostits(validos);
  }

  useEffect(() => {
    void carregarPostits();
  }, []);

  const grupos = agruparTarefas(
    tarefas.map(paraComPrazo),
    new Date(),
  );

  async function novaTarefa() {
    await criarItem('tarefa');
    recarregar();
  }

  async function apagar(id: string, criadoEm: string) {
    await apagarItem({ id, area: 'tarefa', criadoEm, apagadoEm: null });
    recarregar();
  }

  async function retirarPostit(id: number) {
    await db.postits.update(id, { retiradoEm: new Date().toISOString() });
    await carregarPostits();
  }

  async function abrirPostit(itemId: string, mostrarPasta: boolean) {
    const item = await db.itens.get(itemId);
    if (!item || item.area !== 'arquivo') return;
    if (mostrarPasta) {
      const doc = await carregarDoc(item.id);
      const pai = (doc.getMap('estado').get('pai') as string | null) ?? null;
      abrirArquivos(pai);
    } else {
      const doc = await carregarDoc(item.id);
      const tipo = doc.getMap('estado').get('tipo');
      if (tipo === 'nota') abrirNotaArquivo(item.id);
      else abrirArquivos(null);
    }
  }

  return (
    <>
      {postits.length > 0 && (
        <section aria-label="Post-its">
          {postits.map((p) => (
            <PostItCartao
              key={p.itemId}
              itemId={p.itemId}
              resumo={p.resumo}
              retirar={retirarPostit}
              abrir={() => void abrirPostit(p.itemId, false)}
              mostrarPasta={() => void abrirPostit(p.itemId, true)}
            />
          ))}
        </section>
      )}

      <div className="linha" style={{ margin: '0.75rem 0' }}>
        <button onClick={novaTarefa}>
          <IconeMais tamanho={16} /> Nova tarefa
        </button>
      </div>

      {grupos.length === 0 && <p className="notafb">Não há tarefas. Criem a primeira com “Nova tarefa”.</p>}

      {grupos.map((g) => (
        <section key={g.grupo} aria-label={g.grupo}>
          <h2 className="grupo-titulo">{g.grupo}</h2>
          {g.tarefas.map((t) => (
            <Cartao key={t.id} id={t.id} criadoEm={t.criadoEm} map={t.map} apagar={(id) => void apagar(id, t.criadoEm)} />
          ))}
        </section>
      ))}
    </>
  );
}
