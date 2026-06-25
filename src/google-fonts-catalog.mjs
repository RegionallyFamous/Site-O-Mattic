import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_OUTPUT = "data/google-fonts-catalog.json";
const args = process.argv.slice(2);
const summaryOnly = args.includes("--summary-only");
const outIndex = args.indexOf("--out");
const outputPath = outIndex >= 0 ? args[outIndex + 1] : DEFAULT_OUTPUT;

if (outIndex >= 0 && !outputPath) {
  console.error("Missing value after --out");
  process.exit(1);
}

const apiKey = process.env.GOOGLE_FONTS_API_KEY;
const source = apiKey ? developerApiSource(apiKey) : metadataFallbackSource();
const payload = await fetchJson(source.url, source.parser);
const families = normalizeFamilies(payload, source.kind);

const catalog = {
  generatedAt: new Date().toISOString(),
  source: {
    kind: source.kind,
    name: source.name,
    url: source.redactedUrl || source.url,
    requiresApiKey: source.requiresApiKey,
    officialContract: source.officialContract,
    notes: source.notes
  },
  totalFamilies: families.length,
  variableFamilies: families.filter((family) => family.axes.length > 0).length,
  categoryCounts: countBy(families, "category"),
  families
};

console.log(`Google Fonts catalog: ${catalog.totalFamilies} families, ${catalog.variableFamilies} variable families`);
console.log(`Source: ${catalog.source.name}`);
console.log(`Categories: ${Object.entries(catalog.categoryCounts).map(([name, count]) => `${name} ${count}`).join(", ")}`);

if (!summaryOnly) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`Wrote ${outputPath}`);
}

function developerApiSource(key) {
  const params = new URLSearchParams({
    key,
    sort: "alpha",
    capability: "VF",
    capability: "WOFF2",
    capability: "FAMILY_TAGS"
  });
  const redactedParams = new URLSearchParams(params);
  redactedParams.set("key", "$GOOGLE_FONTS_API_KEY");

  return {
    kind: "developer-api",
    name: "Google Fonts Developer API",
    url: `https://www.googleapis.com/webfonts/v1/webfonts?${params.toString()}`,
    redactedUrl: `https://www.googleapis.com/webfonts/v1/webfonts?${redactedParams.toString()}`,
    requiresApiKey: true,
    officialContract: true,
    notes: "Canonical served-family API. Use GOOGLE_FONTS_API_KEY for production refreshes.",
    parser: async (response) => response.json()
  };
}

function metadataFallbackSource() {
  return {
    kind: "fonts-metadata",
    name: "fonts.google.com metadata endpoint",
    url: "https://fonts.google.com/metadata/fonts",
    requiresApiKey: false,
    officialContract: false,
    notes: "Useful keyless Google Fonts catalog snapshot. Treat schema as undocumented and validate on refresh.",
    parser: async (response) => {
      const text = await response.text();
      return JSON.parse(text.replace(/^\)]}'\n?/, ""));
    }
  };
}

async function fetchJson(url, parser) {
  const response = await fetch(url, {
    headers: {
      "accept": "application/json,text/plain,*/*",
      "user-agent": "Site-O-Mattic Google Fonts catalog refresh"
    }
  });

  if (!response.ok) {
    throw new Error(`Could not fetch Google Fonts catalog: HTTP ${response.status}`);
  }

  return parser(response);
}

function normalizeFamilies(payload, sourceKind) {
  if (sourceKind === "developer-api") {
    return (payload.items || []).map((family) => normalizeDeveloperApiFamily(family)).sort(sortFamily);
  }

  return (payload.familyMetadataList || []).map((family) => normalizeMetadataFamily(family)).sort(sortFamily);
}

function normalizeDeveloperApiFamily(family) {
  return prune({
    family: family.family,
    category: family.category,
    subsets: sorted(family.subsets),
    variants: sorted(family.variants),
    axes: normalizeAxes(family.axes),
    designers: [],
    lastModified: family.lastModified,
    version: family.version,
    files: family.files ? Object.keys(family.files).sort() : [],
    popularity: null,
    trending: null,
    dateAdded: null,
    isNoto: null,
    isOpenSource: null,
    source: "developer-api"
  });
}

function normalizeMetadataFamily(family) {
  return prune({
    family: family.family,
    category: family.category,
    subsets: sorted(family.subsets),
    variants: Object.keys(family.fonts || {}).sort(compareVariant),
    axes: normalizeAxes(family.axes),
    designers: sorted(family.designers),
    lastModified: family.lastModified,
    version: null,
    files: [],
    popularity: family.popularity ?? null,
    trending: family.trending ?? null,
    dateAdded: family.dateAdded ?? null,
    isNoto: family.isNoto ?? null,
    isOpenSource: family.isOpenSource ?? null,
    source: "fonts-metadata"
  });
}

function normalizeAxes(axes = []) {
  return axes
    .map((axis) => prune({
      tag: axis.tag,
      min: axis.min,
      max: axis.max,
      defaultValue: axis.defaultValue
    }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = item[key] || "Unknown";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function sorted(values = []) {
  return [...values].filter(Boolean).sort((a, b) => String(a).localeCompare(String(b)));
}

function compareVariant(a, b) {
  const weightA = Number.parseInt(a, 10);
  const weightB = Number.parseInt(b, 10);
  if (weightA !== weightB) {
    return weightA - weightB;
  }
  return a.localeCompare(b);
}

function sortFamily(a, b) {
  return a.family.localeCompare(b.family);
}

function prune(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  );
}
