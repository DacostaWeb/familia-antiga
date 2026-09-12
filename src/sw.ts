/// <reference types="vite-plugin-pwa/client" />
/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision?: string }> };

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

function createHandlerBoundToURL(url: string) {
  return async () => (await caches.match(url)) ?? Response.error();
}

// Aplicar versão nova só com clique (a barra manda SKIP_WAITING).
self.addEventListener('message', (evento: ExtendableMessageEvent) => {
  if (evento.data && evento.data.type === 'SKIP_WAITING') void self.skipWaiting();
});

// Lembrete: título da tarefa e mais nada (secção 1.7).
self.addEventListener('push', (evento: PushEvent) => {
  let dados = { title: 'Casadacosta', url: '/familia/' };
  try {
    dados = { ...dados, ...evento.data!.json() };
  } catch {
    // payload inválido: usa os valores por omissão
  }
  evento.waitUntil(
    self.registration.showNotification(dados.title, {
      body: 'Tocar para abrir a tarefa.',
      tag: dados.url,
      data: { url: dados.url },
    }),
  );
});

self.addEventListener('notificationclick', (evento: NotificationEvent) => {
  evento.notification.close();
  const url = (evento.notification.data?.url as string) ?? '/familia/';
  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((abertas) => {
      for (const cliente of abertas) {
        if (cliente.url.includes(url) && 'focus' in cliente) return cliente.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
