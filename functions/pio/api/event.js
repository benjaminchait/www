// Proxy /pio/api/event to Plausible Analytics
// Proxying avoids ad-blocker interference; based on https://plausible.io/docs/proxy/guides/cloudflare
export async function onRequest(context) {
  return fetch("https://plausible.io/api/event", {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.body,
  });
}
