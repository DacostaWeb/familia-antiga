import { useEffect, useState } from 'react';
import { aoGravar, pref, porPref, type EstadoGravacao } from './lib/db';
import { pesquisarGlobal, type Resultado } from './lib/pesquisa';
import { useNovaVersao } from './lib/versao';
import Casa from './screens/Casa';
import Privado from './screens/Privado';
import Arquivos from './screens/Arquivos';
import Definicoes from './screens/Definicoes';
import { IconeCasa, IconeDefinicoes, IconeNota, IconePasta } from './icons';

export type Ecra = 'casa' | 'privado' | 'arquivos' | 'definicoes';

export type Navegacao = {
  ecra: Ecra;
  pastaId: string | null; // Arquivos: pasta aberta (null = raiz)
  notaId: string | null; // nota aberta (Privado ou Arquivos)
};

const TEXTOS_ESTADO: Record<EstadoGravacao, string> = {
  gravado: 'Guardado neste dispositivo',
  'a-sincronizar': 'A sincronizar',
  sincronizado: 'Sincronizado',
  erro: 'Erro ao sincronizar (guardado neste dispositivo)',
};

export default function App() {
  const [nav, setNav] = useState<Navegacao>({ ecra: 'casa', pastaId: null, notaId: null });
  const [gravacao, setGravacao] = useState<EstadoGravacao>('gravado');
  const [tamanho, setTamanho] = useState(18);
  const [consulta, setConsulta] = useState('');
  const [resultados, setResultados] = useState<Resultado[]>([]);

  // Barra de versão nova: nunca aplica sozinha, só com clique.
  const { haNova: needRefresh, aplicar: updateServiceWorker } = useNovaVersao();

  useEffect(() => aoGravar(setGravacao), []);

  useEffect(() => {
    void pref<number>('tamanho-texto', 18).then(setTamanho);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--tamanho-texto', `${tamanho}px`);
  }, [tamanho]);

  useEffect(() => {
    if (consulta.trim().length < 2) {
      setResultados([]);
      return;
    }
    const tempo = setTimeout(() => {
      void pesquisarGlobal(consulta).then(setResultados);
    }, 200);
    return () => clearTimeout(tempo);
  }, [consulta]);

  async function mudarTamanho(px: number) {
    setTamanho(px);
    await porPref('tamanho-texto', px);
  }

  function ir(ecra: Ecra) {
    setNav({ ecra, pastaId: null, notaId: null });
  }

  function abrirResultado(r: Resultado) {
    if (r.area === 'tarefa') ir('casa');
    else if (r.area === 'nota') setNav({ ecra: 'privado', pastaId: null, notaId: r.itemId });
    else setNav({ ecra: 'arquivos', pastaId: null, notaId: r.tipo === 'nota' ? r.itemId : null });
    setConsulta('');
  }

  return (
    <>
      <header className="cabecalho">
        <h1>Casadacosta</h1>
        <nav aria-label="Secções">
          <button onClick={() => ir('casa')} aria-current={nav.ecra === 'casa' ? 'page' : undefined}>
            <IconeCasa tamanho={18} /> Tarefas da Casa
          </button>
          <button onClick={() => ir('privado')} aria-current={nav.ecra === 'privado' ? 'page' : undefined}>
            <IconeNota tamanho={18} /> Privado
          </button>
          <button onClick={() => ir('arquivos')} aria-current={nav.ecra === 'arquivos' ? 'page' : undefined}>
            <IconePasta tamanho={18} /> Arquivos
          </button>
          <button onClick={() => ir('definicoes')} aria-current={nav.ecra === 'definicoes' ? 'page' : undefined}>
            <IconeDefinicoes tamanho={18} /> Definições
          </button>
        </nav>
        <input
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="Pesquisar em tudo…"
          aria-label="Pesquisa global"
          style={{ width: '100%', marginTop: '0.5rem' }}
        />
        {resultados.length > 0 && (
          <div style={{ border: '2px solid #000000', marginTop: '0.25rem' }}>
            {resultados.map((r) => (
              <button key={`${r.area}-${r.itemId}`} onClick={() => abrirResultado(r)} style={{ display: 'block', width: '100%', border: 'none', textAlign: 'left', fontWeight: 400 }}>
                <strong>{r.titulo}</strong> <span className="notafb">{r.detalhe}</span>
              </button>
            ))}
          </div>
        )}
        <p className="estado">{TEXTOS_ESTADO[gravacao]}</p>
      </header>

      <main>
        {needRefresh && (
          <div className="barra-nova" role="alert">
            <p style={{ margin: '0 0 0.5rem 0' }}>Há uma versão nova. O que estiver aberto fica guardado antes de atualizar.</p>
            <button onClick={updateServiceWorker}>Atualizar</button>
          </div>
        )}

        {nav.ecra === 'casa' && (
          <Casa
            abrirArquivos={(pastaId) => setNav({ ecra: 'arquivos', pastaId, notaId: null })}
            abrirNotaArquivo={(id) => setNav({ ecra: 'arquivos', pastaId: null, notaId: id })}
          />
        )}
        {nav.ecra === 'privado' && (
          <Privado notaId={nav.notaId} abrirNota={(id) => setNav({ ecra: 'privado', pastaId: null, notaId: id })} fecharNota={() => setNav({ ecra: 'privado', pastaId: null, notaId: null })} />
        )}
        {nav.ecra === 'arquivos' && (
          <Arquivos
            pastaId={nav.pastaId}
            notaId={nav.notaId}
            abrirPasta={(id) => setNav({ ecra: 'arquivos', pastaId: id, notaId: null })}
            abrirNota={(id) => setNav({ ecra: 'arquivos', pastaId: null, notaId: id })}
            fecharNota={() => setNav({ ecra: 'arquivos', pastaId: nav.pastaId, notaId: null })}
          />
        )}
        {nav.ecra === 'definicoes' && <Definicoes tamanhoTexto={tamanho} mudarTamanhoTexto={mudarTamanho} />}
      </main>
    </>
  );
}
