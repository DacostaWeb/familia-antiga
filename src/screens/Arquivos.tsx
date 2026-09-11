import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { criarItem, apagarItem, restaurarItem, carregarDoc, db } from '../lib/db';
import { usarItens, mapDe, type ItemLinha } from '../lib/tarefa';
import { lerCamposArquivo, type CamposArquivo } from '../lib/types';
import { aoMudarSync } from '../lib/sync';
import Editor from '../components/Editor';
import { IconeMais, IconeVoltar } from '../icons';

type Entrada = {
  id: string;
  criadoEm: string;
  apagadoEm: string | null;
  doc: Y.Doc;
  map: Y.Map<unknown>;
  campos: CamposArquivo;
};

type Props = {
  pastaId: string | null;
  notaId: string | null;
  abrirPasta: (id: string | null) => void;
  abrirNota: (id: string) => void;
  fecharNota: () => void;
};

export default function Arquivos({ pastaId, notaId, abrirPasta, abrirNota, fecharNota }: Props) {
  const { lista: tudo, recarregar } = usarItens<Entrada>('arquivo', async (linhas: ItemLinha[]) => {
    const vivas: Entrada[] = [];
    for (const l of linhas) {
      if (l.apagadoEm) continue;
      const doc = await carregarDoc(l.id);
      const map = mapDe(doc);
      vivas.push({ id: l.id, criadoEm: l.criadoEm, apagadoEm: l.apagadoEm, doc, map, campos: lerCamposArquivo(map) });
    }
    return vivas;
  });
  const [caixote, setCaixote] = useState(false);

  // Novos arquivos partilhados chegam pela sincronização.
  useEffect(() => aoMudarSync((s) => {
    if (s === 'sincronizado') recarregar();
  }), [recarregar]);

  const caminho: Entrada[] = [];
  let cursor = pastaId;
  while (cursor) {
    const p = tudo.find((e) => e.id === cursor);
    if (!p) break;
    caminho.unshift(p);
    cursor = p.campos.pai;
  }

  const aqui = tudo.filter((e) => (e.campos.pai ?? null) === (pastaId ?? null));
  const apagadas = tudo.filter((e) => e.apagadoEm);
  void apagadas; // o caixote global aparece no fim da página

  if (notaId) {
    const nota = tudo.find((e) => e.id === notaId);
    if (nota) {
      return (
        <>
          <div className="linha" style={{ margin: '0.75rem 0' }}>
            <button onClick={fecharNota}>
              <IconeVoltar tamanho={16} /> Voltar
            </button>
          </div>
          <Editor doc={nota.doc} titulo={(nota.map.get('nome') as string) || ''} aoMudarTitulo={(t) => nota.map.set('nome', t)} />
        </>
      );
    }
  }

  const [nomeNovaPasta, setNomeNovaPasta] = useState<string | null>(null);

  async function criarPasta() {
    const nome = nomeNovaPasta?.trim();
    if (!nome) return;
    setNomeNovaPasta(null);
    const item = await criarItem('arquivo');
    const doc = await carregarDoc(item.id);
    doc.transact(() => {
      doc.getMap('estado').set('nome', nome);
      doc.getMap('estado').set('tipo', 'pasta');
      doc.getMap('estado').set('pai', pastaId);
    });
    recarregar();
  }

  async function novaNota() {
    const item = await criarItem('arquivo');
    const doc = await carregarDoc(item.id);
    doc.transact(() => {
      doc.getMap('estado').set('nome', 'Nota sem título');
      doc.getMap('estado').set('tipo', 'nota');
      doc.getMap('estado').set('pai', pastaId);
    });
    recarregar();
    abrirNota(item.id);
  }

  async function anexarFicheiro(ficheiro: File) {
    const item = await criarItem('arquivo');
    const doc = await carregarDoc(item.id);
    doc.transact(() => {
      doc.getMap('estado').set('nome', ficheiro.name);
      doc.getMap('estado').set('tipo', 'ficheiro');
      doc.getMap('estado').set('pai', pastaId);
    });
    await db.anexos.add({
      itemId: item.id,
      nome: ficheiro.name,
      mime: ficheiro.type || 'application/octet-stream',
      blob: ficheiro,
      versao: 1,
      criadoEm: new Date().toISOString(),
    });
    recarregar();
  }

  async function substituirFicheiro(entrada: Entrada, ficheiro: File) {
    const anteriores = await db.anexos.where('itemId').equals(entrada.id).toArray();
    const versao = anteriores.reduce((m, a) => Math.max(m, a.versao), 0) + 1;
    await db.anexos.add({
      itemId: entrada.id,
      nome: ficheiro.name,
      mime: ficheiro.type || 'application/octet-stream',
      blob: ficheiro,
      versao,
      criadoEm: new Date().toISOString(),
    });
    entrada.map.set('nome', ficheiro.name);
    recarregar();
  }

  async function fazerPostit(entrada: Entrada) {
    await db.postits.add({ itemId: entrada.id, resumo: entrada.campos.nome, criadoEm: new Date().toISOString(), retiradoEm: null });
    recarregar();
  }

  return (
    <>
      <p className="linha notafb" aria-label="Caminho">
        <button onClick={() => abrirPasta(null)} style={pastaId ? {} : { background: '#000000', color: '#ffffff' }}>
          Arquivos
        </button>
        {caminho.map((p) => (
          <button key={p.id} onClick={() => abrirPasta(p.id)} style={pastaId === p.id ? { background: '#000000', color: '#ffffff' } : {}}>
            {p.campos.nome}
          </button>
        ))}
      </p>

      <div className="linha" style={{ margin: '0.75rem 0' }}>
        <button onClick={() => setNomeNovaPasta(nomeNovaPasta === null ? '' : null)}>
          <IconeMais tamanho={16} /> Pasta
        </button>
        <button onClick={novaNota}>
          <IconeMais tamanho={16} /> Nota
        </button>
        <label className="caixa" style={{ margin: 0, padding: '0.55rem 0.9rem', fontWeight: 700, minHeight: 48, display: 'inline-block', cursor: 'pointer' }}>
          Anexar ficheiro
          <input
            type="file"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void anexarFicheiro(f);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      {nomeNovaPasta !== null && (
        <form
          className="linha"
          onSubmit={(ev) => {
            ev.preventDefault();
            void criarPasta();
          }}
        >
          <input value={nomeNovaPasta} onChange={(e) => setNomeNovaPasta(e.target.value)} placeholder="Nome da pasta" aria-label="Nome da pasta" className="cresce" autoFocus />
          <button type="submit">Criar pasta</button>
        </form>
      )}

      {(aqui.length === 0 && pastaId === null) && <p className="notafb">Duas pastas chegam já a seguir: “Casa” e “Documentos pessoais”.</p>}
      {aqui.length === 0 && pastaId !== null && <p className="notafb">Esta pasta está vazia.</p>}

      {aqui
        .slice()
        .sort((a, b) => a.campos.nome.localeCompare(b.campos.nome, 'pt'))
        .map((e) => (
          <LinhaArquivo
            key={e.id}
            entrada={e}
            abrirPasta={abrirPasta}
            abrirNota={abrirNota}
            substituir={substituirFicheiro}
            apagar={async (id) => {
              await apagarItem({ id, area: 'arquivo', criadoEm: e.criadoEm, apagadoEm: null });
              recarregar();
            }}
            postit={() => void fazerPostit(e)}
          />
        ))}

      <h2 className="grupo-titulo">Caixote</h2>
      <p className="notafb">
        <label className="linha">
          <input type="checkbox" checked={caixote} onChange={(e) => setCaixote(e.target.checked)} /> Mostrar o que foi apagado
        </label>
      </p>
      {caixote &&
        (apagadas.length === 0 ? (
          <p className="notafb">O caixote está vazio.</p>
        ) : (
          apagadas.map((e) => (
            <div key={e.id} className="arquivo-linha">
              <span className="cresce">{e.campos.nome || '(sem nome)'}</span>
              <button
                onClick={async () => {
                  await restaurarItem(e.id);
                  recarregar();
                }}
              >
                Restaurar
              </button>
            </div>
          ))
        ))}
    </>
  );
}

function LinhaArquivo({
  entrada,
  abrirPasta,
  abrirNota,
  substituir,
  apagar,
  postit,
}: {
  entrada: Entrada;
  abrirPasta: (id: string) => void;
  abrirNota: (id: string) => void;
  substituir: (e: Entrada, f: File) => void;
  apagar: (id: string) => void;
  postit: () => void;
}) {
  const [anexo, setAnexo] = useState<{ nome: string; versao: number; url: string } | null>(null);

  useEffect(() => {
    let url: string | null = null;
    void (async () => {
      if (entrada.campos.tipo !== 'ficheiro') {
        setAnexo(null);
        return;
      }
      const todos = await db.anexos.where('itemId').equals(entrada.id).toArray();
      const ultimo = todos.sort((a, b) => b.versao - a.versao)[0];
      if (ultimo) {
        url = URL.createObjectURL(ultimo.blob);
        setAnexo({ nome: ultimo.nome, versao: ultimo.versao, url });
      }
    })();
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [entrada.id, entrada.campos.tipo]);

  if (entrada.campos.tipo === 'pasta') {
    return (
      <div className="arquivo-linha">
        <button className="cresce" style={{ border: 'none', textAlign: 'left' }} onClick={() => abrirPasta(entrada.id)}>
          <strong>Pasta:</strong> {entrada.campos.nome}
        </button>
        <button onClick={postit}>Post-it</button>
        <button onClick={() => apagar(entrada.id)}>Apagar</button>
      </div>
    );
  }

  if (entrada.campos.tipo === 'nota') {
    return (
      <div className="arquivo-linha">
        <button className="cresce" style={{ border: 'none', textAlign: 'left' }} onClick={() => abrirNota(entrada.id)}>
          <strong>Nota:</strong> {entrada.campos.nome}
        </button>
        <button onClick={postit}>Post-it</button>
        <button onClick={() => apagar(entrada.id)}>Apagar</button>
      </div>
    );
  }

  return (
    <div className="arquivo-linha">
      {anexo ? (
        <a className="cresce" href={anexo.url} download={anexo.nome}>
          {entrada.campos.nome} <span className="mono">v{anexo.versao}</span>
        </a>
      ) : (
        <span className="cresce">{entrada.campos.nome}</span>
      )}
      <label style={{ cursor: 'pointer', fontWeight: 700, minHeight: 48, display: 'inline-block' }}>
        Substituir
        <input
          type="file"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) substituir(entrada, f);
            e.target.value = '';
          }}
        />
      </label>
      <button onClick={postit}>Post-it</button>
      <button onClick={() => apagar(entrada.id)}>Apagar</button>
    </div>
  );
}
