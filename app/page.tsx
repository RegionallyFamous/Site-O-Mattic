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

function niceLabel(value: string): string {
  return value.replaceAll("-", " ");
}

export default async function Home() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const approvedCount = blueprints.filter(
    (blueprint) => blueprint.releaseStatus === "approved",
  ).length;
  const patternCount = new Set(
    blueprints.map((blueprint) => blueprint.layoutVariant),
  ).size;
  const featuredBlueprint =
    [...blueprints]
      .reverse()
      .find((blueprint) => blueprint.releaseStatus === "approved") ??
    blueprints[0];

  if (!featuredBlueprint) {
    return null;
  }

  const blueprintUrlFor = (path: string) =>
    host ? `${protocol}://${host}${path}` : path;
  const playgroundUrlFor = (path: string) =>
    host
      ? `https://playground.wordpress.net/?blueprint-url=${encodeURIComponent(
          blueprintUrlFor(path),
        )}`
      : "https://playground.wordpress.net/";
  const featuredPreview =
    getOptionalString(featuredBlueprint, "screenshot") ?? featuredBlueprint.hero;
  const featuredPlaygroundUrl = playgroundUrlFor(featuredBlueprint.path);

  return (
    <main className="site-shell">
      <header className="catalog-header">
        <Link className="brand" href="/" aria-label="Site-O-Mattic demo home">
          <span className="brand-mark" aria-hidden="true">
            SOM
          </span>
          <span>
            <span className="brand-name">Site-O-Mattic</span>
            <span className="brand-subtitle">AI-made WordPress demos</span>
          </span>
        </Link>
        <nav className="catalog-nav" aria-label="Demo links">
          <a href="#proof">Proof</a>
          <a href="#catalog">Catalog</a>
          <a
            href={featuredPlaygroundUrl}
            aria-label={`Launch ${featuredBlueprint.name} in WordPress Playground`}
          >
            Launch demo
          </a>
        </nav>
      </header>

      <section className="pitch-hero" aria-labelledby="catalog-title">
        <Image
          className="hero-screenshot"
          src={featuredPreview}
          alt=""
          fill
          sizes="100vw"
          priority
          unoptimized
        />
        <div className="hero-ink" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow">Internal pitch kit</p>
          <h1 id="catalog-title">
            Sell the idea with live WordPress demos, not another slide.
          </h1>
          <p className="summary">
            Site-O-Mattic turns narrow local-service niches into polished,
            Playground-ready block themes with brand assets, screenshots,
            accessibility checks, and one-click proof.
          </p>
          <div className="hero-actions" aria-label="Primary demo actions">
            <a className="button primary" href={featuredPlaygroundUrl}>
              Launch featured demo
            </a>
            <a className="button secondary" href="#catalog">
              Browse the catalog
            </a>
          </div>
        </div>
      </section>

      <dl className="proof-band" id="proof" aria-label="Site-O-Mattic proof">
        <div>
          <dt>ready niches</dt>
          <dd>{blueprints.length}</dd>
        </div>
        <div>
          <dt>approved builds</dt>
          <dd>{approvedCount}</dd>
        </div>
        <div>
          <dt>layout systems</dt>
          <dd>{patternCount}</dd>
        </div>
        <div>
          <dt>to Playground</dt>
          <dd>1 click</dd>
        </div>
      </dl>

      <section className="demo-story" aria-labelledby="story-title">
        <div>
          <p className="eyebrow">Why this lands</p>
          <h2 id="story-title">The catalog behaves like a product demo.</h2>
          <p>
            Each card leads with a real screenshot, branded logo, specific
            service story, direct Blueprint JSON, and a Playground launch path.
            The riso wrapper brings the energy; the sites themselves stay lean,
            block-first, and ready to inspect.
          </p>
        </div>
        <a
          className="featured-shot"
          href={featuredPlaygroundUrl}
          aria-label={`Open ${featuredBlueprint.name} in WordPress Playground`}
        >
          <Image
            src={featuredPreview}
            alt={`${featuredBlueprint.name} screenshot preview`}
            fill
            sizes="(min-width: 960px) 42vw, 100vw"
            unoptimized
          />
        </a>
      </section>

      <section className="pitch-points" aria-label="Sales talking points">
        <article>
          <span aria-hidden="true">01</span>
          <h2>Concrete</h2>
          <p>Show an actual site, not a hypothetical flowchart.</p>
        </article>
        <article>
          <span aria-hidden="true">02</span>
          <h2>Portable</h2>
          <p>Every demo opens in WordPress Playground from a hosted Blueprint.</p>
        </article>
        <article>
          <span aria-hidden="true">03</span>
          <h2>Inspectable</h2>
          <p>JSON, screenshots, assets, and production specs stay visible.</p>
        </article>
      </section>

      <section className="catalog-section" id="catalog" aria-labelledby="catalog-heading">
        <div className="section-heading">
          <p className="eyebrow">Live catalog</p>
          <h2 id="catalog-heading">Pick a niche. Open the site. Feel the pitch click.</h2>
        </div>

        <div className="blueprint-grid">
          {blueprints.map((blueprint) => {
            const playgroundUrl = playgroundUrlFor(blueprint.path);
            const previewSrc =
              getOptionalString(blueprint, "screenshot") ?? blueprint.hero;

            return (
              <article className="blueprint-card" key={blueprint.path}>
                <a
                  className="preview-frame"
                  href={playgroundUrl}
                  aria-label={`Open ${blueprint.name} in WordPress Playground`}
                >
                  <Image
                    className="preview"
                    src={previewSrc}
                    alt={`${blueprint.name} screenshot preview`}
                    fill
                    sizes="(min-width: 1180px) 31vw, (min-width: 760px) 46vw, 100vw"
                    unoptimized
                  />
                </a>
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
                    <h3>{blueprint.name}</h3>
                  </div>
                  <p className="card-summary">{blueprint.summary}</p>
                  <div className="blueprint-details" aria-label="Blueprint details">
                    <span>Pattern: {niceLabel(blueprint.layoutVariant)}</span>
                    <span>Status: {blueprint.releaseStatus}</span>
                  </div>
                  <div className="actions" aria-label={`${blueprint.name} links`}>
                    <a
                      className="button primary"
                      href={playgroundUrl}
                      aria-label={`Open ${blueprint.name} in WordPress Playground`}
                    >
                      Open Playground
                    </a>
                    <a
                      className="button secondary"
                      href={blueprint.path}
                      aria-label={`Inspect ${blueprint.name} Blueprint JSON`}
                    >
                      Inspect JSON
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
