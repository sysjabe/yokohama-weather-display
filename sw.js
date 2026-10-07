const CACHE = "yokohama-weather-shell-v2";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest"];
const shellURL = new URL("./index.html", self.location.href).href;
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(
    ASSETS.map(path => new Request(new URL(path, self.location.href), {cache:"reload"}))
  )).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith("yokohama-weather-shell-") && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if(request.method !== "GET" || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  if(request.mode === "navigate"){
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try{
        const response = await fetch(new Request(request,{cache:"no-store"}));
        if(!response.ok) throw new Error("Navigation failed");
        await cache.put(shellURL, response.clone());
        return response;
      }catch(_){
        return (await cache.match(shellURL)) || Response.error();
      }
    })());
  }else if(ASSETS.some(path => new URL(path,self.location.href).href === url.href)){
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(request)) || fetch(request)));
  }
});
