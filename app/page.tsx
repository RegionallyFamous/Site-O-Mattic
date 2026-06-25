import Image from "next/image";
import { headers } from "next/headers";
import { blueprints } from "./blueprint-catalog";

export default async function Home() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";

  return (
    <main className="site-shell">
      <section className="intro">
        <p className="eyebrow">Site-O-Mattic</p>
        <h1>One-page Blueprint starters for local niches.</h1>
        <p className="summary">
          Each Blueprint turns the default WordPress block theme into a focused
          service-business site using core blocks, bundled media, and generated
          brand assets.
        </p>
      </section>
      <div className="blueprint-grid">
        {blueprints.map((blueprint) => {
          const blueprintUrl = host
            ? `${protocol}://${host}${blueprint.path}`
            : blueprint.path;
          const playgroundUrl = host
            ? `https://playground.wordpress.net/?blueprint-url=${encodeURIComponent(blueprintUrl)}`
            : "https://playground.wordpress.net/";

          return (
            <article className="blueprint-card" key={blueprint.path}>
              <Image
                className="preview"
                src={blueprint.hero}
                alt={blueprint.alt}
                width={blueprint.heroWidth}
                height={blueprint.heroHeight}
              />
              <div className="card-copy">
                <Image
                  className="brand-mark"
                  src={blueprint.logo}
                  alt={blueprint.name}
                  width={blueprint.logoWidth}
                  height={blueprint.logoHeight}
                />
                <p className="eyebrow">{blueprint.eyebrow}</p>
                <h2>{blueprint.name}</h2>
                <p className="summary">{blueprint.summary}</p>
                <div className="actions" aria-label={`${blueprint.name} links`}>
                  <a className="button primary" href={playgroundUrl}>
                    Open in Playground
                  </a>
                  <a className="button secondary" href={blueprint.path}>
                    View Blueprint JSON
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
