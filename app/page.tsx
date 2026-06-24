import { headers } from "next/headers";

const blueprintPath = "/api/blueprints/lawn-care-service/blueprint.json";

export default async function Home() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const blueprintUrl = host ? `${protocol}://${host}${blueprintPath}` : blueprintPath;
  const playgroundUrl = host
    ? `https://playground.wordpress.net/?blueprint-url=${encodeURIComponent(blueprintUrl)}`
    : "https://playground.wordpress.net/";

  return (
    <main className="site-shell">
      <section className="launch-panel">
        <div className="copy">
          <img
            className="brand-mark"
            src="/blueprints/lawn-care-service/assets/logo.png"
            alt="GreenStripe Lawn Care"
          />
          <p className="eyebrow">Site-O-Mattic Blueprint</p>
          <h1>GreenStripe Lawn Care</h1>
          <p className="summary">
            A one-page WordPress Playground Blueprint that turns the default
            theme into a crisp, cheerful lawn care service site using only core
            blocks, settings, and bundled media.
          </p>
          <div className="actions" aria-label="Blueprint links">
            <a className="button primary" href={playgroundUrl}>
              Open in Playground
            </a>
            <a className="button secondary" href={blueprintPath}>
              View Blueprint JSON
            </a>
          </div>
        </div>
        <img
          className="preview"
          src="/blueprints/lawn-care-service/assets/hero.jpg"
          alt="Freshly edged green lawn with a lawn care professional at work"
        />
      </section>
    </main>
  );
}
