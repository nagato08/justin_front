self.addEventListener("push", (event) => {
  let data = { title: "Ma cuisine", body: "Vous avez une nouvelle notification.", url: "/" };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch { /* payload par défaut */ }
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: "/app-icon.svg", badge: "/app-icon.svg", data: { url: data.url }, tag: data.url }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    const existing = windows.find((client) => client.url === target);
    return existing ? existing.focus() : clients.openWindow(target);
  }));
});
