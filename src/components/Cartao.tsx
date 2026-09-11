import { useEffect, useReducer, useState } from 'react';
import type { YMapCampos } from '../lib/tarefa';
import { lerCamposTarefa, type Prazo, type PrazoTipo, type Periodo, type Repeticao } from '../lib/types';
import { resumoPrazo } from '../lib/dates';
import { concluirTarefa, reabrirTarefa, checklistDe, lerChecklist, acrescentarChecklist, checklistArrayDe, entradaChecklist } from '../lib/tarefa';
import { IconeLixo } from '../icons';

const NOMES_GRUPO: Record<PrazoTipo, string> = { 'sem-data': 'Sem data', data: 'Num dia', periodo: 'Num período' };
const NOMES_PERIODO: Record<Periodo, string> = { semana: 'Esta semana', mes: 'Este mês', ano: 'Este ano' };
const NOMES_REPETICAO: Record<Repeticao, string> = {
  nenhuma: 'Não repete',
  diaria: 'Todos os dias',
  semanal: 'Todas as semanas',
  mensal: 'Todos os meses',
  anual: 'Todos os anos',
};

type Props = {
  id: string;
  criadoEm: string;
  map: YMapCampos;
  apagar: (id: string) => void;
};

// Cartão de tarefa: checkbox grande à esquerda; clicar abre a edição.
export default function Cartao({ id, criadoEm, map, apagar }: Props) {
  const [, forcar] = useReducer((x: number) => x + 1, 0);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const doc = map.doc;
    if (!doc) return;
    doc.on('update', forcar);
    return () => doc.off('update', forcar);
  }, [map, forcar]);

  const campos = lerCamposTarefa(map);
  const concluida = campos.concluidaEm !== null;

  return (
    <article className={concluida ? 'cartao concluida' : 'cartao'}>
      <div className="cartao-topo">
        <input
          type="checkbox"
          checked={concluida}
          onChange={() => (concluida ? reabrirTarefa(map) : concluirTarefa(map))}
          aria-label={concluida ? `Reabrir ${campos.titulo}` : `Concluir ${campos.titulo}`}
        />
        <div className="cresce">
          <button
            onClick={() => setAberto(!aberto)}
            style={{ border: 'none', padding: 0, minHeight: 0, background: 'none', textAlign: 'left', width: '100%' }}
          >
            <span className="cartao-titulo">{campos.titulo || '(sem título)'}</span>
          </button>
          {!concluida && (
            <p className="quando">
              {resumoPrazo(campos.prazo)}
              {campos.repeticao !== 'nenhuma' ? ` · repete ${NOMES_REPETICAO[campos.repeticao].toLowerCase()}` : ''}
            </p>
          )}
          {concluida && <p className="quando">concluída</p>}
        </div>
      </div>

      {aberto && (
        <Formulario
          map={map}
          criadoEm={criadoEm}
          campos={campos}
          aoFechar={() => setAberto(false)}
          aoApagar={() => apagar(id)}
        />
      )}
    </article>
  );
}

function Formulario({
  map,
  criadoEm,
  campos,
  aoFechar,
  aoApagar,
}: {
  map: YMapCampos;
  criadoEm: string;
  campos: ReturnType<typeof lerCamposTarefa>;
  aoFechar: () => void;
  aoApagar: () => void;
}) {
  function porCampo(chave: string, valor: unknown) {
    map.set(chave, valor);
  }

  function porPrazo(novo: Partial<Prazo>) {
    const atual = lerCamposTarefa(map).prazo;
    map.set('prazo', { ...atual, ...novo });
  }

  function mudarTipo(tipo: PrazoTipo) {
    if (tipo === 'sem-data') {
      map.set('prazo', { tipo: 'sem-data' } as Prazo);
    } else if (tipo === 'data') {
      map.set('prazo', { tipo: 'data', data: new Date().toISOString().slice(0, 10) } as Prazo);
    } else {
      map.set('prazo', { tipo: 'periodo', periodo: 'semana', ancora: new Date().toISOString().slice(0, 10) } as Prazo);
    }
  }

  const prazo = campos.prazo;
  const arrChecklist = checklistArrayDe(map);
  const entradas = arrChecklist ? lerChecklist(arrChecklist) : [];

  return (
    <div style={{ borderTop: '2px solid #000000', marginTop: '0.6rem', paddingTop: '0.6rem' }}>
      <p className="rotulo">Título</p>
      <input value={campos.titulo} onChange={(e) => porCampo('titulo', e.target.value)} className="cresce" style={{ width: '100%' }} aria-label="Título" />

      <p className="rotulo">Descrição (opcional)</p>
      <textarea value={campos.descricao} onChange={(e) => porCampo('descricao', e.target.value)} rows={3} style={{ width: '100%' }} aria-label="Descrição" />

      <p className="rotulo">Lista (opcional)</p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {entradas.map((e, i) => (
          <li key={i} className="linha">
            <input
              type="checkbox"
              checked={e.feito}
              onChange={() => {
                const m = entradaChecklist(arrChecklist!, i);
                m?.set('feito', !e.feito);
              }}
              aria-label={`Feito: ${e.texto}`}
            />
            <span className="cresce">{e.texto}</span>
            <button onClick={() => arrChecklist!.delete(i)} aria-label="Tirar da lista">
              <IconeLixo tamanho={16} />
            </button>
          </li>
        ))}
      </ul>
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          const campo = ev.currentTarget.elements.namedItem('novo') as HTMLInputElement;
          if (campo.value.trim()) {
            acrescentarChecklist(checklistDe(map), campo.value.trim());
            campo.value = '';
          }
        }}
        className="linha"
      >
        <input name="novo" placeholder="Acrescentar à lista" className="cresce" />
        <button type="submit">Acrescentar</button>
      </form>

      <p className="rotulo">Responsáveis (opcional, separados por vírgula)</p>
      <input
        value={campos.responsaveis.join(', ')}
        onChange={(e) => porCampo('responsaveis', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
        className="cresce"
        style={{ width: '100%' }}
        aria-label="Responsáveis"
      />

      <p className="rotulo">Prazo</p>
      <div className="linha">
        <select value={prazo.tipo} onChange={(e) => mudarTipo(e.target.value as PrazoTipo)}>
          {Object.entries(NOMES_GRUPO).map(([v, n]) => (
            <option key={v} value={v}>
              {n}
            </option>
          ))}
        </select>
        {prazo.tipo === 'data' && (
          <>
            <input type="date" value={prazo.data ?? ''} onChange={(e) => porPrazo({ data: e.target.value })} />
            <input type="time" value={prazo.hora ?? ''} onChange={(e) => porPrazo({ hora: e.target.value || undefined })} aria-label="Hora (opcional)" />
          </>
        )}
        {prazo.tipo === 'periodo' && (
          <select value={prazo.periodo ?? 'semana'} onChange={(e) => porPrazo({ periodo: e.target.value as Periodo, ancora: new Date().toISOString().slice(0, 10) })}>
            {Object.entries(NOMES_PERIODO).map(([v, n]) => (
              <option key={v} value={v}>
                {n}
              </option>
            ))}
          </select>
        )}
      </div>

      <p className="rotulo">Repetição</p>
      <select value={campos.repeticao} onChange={(e) => porCampo('repeticao', e.target.value as Repeticao)}>
        {Object.entries(NOMES_REPETICAO).map(([v, n]) => (
          <option key={v} value={v}>
            {n}
          </option>
        ))}
      </select>

      <p className="rotulo">Notificações (desligadas por defeito)</p>
      <div className="linha">
        <label className="linha">
          <input type="checkbox" checked={campos.avisarCriacao} onChange={(e) => porCampo('avisarCriacao', e.target.checked)} /> Avisar na criação
        </label>
        <label className="linha">
          <input type="checkbox" checked={campos.lembrarHora} onChange={(e) => porCampo('lembrarHora', e.target.checked)} /> Lembrar à hora marcada
        </label>
      </div>
      <p className="notafb">Sem hora definida não há alarme. No iPhone, as notificações só funcionam com a app adicionada ao ecrã principal.</p>

      <div className="linha" style={{ marginTop: '0.6rem' }}>
        <button onClick={aoFechar}>Fechar</button>
        <button onClick={aoApagar}>
          <IconeLixo tamanho={16} /> Apagar
        </button>
        <span className="quando cresce">criada {criadoEm.slice(0, 10)}</span>
      </div>
    </div>
  );
}
