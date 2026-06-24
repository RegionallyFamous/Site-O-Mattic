import fs from "node:fs/promises";

export async function readBlueprint(target) {
  return JSON.parse(await fs.readFile(target, "utf8"));
}

export function getRunPhpStep(blueprint) {
  return blueprint.steps?.find((step) => step.step === "runPHP") || null;
}

export function extractGlobalStyles(phpCode) {
  const raw = extractPhpStringAssignment(phpCode, "$global_styles");
  return raw ? JSON.parse(raw) : null;
}

export function extractCustomCss(phpCode) {
  return extractPhpStringAssignment(phpCode, "$custom_css") || "";
}

export function extractPageContent(phpCode) {
  return extractPhpStringAssignment(phpCode, "$content_template") || "";
}

export function extractLayoutSignature(phpCode) {
  const raw = extractPhpStringAssignment(phpCode, "$site_o_mattic_layout_signature_json");
  return raw ? JSON.parse(raw) : null;
}

export function extractPhpStringAssignment(phpCode, variableName) {
  const assignmentStart = phpCode.indexOf(`${variableName} = `);
  if (assignmentStart === -1) {
    return null;
  }

  const quoteStart = phpCode.indexOf("'", assignmentStart);
  if (quoteStart === -1) {
    return null;
  }

  let value = "";
  let escaped = false;

  for (let index = quoteStart + 1; index < phpCode.length; index += 1) {
    const char = phpCode[index];
    if (escaped) {
      value += char;
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === "'") {
      return value;
    }
    value += char;
  }

  return null;
}

export function extractBlockNames(markup) {
  return [...markup.matchAll(/<!--\s+wp:([a-z0-9-]+)/g)].map((match) => match[1]);
}

export function extractHrefTargets(markup) {
  return [...markup.matchAll(/\bhref=(["'])#([^"']+)\1/g)].map((match) => match[2]);
}

export function extractElementIds(markup) {
  return new Set([...markup.matchAll(/\bid=(["'])([^"']+)\1/g)].map((match) => match[2]));
}

export function contrastRatio(hexA, hexB) {
  const a = relativeLuminance(hexToRgb(hexA));
  const b = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "").trim();
  const value = normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized;
  const number = Number.parseInt(value, 16);
  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255
  };
}

function relativeLuminance({ r, g, b }) {
  return [r, g, b]
    .map((channel) => {
      const value = channel / 255;
      return value <= 0.03928
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    })
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
}
