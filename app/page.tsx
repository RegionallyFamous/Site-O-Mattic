import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { blueprints } from "./blueprint-catalog";

function getOptionalString(
  item: (typeof blueprints)[number],
  key: string,
): string | undefined {
  return key in item && typeof item[key as keyof typeof item] === "string"
    ? (item[key as keyof typeof item] as string)
    : undefined;
}

export default async function Home() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const approvedCount = blueprints.filter(
    (blueprint) => blueprint.releaseStatus === "approved",
  ).length;

  return (
    <main className="site-shell">
      <header className="catalog-header">
        <Link className="brand" href="/" aria-label="Site-O-Mattic catalog home">
          <span className="brand-mark">SOM</span>
          <span>
            <span className="brand-name">Site-O-Mattic</span>
            <span className="brand-subtitle">Blueprint catalog</span>
          </span>
        </Link>
        <div className="catalog-meta" aria-label="Catalog status">
          <span>{blueprints.length} blueprints</span>
          <span>{approvedCount} approved</span>
        </div>
      </header>

      <section className="catalog-intro" aria-labelledby="catalog-title">
        <div>
          <p className="eyebrow">Local service starters</p>
          <h1 id="catalog-title">Preview, launch, or inspect every Blueprint.</h1>
        </div>
        <p className="summary">
          A compact index of one-page WordPress Playground starters with bundled
          media, generated brand assets, and direct Blueprint JSON access.
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
          const previewSrc =
            getOptionalString(blueprint, "screenshot") ?? blueprint.hero;

          return (
            <article className="blueprint-card" key={blueprint.path}>
              <div className="preview-frame">
                <Image
                  className="preview"
                  src={previewSrc}
                  alt={`${blueprint.name} preview`}
                  fill
                  sizes="(min-width: 1180px) 31vw, (min-width: 760px) 46vw, 100vw"
                  unoptimized
                />
              </div>
              <div className="card-copy">
                <Image
                  className="blueprint-logo"
                  src={blueprint.logo}
                  alt={blueprint.name}
                  width={blueprint.logoWidth}
                  height={blueprint.logoHeight}
                  unoptimized
                />
                <div className="card-heading">
                  <p className="eyebrow">{blueprint.eyebrow}</p>
                  <h2>{blueprint.name}</h2>
                </div>
                <p className="card-summary">{blueprint.summary}</p>
                <div className="blueprint-details" aria-label="Blueprint details">
                  <span>{blueprint.layoutVariant}</span>
                  <span>{blueprint.releaseStatus}</span>
                </div>
                <div className="actions" aria-label={`${blueprint.name} links`}>
                  <a className="button primary" href={playgroundUrl}>
                    Playground
                  </a>
                  <a className="button secondary" href={blueprint.path}>
                    Blueprint JSON
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
