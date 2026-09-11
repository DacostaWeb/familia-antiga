import { describe, expect, it } from 'vitest';
import {
  agruparTarefas,
  fimDoPeriodo,
  grupoDaTarefa,
  hojeISO,
  ordenarNoDia,
  proximaOcorrencia,
  resumoPrazo,
  somarDias,
  somarMeses,
  somarAnos,
} from '../src/lib/dates';
import type { ComPrazo } from '../src/lib/dates';

function t(parcial: Partial<ComPrazo> & { prazo: ComPrazo['prazo'] }): ComPrazo {
  return { concluidaEm: null, criadoEm: '2026-01-01T10:00:00.000Z', ...parcial };
}

// Instantes de referência (UTC). Lisboa: inverno UTC+0, verão UTC+1.
const AGORA = new Date('2026-09-11T14:00:00Z'); // sexta, 11/09/2026 15:00 em Lisboa (verão)
const DIA = '2026-09-11';
const AMANHA = '2026-09-12';
const DOMINGO = '2026-09-13';
const SEGUNDA_SEGUINTE = '2026-09-14';

describe('hojeISO no fuso de Lisboa', () => {
  it('meia-noite UTC é o dia anterior em Lisboa no verão', () => {
    // 2026-09-11T00:00Z = 01:00 de 11/09 em Lisboa
    expect(hojeISO(new Date('2026-09-11T00:30:00Z'))).toBe('2026-09-11');
    // 2026-09-10T22:00Z = 23:00 de 10/09 em Lisboa
    expect(hojeISO(new Date('2026-09-10T22:00:00Z'))).toBe('2026-09-10');
  });

  it('mudança de dia na hora legal de verão (março)', () => {
    // Na noite de 28 para 29/03/2026 os relógios avançam em Lisboa.
    // 2026-03-28T23:30Z = 23:30 de 28/03 (ainda inverno, UTC+0)
    expect(hojeISO(new Date('2026-03-28T23:30:00Z'))).toBe('2026-03-28');
    // 2026-03-29T00:30Z = 01:30 de 29/03 (já verão, UTC+1)
    expect(hojeISO(new Date('2026-03-29T00:30:00Z'))).toBe('2026-03-29');
  });

  it('fim do horário de verão (outubro)', () => {
    // Na noite de 24 para 25/10/2026 os relógios atrasam.
    expect(hojeISO(new Date('2026-10-25T00:30:00Z'))).toBe('2026-10-25'); // 00:30 UTC = 01:30 em Lisboa
  });

  it('mudança de ano, de mês e de dia', () => {
    expect(hojeISO(new Date('2025-12-31T23:59:00Z'))).toBe('2025-12-31');
    expect(hojeISO(new Date('2027-01-01T00:30:00Z'))).toBe('2027-01-01');
    expect(hojeISO(new Date('2026-02-28T23:59:00Z'))).toBe('2026-02-28');
  });
});

describe('grupos', () => {
  it('ordem exata dos grupos', () => {
    const lista = [
      t({ prazo: { tipo: 'sem-data' } }), // Sem data
      t({ prazo: { tipo: 'data', data: '2027-05-01' } }), // Mais tarde
      t({ prazo: { tipo: 'data', data: '2026-12-25' } }), // Este ano
      t({ prazo: { tipo: 'data', data: '2026-09-20' } }), // Este mês
      t({ prazo: { tipo: 'data', data: DOMINGO } }), // Esta semana
      t({ prazo: { tipo: 'data', data: AMANHA } }), // Amanhã
      t({ prazo: { tipo: 'data', data: DIA, hora: '10:00' } }), // Hoje
      t({ prazo: { tipo: 'data', data: '2026-09-10' } }), // Em atraso
    ];
    const grupos = agruparTarefas(lista, AGORA).map((g) => g.grupo);
    expect(grupos).toEqual(['Em atraso', 'Hoje', 'Amanhã', 'Esta semana', 'Este mês', 'Este ano', 'Mais tarde', 'Sem data']);
  });

  it('concluídas vão para Resolvidas, no fim', () => {
    const lista = [t({ prazo: { tipo: 'sem-data' }, concluidaEm: '2026-09-11T10:00:00Z' })];
    const grupos = agruparTarefas(lista, AGORA);
    expect(grupos.map((g) => g.grupo)).toEqual(['Resolvidas']);
  });

  it('período vago: dentro do período não é atraso; passado o fim, é', () => {
    // "esta semana" com âncora hoje: até domingo
    const semana = t({ prazo: { tipo: 'periodo', periodo: 'semana', ancora: DIA } });
    expect(grupoDaTarefa(semana, AGORA)).toBe('Esta semana');
    expect(grupoDaTarefa(semana, new Date('2026-09-13T20:00:00Z'))).toBe('Hoje'); // domingo 21:00 Lisboa: o fim é hoje
    const passou = t({ prazo: { tipo: 'periodo', periodo: 'semana', ancora: '2026-09-07' } }); // semana de 07 a 13/09
    // 14/09/2026 12:00 em Lisboa (verão) = 11:00Z
    expect(grupoDaTarefa(passou, new Date('2026-09-14T11:00:00Z'))).toBe('Em atraso');
  });

  it('período de mês e de ano', () => {
    const mes = t({ prazo: { tipo: 'periodo', periodo: 'mes', ancora: '2026-09-01' } });
    expect(grupoDaTarefa(mes, AGORA)).toBe('Este mês');
    expect(fimDoPeriodo('mes', '2026-02-10')).toBe('2026-02-28');
    expect(fimDoPeriodo('mes', '2028-02-10')).toBe('2028-02-29'); // 2028 é bissexto
    const ano = t({ prazo: { tipo: 'periodo', periodo: 'ano', ancora: '2026-01-01' } });
    expect(grupoDaTarefa(ano, AGORA)).toBe('Este ano');
    expect(fimDoPeriodo('ano', '2026-05-05')).toBe('2026-12-31');
  });

  it('sem duplicações: uma tarefa só num grupo', () => {
    const lista = [t({ prazo: { tipo: 'data', data: DIA } }), t({ prazo: { tipo: 'data', data: DIA } })];
    const grupos = agruparTarefas(lista, AGORA);
    const total = grupos.reduce((n, g) => n + g.tarefas.length, 0);
    expect(total).toBe(2);
    expect(grupos).toHaveLength(1);
  });

  it('dentro do dia: com hora por ordem cronológica, depois sem hora', () => {
    const lista = [
      t({ prazo: { tipo: 'data', data: DIA }, criadoEm: '1' }),
      t({ prazo: { tipo: 'data', data: DIA, hora: '09:00' }, criadoEm: '2' }),
      t({ prazo: { tipo: 'data', data: DIA, hora: '08:00' }, criadoEm: '3' }),
    ];
    const ordem = ordenarNoDia(lista).map((x) => x.criadoEm);
    expect(ordem).toEqual(['3', '2', '1']);
  });
});

describe('ocorrência seguinte', () => {
  it('diária e semanal mantêm a hora', () => {
    const p = { tipo: 'data' as const, data: '2026-09-11', hora: '09:30' };
    expect(proximaOcorrencia(p, 'diaria')).toEqual({ tipo: 'data', data: '2026-09-12', hora: '09:30' });
    expect(proximaOcorrencia(p, 'semanal')).toEqual({ tipo: 'data', data: '2026-09-18', hora: '09:30' });
  });

  it('mensal: 31 de janeiro dá 28 de fevereiro', () => {
    const p = { tipo: 'data' as const, data: '2026-01-31' };
    expect(proximaOcorrencia(p, 'mensal').data).toBe('2026-02-28');
    expect(somarMeses('2026-01-31', 1)).toBe('2026-02-28');
  });

  it('anual: 29 de fevereiro dá 28 de fevereiro em ano não bissexto', () => {
    expect(somarAnos('2028-02-29', 1)).toBe('2029-02-28');
    const p = { tipo: 'data' as const, data: '2028-02-29' };
    expect(proximaOcorrencia(p, 'anual').data).toBe('2029-02-28');
  });

  it('mudança de mês e de ano', () => {
    expect(somarMeses('2026-12-15', 1)).toBe('2027-01-15');
    expect(somarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(somarMeses('2026-10-15', 3)).toBe('2027-01-15');
  });

  it('período repetido passa ao período seguinte', () => {
    const p = { tipo: 'periodo' as const, periodo: 'semana' as const, ancora: DIA };
    const seguinte = proximaOcorrencia(p, 'semanal');
    expect(seguinte.ancora).toBe(SEGUNDA_SEGUINTE);
    const mes = { tipo: 'periodo' as const, periodo: 'mes' as const, ancora: '2026-09-05' };
    expect(proximaOcorrencia(mes, 'mensal').ancora).toBe('2026-10-01');
  });

  it('sem data não inventa data', () => {
    const p = { tipo: 'sem-data' as const };
    expect(proximaOcorrencia(p, 'diaria')).toEqual(p);
  });

  it('período nunca inventa hora', () => {
    const p = { tipo: 'periodo' as const, periodo: 'mes' as const, ancora: DIA };
    const seguinte = proximaOcorrencia(p, 'mensal');
    expect(seguinte.hora).toBeUndefined();
  });
});

describe('resumo legível', () => {
  it('data com e sem hora, e períodos', () => {
    expect(resumoPrazo({ tipo: 'data', data: DIA, hora: '09:30' })).toMatch(/11 Set 09:30/);
    expect(resumoPrazo({ tipo: 'data', data: DIA })).toMatch(/11 Set/);
    expect(resumoPrazo({ tipo: 'periodo', periodo: 'semana', ancora: DIA })).toMatch(/esta semana \(até 13 Set\)/);
    expect(resumoPrazo({ tipo: 'sem-data' })).toBe('');
  });
});
