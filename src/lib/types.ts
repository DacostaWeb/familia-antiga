import * as Y from 'yjs';

export type Area = 'tarefa' | 'nota' | 'arquivo';

export type PrazoTipo = 'sem-data' | 'data' | 'periodo';
export type Periodo = 'semana' | 'mes' | 'ano';
export type Repeticao = 'nenhuma' | 'diaria' | 'semanal' | 'mensal' | 'anual';

export type Prazo = {
  tipo: PrazoTipo;
  data?: string; // YYYY-MM-DD
  hora?: string; // HH:MM
  periodo?: Periodo;
  ancora?: string; // YYYY-MM-DD — dia em que o período vago foi escolhido
};

export type Resolvida = {
  quando: string; // ISO — quando foi concluída
  prazo: string; // resumo legível do prazo que tinha
};

// Campos guardados no Y.Map "estado" de cada item.
export type CamposTarefa = {
  titulo: string;
  descricao: string;
  responsaveis: string[];
  prazo: Prazo;
  repeticao: Repeticao;
  avisarCriacao: boolean;
  lembrarHora: boolean;
  concluidaEm: string | null;
  resolvidas: Resolvida[];
};

export type TipoArquivo = 'pasta' | 'ficheiro' | 'nota';

export type CamposArquivo = {
  nome: string;
  tipo: TipoArquivo;
  pai: string | null; // id da pasta mãe, null = raiz
};

export type PostIt = {
  id?: number;
  itemId: string;
  resumo: string;
  criadoEm: string;
  retiradoEm: string | null;
};

export type Anexo = {
  id?: number;
  itemId: string;
  nome: string;
  mime: string;
  blob: Blob;
  versao: number;
  criadoEm: string;
};

export type Item = {
  id: string;
  area: Area;
  criadoEm: string;
  apagadoEm: string | null;
  remoto?: boolean; // chegou pela sincronização; o dono pode não ser este utilizador
};

export function camposTarefaIniciais(): CamposTarefa {
  return {
    titulo: '',
    descricao: '',
    responsaveis: [],
    prazo: { tipo: 'sem-data' },
    repeticao: 'nenhuma',
    avisarCriacao: false,
    lembrarHora: false,
    concluidaEm: null,
    resolvidas: [],
  };
}

export function camposArquivoIniciais(): CamposArquivo {
  return { nome: '', tipo: 'ficheiro', pai: null };
}

// Lê os campos de um Y.Map com valores por defeito (doc novo ou campo em falta).
export function lerCamposTarefa(map: Y.Map<unknown>): CamposTarefa {
  const base = camposTarefaIniciais();
  const prazo = (map.get('prazo') as Prazo | undefined) ?? base.prazo;
  return {
    titulo: (map.get('titulo') as string) ?? '',
    descricao: (map.get('descricao') as string) ?? '',
    responsaveis: (map.get('responsaveis') as string[]) ?? [],
    prazo,
    repeticao: (map.get('repeticao') as Repeticao) ?? 'nenhuma',
    avisarCriacao: (map.get('avisarCriacao') as boolean) ?? false,
    lembrarHora: (map.get('lembrarHora') as boolean) ?? false,
    concluidaEm: (map.get('concluidaEm') as string | null) ?? null,
    resolvidas: (map.get('resolvidas') as Resolvida[]) ?? [],
  };
}

export function lerCamposArquivo(map: Y.Map<unknown>): CamposArquivo {
  return {
    nome: (map.get('nome') as string) ?? '',
    tipo: (map.get('tipo') as TipoArquivo) ?? 'ficheiro',
    pai: (map.get('pai') as string | null) ?? null,
  };
}
