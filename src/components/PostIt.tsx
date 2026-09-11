import { db } from '../lib/db';

type Props = {
  itemId: string;
  resumo: string;
  retirar: (id: number) => void;
  abrir: (itemId: string) => void;
  mostrarPasta: (itemId: string) => void;
};

// Amarelo #FFEB3B — a única cor além do preto e do branco.
export function PostItCartao({ itemId, resumo, retirar, abrir, mostrarPasta }: Props) {
  return (
    <div className="postit">
      <p style={{ margin: '0 0 0.4rem 0', fontWeight: 700 }}>{resumo}</p>
      <div className="linha">
        <button onClick={() => abrir(itemId)}>Abrir</button>
        <button onClick={() => mostrarPasta(itemId)}>Mostrar na pasta</button>
        <button
          onClick={async () => {
            const p = await db.postits.where('itemId').equals(itemId).first();
            if (p && p.id !== undefined) retirar(p.id);
          }}
        >
          Retirar
        </button>
      </div>
    </div>
  );
}

export function resumoDe(nome: string, tipo: string): string {
  return tipo === 'nota' ? nome : nome;
}
