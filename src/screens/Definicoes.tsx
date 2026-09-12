import { useState } from 'react';
import type { EstadoSync, Sessao } from '../lib/sync';
import { ativarPush, pushSuportado } from '../lib/push';

type Props = {
  tamanhoTexto: number;
  mudarTamanhoTexto: (px: number) => void;
  sessao: Sessao;
  sync: EstadoSync;
};

const TAMANHOS = [
  { px: 18, nome: 'Normal' },
  { px: 21, nome: 'Grande' },
  { px: 24, nome: 'Muito grande' },
];

const NOMES_SYNC: Record<EstadoSync, string> = {
  'sem-conta': 'Sem conta: tudo fica só neste aparelho.',
  'a-sincronizar': 'A sincronizar com o servidor…',
  sincronizado: 'Sincronizado com o servidor.',
  erro: 'Não consegui sincronizar agora. Fica guardado no dispositivo e tenta-se outra vez sozinho.',
};

export default function Definicoes({ tamanhoTexto, mudarTamanhoTexto, sessao, sync }: Props) {
  const [mensagemPush, setMensagemPush] = useState('');

  async function ligarPush() {
    setMensagemPush((await ativarPush()) ?? 'Notificações ligadas neste aparelho.');
  }

  async function pedirArmazenamento() {
    const persistente = await navigator.storage?.persist?.();
    const estimativa = await navigator.storage?.estimate?.();
    const uso = estimativa?.usage ? Math.round(estimativa.usage / 1024 / 1024) : 0;
    window.alert(
      persistente
        ? `Armazenamento persistente garantido. Em uso: ${uso} MB.`
        : `O navegador não garantiu o armazenamento persistente. Em uso: ${uso} MB.`,
    );
  }

  return (
    <>
      <h2>Letra</h2>
      <div className="linha">
        {TAMANHOS.map((t) => (
          <button key={t.px} onClick={() => mudarTamanhoTexto(t.px)} style={tamanhoTexto === t.px ? { background: '#000000', color: '#ffffff' } : {}}>
            {t.nome}
          </button>
        ))}
      </div>

      <h2>Notificações</h2>
      <div className="caixa">
        <p>Os lembretes só existem quando a tarefa tem “Lembrar à hora marcada” ligado e uma hora marcada. Sem hora, não há alarme.</p>
        {pushSuportado() ? (
          <>
            <button onClick={() => void ligarPush()}>Ligar notificações neste aparelho</button>
            {mensagemPush && <p className="notafb">{mensagemPush}</p>}
          </>
        ) : (
          <p className="notafb">Este navegador não suporta notificações.</p>
        )}
        <p className="notafb">No iPhone é preciso a app adicionada ao ecrã principal (Safari → Partilhar → Adicionar ao ecrã principal).</p>
      </div>

      <h2>Guardar neste aparelho</h2>
      <div className="caixa">
        <p>A app grava tudo primeiro neste aparelho. Para o navegador não limpar estes dados, podes pedir armazenamento persistente:</p>
        <button onClick={() => void pedirArmazenamento()}>Pedir armazenamento persistente</button>
      </div>
      <p className="notafb">
        Importante: se o navegador for limpo ou o aparelho se perder antes de a app sincronizar com o servidor, perdem-se as alterações que só
        existiam neste aparelho. Quando as contas estiverem ligadas, isto deixa de ser um risco para o que estiver sincronizado.
      </p>

      <h2>Contas</h2>
      <div className="caixa">
        {sessao ? (
          <>
            <p>
              Entraste como <strong>{sessao.email}</strong>
              {sessao.aprovado ? '' : ' — à espera de aprovação por atelierdacostafinanceiro@gmail.com. Enquanto isso, tudo fica guardado neste aparelho.'}
            </p>
            <p className="notafb">{NOMES_SYNC[sync]}</p>
          </>
        ) : (
          <p>Sem conta: tudo fica guardado só neste aparelho. Entra com o Google (botão no topo) para a família ver as tarefas da casa e partilhar notas.</p>
        )}
      </div>

      <h2>Cópia na Drive</h2>
      <div className="caixa">
        <p>
          A cópia fica na tua Drive, em ficheiros normais que podes abrir. Para a teres offline, ativa o acesso offline nas definições do Google
          Drive. O modo offline da Casadacosta funciona independentemente disto.
        </p>
        <p>
          A cópia é de sentido único: da app para a Drive. Editar um ficheiro diretamente na Drive não traz a alteração de volta para a app.
        </p>
        <p>A cópia corre com a app aberta: o que for escrito só chega à Drive de outra pessoa quando ela abrir a app.</p>
        <p className="notafb">A ligação à Drive chega na fase seguinte do plano.</p>
      </div>

      <h2>Instalar no aparelho</h2>
      <div className="caixa">
        <p>
          <strong>iPhone:</strong> abre esta página no Safari, toca em Partilhar e escolhe “Adicionar ao ecrã principal”. As notificações só
          funcionam com a app adicionada ao ecrã principal.
        </p>
        <p>
          <strong>Android:</strong> abre esta página no Chrome, toca em ⋮ e escolhe “Instalar aplicação”.
        </p>
        <p>
          <strong>Computador:</strong> no Chrome ou Edge, toca no ícone de instalação na barra de endereço.
        </p>
      </div>
    </>
  );
}
