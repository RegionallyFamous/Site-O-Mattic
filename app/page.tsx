import { headers } from "next/headers";

const blueprints = [
  {
    name: "GreenStripe Lawn Care",
    eyebrow: "Lawn care service",
    summary:
      "A crisp, cheerful lawn care one-pager with mowing, edging, seasonal cleanups, and neighbor-approved proof.",
    logo: "/blueprints/lawn-care-service/assets/logo.png",
    hero: "/blueprints/lawn-care-service/assets/hero.jpg",
    alt: "Freshly edged green lawn with a lawn care professional at work",
    path: "/api/blueprints/lawn-care-service/blueprint.json",
  },
  {
    name: "BrightJet Exterior Cleaning",
    eyebrow: "Pressure washing service",
    summary:
      "A punchy exterior-cleaning site for driveways, siding, patios, and soft-wash quote requests.",
    logo: "/blueprints/pressure-washing-service/assets/logo.png",
    hero: "/blueprints/pressure-washing-service/assets/hero.jpg",
    alt: "Pressure washing technician cleaning a residential driveway",
    path: "/api/blueprints/pressure-washing-service/blueprint.json",
  },
];

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
              <img className="preview" src={blueprint.hero} alt={blueprint.alt} />
              <div className="card-copy">
                <img className="brand-mark" src={blueprint.logo} alt={blueprint.name} />
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
