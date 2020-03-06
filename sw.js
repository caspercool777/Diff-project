const apiUrl = 'https://jsonplaceholder.typicode.com';

const files = [
        './',
        '/index.html',
        './app.js',
        './style.css',
    ];

self.addEventListener('install', async e => {
    const cache = await caches.open('files');
    cache.addAll(files);
});

function isApiCall(req) {
    return req.url.startsWith(apiUrl);
}

async function getFromNetwork(req) {
    // ссылка на кеш с тэгом "data"
    const cache = await caches.open('data');

    try {
        // выполняем запрос в сеть
        const res = await fetch(req);
        // сохраняем результат в кеш
        cache.put(req, res.clone());
        return res;
    } catch (e) {
        // упс, что-то пошло не так, сеть не работает!!!
        // извлекаем результат запроса из кеша
        const res = await cache.match(req);
        // возвращаем результат запроса если он найден в кеше
        // возвращаем данные-заглушки 
        // если в кеше нет результатов запроса
        return res || getFallback(req);
    }
}


async function getFromCache(req) {
    // запрос в кеш
    const res = await caches.match(req);

    if (!res) {
        // в кеше нет данных для запроса
        // отправляем запрос в сеть
        // return fetch(req);
        return getFromNetwork(req)
    }

    return res;
}


async function getFallback(req) {
    const path = req.url.substr(apiUrl.length);

    if (path.startsWith('/posts')) {
        return caches.match('./fallback/posts.json');
    } else if (path.startsWith('/users')) {
        return caches.match('./fallback/users.json');
    }
}

self.addEventListener('fetch', async e => {
    // извлекаем запрос из события
    const req = e.request;
    // запрос соответствует нашему api url - обращаемся в сеть
    // прочие запросы (html, css, js, json и любые другие файлы)
    // - пытаемся получить результаты из кеша
    // эти файлы являются частями нашего приложения и
    // сохраняются при первой загрузке
    const res = isApiCall(req) ?
        getFromNetwork(req) : getFromCache(req);
    // подсовываем событию "fetch" результат сформированный нами
    // в вызовах getFromNetwork или getFromCache
    // этот результат будет использован в нашем приложении
    await e.respondWith(res);
});


/*const staticCacheName = 'site-static-v1';
const assets = [
  '/',
  '/index.html',
  '/assets/js/ui.js',
  '/assets/css/main.css',
  '/assets/images/background-home.jpg',
  'https://fonts.googleapis.com/css?family=Lato:300,400,700',
];
*/
// событие install
/*self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(staticCacheName).then((cache) => {
      console.log('caching shell assets');
      cache.addAll(assets);
    })
  );
});
// событие activate
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys
        .filter(key => key !== staticCacheName)
        .map(key => caches.delete(key))
      );
    })
  );
});
// событие fetch
self.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.match(evt.request).then(cacheRes => {
      return cacheRes || fetch(evt.request);
    })
  );
});
