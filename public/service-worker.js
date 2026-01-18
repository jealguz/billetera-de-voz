const CACHE_NAME = 'wallet-voice-v2';
const DYNAMIC_CACHE = 'wallet-voice-dynamic-v1';

// Archivos críticos para funcionamiento offline
const STATIC_FILES = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/css/main.chunk.css',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/favicon.ico'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cacheando archivos estáticos');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[Service Worker] Instalación completada');
        return self.skipWaiting();
      })
  );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando...');
  
  // Limpiar caches viejos
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
            console.log('[Service Worker] Borrando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Ahora controla todos los clients');
      return self.clients.claim();
    })
  );
});

// Estrategia de cache: Cache First, luego Network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar solicitudes a APIs externas o chrome-extension
  if (url.origin !== self.location.origin || 
      request.url.includes('chrome-extension://')) {
    return;
  }
  
  // Para archivos estáticos: Cache First
  if (STATIC_FILES.some(file => request.url.includes(file))) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then((response) => {
              // No cachear respuestas inválidas
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clonar la respuesta para cachearla
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
              
              return response;
            });
        })
    );
  } else {
    // Para otras rutas: Network First
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Si la red responde, actualizar cache
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => {
              cache.put(request, responseClone);
            });
          return response;
        })
        .catch(() => {
          // Si falla la red, intentar del cache
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // Si no está en cache, mostrar página offline
              if (request.mode === 'navigate') {
                return caches.match('/');
              }
              
              return new Response('Sin conexión', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
  }
});

// Manejar mensajes desde la app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Sincronización en background (para cuando vuelve la conexión)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-debts') {
    console.log('[Service Worker] Sincronizando deudas...');
    event.waitUntil(syncDebts());
  }
});

async function syncDebts() {
  // Aquí iría la lógica para sincronizar con backend si tuvieras
  console.log('[Service Worker] Sincronización completada');
}