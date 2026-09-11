// Datas e prazos — tudo em português e no fuso de Lisboa.
// Funções puras: recebem o "agora" como argumento para serem testáveis.
import type { Prazo, Periodo, Repeticao } from './types';

export const FUSO = 'Europe/Lisbon';

export type Grupo = 'Em atraso' | 'Hoje' | 'Amanhã' | 'Esta semana' | 'Este mês' | 'Este ano' | 'Mais tarde' | 'Sem data' | 'Resolvidas';

export const ORDEM_GRUPOS: Grupo[] = [
  'Em atraso',
  'Hoje',
  'Amanhã',
  'Esta semana',
  'Este mês',
  'Este ano',
  'Mais tarde',
  'Sem data',
  'Resolvidas',
];

// --- Leitura do instante no fuso de Lisboa ---

const fmtData = new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' });
const fmtHora = new Intl.DateTimeFormat('pt-PT', { timeZone: FUSO, hour: '2-digit', minute: '2-digit', hour12: false });

export function hojeISO(agora: Date): string {
  return fmtData.format(agora);
}

export function horaAgora(agora: Date): string {
  return fmtHora.format(agora);
}

// Peças de uma data 'YYYY-MM-DD' sem cair em fusos horários: trabalha em UTC puro.
function pecas(iso: string): { a: number; m: number; d: number } {
  const [a, m, d] = iso.split('-').map(Number);
  return { a, m, d };
}

function paraUTC(iso: string): Date {
  const { a, m, d } = pecas(iso);
  return new Date(Date.UTC(a, m - 1, d));
}

function deUTC(dt: Date): string {
  return dt.toISOString().slice(0, 10);
}

function diaSemanaUTC(iso: string): number {
  // 0 = domingo … 6 = sábado
  return paraUTC(iso).getUTCDay();
}

export function somarDias(iso: string, dias: number): string {
  const dt = paraUTC(iso);
  dt.setUTCDate(dt.getUTCDate() + dias);
  return deUTC(dt);
}

export function somarMeses(iso: string, meses: number): string {
  const { a, m, d } = pecas(iso);
  const novoMes = m - 1 + meses;
  const novoAno = a + Math.floor(novoMes / 12);
  const mesFinal = ((novoMes % 12) + 12) % 12;
  // Último dia do mês destino, para "31 de janeiro" + 1 mês dar 28/29 de fevereiro.
  const ultimoDia = new Date(Date.UTC(novoAno, mesFinal + 1, 0)).getUTCDate();
  return deUTC(new Date(Date.UTC(novoAno, mesFinal, Math.min(d, ultimoDia))));
}

export function somarAnos(iso: string, anos: number): string {
  const { a, m, d } = pecas(iso);
  const anoFinal = a + anos;
  const ultimoFev = new Date(Date.UTC(anoFinal, 2, 0)).getUTCDate();
  const dFinal = m === 2 && d === 29 && !bissexto(anoFinal) ? ultimoFev : d;
  return deUTC(new Date(Date.UTC(anoFinal, m - 1, dFinal)));
}

function bissexto(a: number): boolean {
  return (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0;
}

function ultimoDiaDoMes(iso: string): string {
  const { a, m } = pecas(iso);
  return deUTC(new Date(Date.UTC(a, m, 0)));
}

// Domingo da semana (segunda a domingo) a que o dia pertence.
function domingoDaSemana(iso: string): string {
  const ds = diaSemanaUTC(iso);
  const ateDomingo = (7 - ds) % 7;
  return somarDias(iso, ateDomingo);
}

// Fim do período vago (inclusive) a que o dia "ancora" pertence.
export function fimDoPeriodo(periodo: Periodo, ancora: string): string {
  if (periodo === 'semana') return domingoDaSemana(ancora);
  if (periodo === 'mes') return ultimoDiaDoMes(ancora);
  return `${pecas(ancora).a}-12-31`;
}

// Início do período a seguir ao que termina em "fim".
export function inicioDoPeriodoSeguinte(fim: string): string {
  return somarDias(fim, 1);
}

// --- Prazos ---

// Data efectiva que representa o prazo, para agrupar. Periodo usa o fim do período.
export function dataDoPrazo(prazo: Prazo): string | null {
  if (prazo.tipo === 'data' && prazo.data) return prazo.data;
  if (prazo.tipo === 'periodo' && prazo.periodo) {
    return fimDoPeriodo(prazo.periodo, prazo.ancora ?? hojeISO(new Date()));
  }
  return null;
}

export type ComPrazo = {
  prazo: Prazo;
  concluidaEm: string | null;
  criadoEm: string;
};

export function grupoDaTarefa(t: ComPrazo, agora: Date): Grupo {
  if (t.concluidaEm) return 'Resolvidas';
  const data = dataDoPrazo(t.prazo);
  if (!data) return 'Sem data';
  const hoje = hojeISO(agora);
  if (data < hoje) return 'Em atraso';
  if (data === hoje) return 'Hoje';
  const amanha = somarDias(hoje, 1);
  if (data === amanha) return 'Amanhã';
  const domingo = domingoDaSemana(hoje);
  if (data <= domingo) return 'Esta semana';
  const { a, m } = pecas(hoje);
  if (data <= ultimoDiaDoMes(`${a}-${String(m).padStart(2, '0')}-01`)) return 'Este mês';
  if (data.startsWith(`${a}`)) return 'Este ano';
  return 'Mais tarde';
}

// Dentro do dia: primeiro as que têm hora, por ordem cronológica; depois as sem hora.
export function ordenarNoDia<T extends ComPrazo>(tarefas: T[]): T[] {
  const seq = (t: T) => t.criadoEm || '';
  return [...tarefas].sort((x, y) => {
    const hx = x.prazo.hora;
    const hy = y.prazo.hora;
    if (hx && hy && hx !== hy) return hx < hy ? -1 : 1;
    if (hx && !hy) return -1;
    if (!hx && hy) return 1;
    return seq(x) < seq(y) ? -1 : seq(x) > seq(y) ? 1 : 0;
  });
}

export function agruparTarefas<T extends ComPrazo>(tarefas: T[], agora: Date): Array<{ grupo: Grupo; tarefas: T[] }> {
  const bolsas = new Map<Grupo, T[]>();
  for (const t of tarefas) {
    const g = grupoDaTarefa(t, agora);
    if (!bolsas.has(g)) bolsas.set(g, []);
    bolsas.get(g)!.push(t);
  }
  const resultado: Array<{ grupo: Grupo; tarefas: T[] }> = [];
  for (const g of ORDEM_GRUPOS) {
    const lista = bolsas.get(g);
    if (!lista || lista.length === 0) continue;
    resultado.push({ grupo: g, tarefas: g === 'Resolvidas' ? lista : ordenarNoDia(lista) });
  }
  return resultado;
}

// A ocorrência seguinte de uma tarefa repetitiva.
export function proximaOcorrencia(prazo: Prazo, repeticao: Repeticao): Prazo {
  if (repeticao === 'nenhuma') return prazo;
  if (prazo.tipo === 'data' && prazo.data) {
    let data: string;
    if (repeticao === 'diaria') data = somarDias(prazo.data, 1);
    else if (repeticao === 'semanal') data = somarDias(prazo.data, 7);
    else if (repeticao === 'mensal') data = somarMeses(prazo.data, 1);
    else data = somarAnos(prazo.data, 1);
    return { ...prazo, data };
  }
  if (prazo.tipo === 'periodo' && prazo.periodo) {
    const fim = fimDoPeriodo(prazo.periodo, prazo.ancora ?? hojeISO(new Date()));
    return { ...prazo, ancora: inicioDoPeriodoSeguinte(fim) };
  }
  return prazo;
}

// --- Resumos legíveis ---

export function dataCurta(iso: string): string {
  const { a, m, d } = pecas(iso);
  const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${d} ${nomes[m - 1]}${a !== pecas(hojeISO(new Date())).a ? ' ' + a : ''}`;
}

export function resumoPrazo(prazo: Prazo): string {
  if (prazo.tipo === 'sem-data') return '';
  if (prazo.tipo === 'data' && prazo.data) {
    const base = dataCurta(prazo.data);
    return prazo.hora ? `${base} ${prazo.hora}` : base;
  }
  if (prazo.tipo === 'periodo' && prazo.periodo) {
    const fim = fimDoPeriodo(prazo.periodo, prazo.ancora ?? hojeISO(new Date()));
    const nome = prazo.periodo === 'semana' ? 'esta semana' : prazo.periodo === 'mes' ? 'este mês' : 'este ano';
    return `${nome} (até ${dataCurta(fim)})`;
  }
  return '';
}
