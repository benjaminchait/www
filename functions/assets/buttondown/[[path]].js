// Proxy /assets/buttondown/* to the newsletter site
// Deprecated: renamed to /assets/newsletter/* (March 2026); retained for backwards compatibility
export async function onRequest(context) {
  const upstream = new URL(
    `/assets/${context.params.path.join("/")}`,
    "https://benjaminchait-newsletter.netlify.app"
  );
  return fetch(upstream.toString(), {
    headers: context.request.headers,
  });
}
