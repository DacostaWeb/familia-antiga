import { useState } from 'react';
import * as Y from 'yjs';
import { criarItem, apagarItem, carregarDoc } from '../lib/db';
import { usarItens, mapDe, type ItemLinha } from '../lib/tarefa';
import Editor from '../components/Editor';
import { IconeMais, IconeVoltar } from '../icons';

type NotaViva = { id: string; criadoEm: string; doc: Y.Doc; map: Y.Map<unknown> };

type Props = {
  notaId: string | null;
  abrirNota: (id: string) => void;
  fecharNota: () => void;
};

export default function Privado({ notaId, abrirNota, fecharNota }: Props) {
  const { lista: notas, recarregar } = usarItens<NotaViva>('nota', async (linhas: ItemLinha[]) => {
    const ativas = linhas.filter((l) => !l.apagadoEm);
    const vivas: NotaViva[] = [];
    for (const l of ativas) {
      const doc = await carregarDoc(l.id);
      vivas.push({ id: l.id, criadoEm: l.criadoEm, doc, map: mapDe(doc) });
    }
    return vivas;
  });
  const [aImportar, setAImportar] = useState(false);

  const [importes, setImportes] = useState<Record<string, string>>({});

  if (notaId) {
    const nota = notas.find((n) => n.id === notaId);
    if (nota) {
      return (
        <NotaAberta
          nota={nota}
          markdownInicial={importes[nota.id]}
          fechar={fecharNota}
          apagar={async () => {
            await apagarItem({ id: nota.id, area: 'nota', criadoEm: nota.criadoEm, apagadoEm: null });
            recarregar();
            fecharNota();
          }}
        />
      );
    }
  }

  async function novaNota() {
    const item = await criarItem('nota');
    await carregarDoc(item.id);
    recarregar();
    abrirNota(item.id);
  }

  return (
    <>
      <div className="linha" style={{ margin: '0.75rem 0' }}>
        <button onClick={() => void novaNota()}>
          <IconeMais tamanho={16} /> Nova nota
        </button>
        <label className="caixa" style={{ margin: 0, padding: '0.55rem 0.9rem', fontWeight: 700, minHeight: 48, display: 'inline-block', cursor: 'pointer' }}>
          Importar .md
          <input
            type="file"
            accept=".md,.markdown,.txt"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const ficheiro = e.target.files?.[0];
              if (!ficheiro || aImportar) return;
              setAImportar(true);
              const texto = await ficheiro.text();
              const item = await criarItem('nota');
              const doc = await carregarDoc(item.id);
              doc.transact(() => {
                doc.getMap('estado').set('titulo', ficheiro.name.replace(/\.(md|markdown|txt)$/i, ''));
              });
              setImportes((atual) => ({ ...atual, [item.id]: texto }));
              setAImportar(false);
              recarregar();
              abrirNota(item.id);
            }}
          />
        </label>
      </div>

      {notas.length === 0 && <p className="notafb">Não há notas privadas. As notas nascem aqui e podem virar partilhadas mais tarde.</p>}

      {notas.map((n) => {
        const titulo = (n.map.get('titulo') as string) || '(sem título)';
        return (
          <div key={n.id} className="arquivo-linha">
            <button className="cresce" style={{ border: 'none', textAlign: 'left', minHeight: 48 }} onClick={() => abrirNota(n.id)}>
              <strong>{titulo}</strong>
            </button>
            <button
              onClick={async () => {
                await apagarItem({ id: n.id, area: 'nota', criadoEm: n.criadoEm, apagadoEm: null });
                recarregar();
              }}
              aria-label={`Apagar ${titulo}`}
            >
              Apagar
            </button>
          </div>
        );
      })}
    </>
  );
}

function NotaAberta({ nota, fechar, apagar, markdownInicial }: { nota: NotaViva; fechar: () => void; apagar: () => void; markdownInicial?: string }) {
  return (
    <>
      <div className="linha" style={{ margin: '0.75rem 0' }}>
        <button onClick={fechar}>
          <IconeVoltar tamanho={16} /> Voltar
        </button>
        <button onClick={apagar}>Apagar</button>
        <span className="estado cresce">Só eu · Guardado neste dispositivo</span>
      </div>
      <Editor doc={nota.doc} titulo={(nota.map.get('titulo') as string) || ''} aoMudarTitulo={(t) => nota.map.set('titulo', t)} markdownInicial={markdownInicial} />
    </>
  );
}
