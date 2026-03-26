// Proxy /assets/newsletter/* to the newsletter site
// Newsletter assets are stored in https://github.com/benjaminchait/newsletter,
// deployed to benjaminchait-newsletter.netlify.app
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const upstream = new URL(
    `/assets/${context.params.path.join("/")}`,
    "https://benjaminchait-newsletter.netlify.app"
  );
  return fetch(upstream.toString(), {
    headers: context.request.headers,
  });
}
