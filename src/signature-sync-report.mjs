import { extractGlobalStyles, extractLayoutSignature, getRunPhpStep, readBlueprint } from "./blueprint-inspect.mjs";
import { blueprintPathForSpec, readSpec, specTargets } from "./spec-utils.mjs";

const targets = await specTargets();
let hasFailures = false;
const SIGNATURE_PATTERN_FIELDS = [
  ["primaryPattern", "primaryPattern", "scalar"],
  ["secondaryPattern", "secondaryPattern", "scalar"],
  ["silhouette", "silhouette", "scalar"],
  ["navigationPrimitive", "navigationPrimitive", "scalar"],
  ["mobileActionPattern", "mobileActionPattern", "scalar"],
  ["imageRole", "imageRole", "scalar"],
  ["imageEvidence", "imageEvidence", "scalar"],
  ["ctaRhythm", "ctaRhythmPattern", "scalar"],
  ["surfaceFamily", "surfaceFamily", "scalar"],
  ["surfaceModel", "surfaceModel", "scalar"],
  ["styleFamily", "styleFamily", "scalar"],
  ["density", "density", "scalar"],
  ["colorRoles", "colorRoles", "object"],
  ["geometry", "geometry", "object"],
  ["coreBlockPlan", "coreBlockPlan", "array"],
  ["styleContract", "styleContract", "scalar"],
  ["knownRisks", "knownRisks", "array"]
];
const GLOBAL_PATTERN_FIELDS = SIGNATURE_PATTERN_FIELDS.map(([specField, signatureField, kind]) => [
  specField,
  specField === "ctaRhythm" ? "ctaRhythm" : signatureField,
  kind
]);

console.log("\nBlueprint signature sync report");

for (const specPath of targets) {
  const spec = await readSpec(specPath);
  const blueprintPath = blueprintPathForSpec(spec);
  const result = await inspectSync(specPath, spec, blueprintPath);
  printResult(result);
  if (result.failures.length) {
    hasFailures = true;
  }
}

if (hasFailures) {
  process.exit(1);
}

async function inspectSync(specPath, spec, blueprintPath) {
  const failures = [];
  let blueprint;

  try {
    blueprint = await readBlueprint(blueprintPath);
  } catch (error) {
    return {
      specPath,
      blueprintPath,
      failures: [`Could not read generated Blueprint: ${error.message}`]
    };
  }

  const phpStep = getRunPhpStep(blueprint);
  if (!phpStep) {
    return {
      specPath,
      blueprintPath,
      failures: ["Missing runPHP setup step."]
    };
  }

  let signature;
  try {
    signature = extractLayoutSignature(phpStep.code);
  } catch (error) {
    failures.push(`Could not parse layout signature: ${error.message}`);
  }

  if (!signature) {
    failures.push("Missing layout signature.");
  } else {
    compare("layoutVariant", spec.layoutVariant, signature.variant, failures);
    comparePatternFields("pattern", spec.pattern, signature, SIGNATURE_PATTERN_FIELDS, failures);
  }

  let globalStyles;
  try {
    globalStyles = extractGlobalStyles(phpStep.code);
  } catch (error) {
    failures.push(`Could not parse global styles: ${error.message}`);
  }

  const globalPattern = globalStyles?.settings?.custom?.som?.pattern;
  if (!globalPattern) {
    failures.push("Global styles missing settings.custom.som.pattern.");
  } else {
    comparePatternFields("global pattern", spec.pattern, globalPattern, GLOBAL_PATTERN_FIELDS, failures);
  }

  return { specPath, blueprintPath, failures };
}

function comparePatternFields(prefix, specPattern, targetPattern, fields, failures) {
  for (const [specField, targetField, kind] of fields) {
    const label = `${prefix}.${specField}`;
    if (kind === "array") {
      compareArray(label, specPattern?.[specField], targetPattern?.[targetField], failures);
    } else if (kind === "object") {
      compareObject(label, specPattern?.[specField], targetPattern?.[targetField], failures);
    } else {
      compare(label, specPattern?.[specField], targetPattern?.[targetField], failures);
    }
  }
}

function compare(label, expected, actual, failures) {
  if (expected !== actual) {
    failures.push(`${label} mismatch: spec=${display(expected)} blueprint=${display(actual)}`);
  }
}

function compareArray(label, expected, actual, failures) {
  const expectedArray = Array.isArray(expected) ? expected : [];
  const actualArray = Array.isArray(actual) ? actual : [];
  if (expectedArray.length !== actualArray.length || expectedArray.some((value, index) => value !== actualArray[index])) {
    failures.push(`${label} mismatch: spec=${JSON.stringify(expectedArray)} blueprint=${JSON.stringify(actualArray)}`);
  }
}

function compareObject(label, expected, actual, failures) {
  if (JSON.stringify(expected || {}) !== JSON.stringify(actual || {})) {
    failures.push(`${label} mismatch: spec=${JSON.stringify(expected || {})} blueprint=${JSON.stringify(actual || {})}`);
  }
}

function display(value) {
  return value === undefined ? "missing" : JSON.stringify(value);
}

function printResult(result) {
  if (result.failures.length) {
    console.log(`\nFAIL ${result.specPath} -> ${result.blueprintPath}`);
    for (const failure of result.failures) {
      console.log(`- ${failure}`);
    }
    return;
  }

  console.log(`OK ${result.specPath} -> ${result.blueprintPath}`);
}
