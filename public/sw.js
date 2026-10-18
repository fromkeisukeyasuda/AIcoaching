/* RoleMate 最小限の Service Worker
   - インストール可能なPWAにするための土台
   - オフライン時は、案内ページ(/offline.html)を表示する
   - アイコンだけをキャッシュする（画面やAPIの通信には一切関与しない）
   画面のデータ（練習履歴など）は localStorage にあり、ネットワークは不要。AIの返答だけがオンライン必須。 */

const VERSION = "rolemate-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // API・Next.jsの内部ファイルは触らない（常にネットワーク）
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) return;

  // ページ遷移: ネットワーク優先。つながらないときだけ、オフライン案内を出す
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // アイコン: キャッシュ優先
  if (url.pathname.startsWith("/icons/")) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
  }
});
