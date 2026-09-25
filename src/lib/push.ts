import { api } from "./api";

interface StoredSubscription { endpoint: string; keys: { p256dh: string; auth: string } }

function applicationServerKey(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

async function browserSubscription(): Promise<StoredSubscription> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    throw new Error("Les notifications ne sont pas prises en charge sur cet appareil.");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Autorisez les notifications dans votre navigateur.");
  const key = await api<{ publicKey: string | null; enabled: boolean }>("/notifications/push/public-key");
  if (!key.enabled || !key.publicKey) throw new Error("Les notifications push ne sont pas encore configurées sur le serveur.");
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey(key.publicKey) });
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error("Abonnement navigateur incomplet.");
  return { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } };
}

export async function subscribeAdminPush(token: string) {
  const subscription = await browserSubscription();
  return api("/admin/notifications/push/subscription", { method: "POST", body: JSON.stringify(subscription) }, token);
}

export async function subscribeOrderPush(token: string, reference: string) {
  const subscription = await browserSubscription();
  return api("/notifications/push/subscribe-order", { method: "POST", body: JSON.stringify({ reference, subscription }) }, token);
}
