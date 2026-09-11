// Pesquisa global: títulos, texto das notas e nomes de ficheiros.
import { db, carregarDoc } from './db';
import { lerCamposArquivo, lerCamposTarefa } from './types';

export type Resultado = {
  itemId: string;
  area: 'tarefa' | 'nota' | 'arquivo';
  tipo?: string;
  titulo: string;
  detalhe: string;
};

function textoPlano(xml: string): string {
  return xml
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function pesquisarGlobal(consulta: string): Promise<Resultado[]> {
  const q = consulta.trim().toLowerCase();
  if (q.length < 2) return [];
  const itens = await db.itens.filter((i) => !i.apagadoEm).toArray();
  const resultados: Resultado[] = [];

  for (const item of itens) {
    const doc = await carregarDoc(item.id);
    const map = doc.getMap('estado');
    if (item.area === 'tarefa') {
      const campos = lerCamposTarefa(map);
      if (campos.titulo.toLowerCase().includes(q) || campos.descricao.toLowerCase().includes(q)) {
        resultados.push({ itemId: item.id, area: 'tarefa', titulo: campos.titulo || '(sem título)', detalhe: 'Tarefa da casa' });
      }
    } else if (item.area === 'nota') {
      const titulo = (map.get('titulo') as string) || '(sem título)';
      const texto = textoPlano(doc.getXmlFragment('conteudo').toString());
      if (titulo.toLowerCase().includes(q) || texto.toLowerCase().includes(q)) {
        const onde = texto.toLowerCase().indexOf(q);
        const trecho = onde >= 0 ? texto.slice(Math.max(0, onde - 30), onde + 60) : '';
        resultados.push({ itemId: item.id, area: 'nota', titulo, detalhe: trecho ? `Nota privada: …${trecho}…` : 'Nota privada' });
      }
    } else {
      const campos = lerCamposArquivo(map);
      if (campos.nome.toLowerCase().includes(q)) {
        resultados.push({ itemId: item.id, area: 'arquivo', tipo: campos.tipo, titulo: campos.nome || '(sem nome)', detalhe: `Arquivo: ${campos.tipo}` });
      } else if (campos.tipo === 'nota') {
        const texto = textoPlano(doc.getXmlFragment('conteudo').toString());
        if (texto.toLowerCase().includes(q)) {
          resultados.push({ itemId: item.id, area: 'arquivo', tipo: 'nota', titulo: campos.nome || '(sem nome)', detalhe: 'Nota nos Arquivos' });
        }
      }
      if (campos.tipo === 'ficheiro') {
        const anexos = await db.anexos.where('itemId').equals(item.id).toArray();
        if (anexos.some((a) => a.nome.toLowerCase().includes(q))) {
          resultados.push({ itemId: item.id, area: 'arquivo', tipo: 'ficheiro', titulo: campos.nome || '(sem nome)', detalhe: 'Ficheiro anexado' });
        }
      }
    }
  }
  return resultados.slice(0, 30);
}
