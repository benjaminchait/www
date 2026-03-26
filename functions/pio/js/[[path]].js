// Proxy /pio/js/* to Plausible Analytics
// Proxying avoids ad-blocker interference; based on https://plausible.io/docs/proxy/guides/cloudflare
export async function onRequest(context) {
  const upstream = new URL(
    `/js/${context.params.path.join("/")}`,
    "https://plausible.io"
  );
  return fetch(upstream.toString(), {
    headers: context.request.headers,
  });
}
