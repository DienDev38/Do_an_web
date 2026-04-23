// Minimal pass-through Bunny Edge Script.
addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});