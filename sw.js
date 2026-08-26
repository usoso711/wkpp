const CACHE_NAME = "health-app-shell-v2";

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {
    data = { body: event.data ? event.data.text() : "通知があります" };
  }

  const title = data.title || "💩＆💊記録";
  const options = {
    body: data.body || data.message || "今日の記録を確認してね！",
    icon: data.icon || "./icon-192.png",
    badge: data.badge || "./icon-192.png",
    tag: data.tag || "health-app-notification",
    renotify: true,
    data: { url: data.url || "./" }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = event.notification.data?.url || "./";

  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clients) {
      if ("focus" in client) {
        try { await client.navigate(target); } catch {}
        return client.focus();
      }
    }
    return self.clients.openWindow(target);
  })());
});
