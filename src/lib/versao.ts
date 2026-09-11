// Barra "Há uma versão nova" — só aparece quando há mesmo um service worker à espera,
// e só aplica com clique (nunca sozinha). Ao aplicar, o SKIP_WAITING ativa o worker
// novo e o controllerchange recarrega a página.
import { useCallback, useEffect, useState } from 'react';

export function useNovaVersao(): { haNova: boolean; aplicar: () => void } {
  const [haNova, setHaNova] = useState(false);
  const [registo, setRegisto] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let vivo = true;

    function vigiar(r: ServiceWorkerRegistration) {
      if (!vivo) return;
      setRegisto(r);
      if (r.waiting && navigator.serviceWorker.controller) setHaNova(true);
      r.addEventListener('updatefound', () => {
        const novo = r.installing;
        novo?.addEventListener('statechange', () => {
          if (novo.state === 'installed' && navigator.serviceWorker.controller && vivo) setHaNova(true);
        });
      });
    }

    void navigator.serviceWorker.getRegistration().then((r) => {
      if (r) vigiar(r);
    });

    const aoMudarControlador = () => window.location.reload();
    navigator.serviceWorker.addEventListener('controllerchange', aoMudarControlador);
    return () => {
      vivo = false;
      navigator.serviceWorker.removeEventListener('controllerchange', aoMudarControlador);
    };
  }, []);

  const aplicar = useCallback(() => {
    // O que está aberto já está gravado: o Yjs grava a cada alteração.
    registo?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    // Se não houver controllerchange (worker já ativado), recarregar à mesma.
    setTimeout(() => window.location.reload(), 500);
  }, [registo]);

  return { haNova, aplicar };
}
