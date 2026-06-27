import fs from "node:fs/promises";
import { renderFamilyForVariant } from "./layout-archetypes.mjs";
import { readSpec, specTargets } from "./spec-utils.mjs";

const REQUIRED_BRAND_BRIEF_FIELDS = [
  "mood",
  "trustCue",
  "accentBehavior",
  "imageProof",
  "signatureMove",
  "avoidLookingLike"
];

const REQUIRED_SERVICE_DETAIL_FIELDS = [
  "turnaround",
  "whatToSend",
  "prepNote",
  "serviceRhythm",
  "objectionAnswer"
];

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const targetArgs = args.filter((arg) => arg !== "--write");
  const targets = await specTargets(targetArgs);
  let hasFailures = false;

  for (const target of targets) {
    const spec = await readSpec(target);
    if (write) {
      spec.brandBrief = buildBrandBrief(spec);
      spec.serviceDetails = buildServiceDetails(spec);
      await fs.writeFile(target, `${JSON.stringify(spec, null, 2)}\n`);
      console.log(`Updated production polish fields for ${target}`);
      continue;
    }

    const errors = validateProductionPolishFields(spec);
    if (errors.length) {
      hasFailures = true;
      console.log(`Production polish fields failed for ${target}`);
      for (const error of errors) {
        console.log(`- ${error}`);
      }
    } else {
      console.log(`Production polish fields OK for ${target}`);
    }
  }

  if (hasFailures) {
    process.exit(1);
  }
}

export function buildBrandBrief(spec) {
  const styleContract = spec.pattern?.styleContract || "";
  const [moodFragment, afterWith = ""] = styleContract.split(/\s+with\s+/i);
  const signatureMove = extractSignatureMove(styleContract) || humanize(spec.pattern?.surfaceModel || spec.layoutVariant);
  const trustCue = firstClause(afterWith) || humanize(spec.pattern?.secondaryPattern || "specific service proof");
  const actionRole = spec.pattern?.colorRoles?.action || "action";

  return {
    mood: sentence(moodFragment || humanize(spec.pattern?.styleFamily || spec.niche)),
    trustCue: sentence(trustCue),
    accentBehavior: sentence(`${humanize(actionRole)} stays reserved for ${spec.copy?.primaryCta || "the primary action"}, active proof cues, and key booking moments`),
    imageProof: sentence(spec.pattern?.imageEvidence || spec.assetMeta?.hero?.alt || `real ${spec.niche} evidence`),
    signatureMove: sentence(signatureMove),
    avoidLookingLike: sentence(`Avoid a generic ${renderFamilyForVariant(spec.layoutVariant)} recolor; do not repeat stock hero framing, copied card rhythm, or vague local-service claims`)
  };
}

export function buildServiceDetails(spec) {
  const archetype = contentArchetypeFor(spec);
  const firstProof = spec.proof?.[0] ? `${spec.proof[0].stat}: ${spec.proof[0].label}` : "";
  const rhythm = spec.pattern?.ctaRhythm || spec.pattern?.primaryPattern || "service flow";

  return {
    turnaround: sentence(buildTurnaroundDetail(spec, archetype, firstProof)),
    whatToSend: sentence(buildWhatToSend(spec, archetype)),
    prepNote: sentence(spec.process?.[0]?.text || spec.copy?.introText || ""),
    serviceRhythm: sentence(buildServiceRhythm(spec, archetype, rhythm)),
    objectionAnswer: sentence(buildObjectionAnswer(spec, archetype))
  };
}

export function validateProductionPolishFields(spec) {
  const errors = [];

  validateTextObject(spec.brandBrief, "brandBrief", REQUIRED_BRAND_BRIEF_FIELDS, 18, errors, {
    mood: 12,
    trustCue: 10,
    signatureMove: 10
  });
  validateTextObject(spec.serviceDetails, "serviceDetails", REQUIRED_SERVICE_DETAIL_FIELDS, 28, errors);

  if (spec.brandBrief?.signatureMove && !/signature|board|rail|dock|menu|receipt|ledger|gallery|proof|ticket|timeline|flow|cards?|bench|strip|map|grid|console|panel|sidecar|shell|planner|stage|stack|note|checklist|table|swatch|palette|rows?|bar/i.test(spec.brandBrief.signatureMove)) {
    errors.push("brandBrief.signatureMove should name a visible layout feature.");
  }
  if (spec.brandBrief?.imageProof && !hasAnySharedWord(spec.brandBrief.imageProof, `${spec.pattern?.imageEvidence || ""} ${spec.assetMeta?.hero?.alt || ""}`)) {
    errors.push("brandBrief.imageProof should align with pattern.imageEvidence or hero alt text.");
  }
  if (spec.serviceDetails?.whatToSend && !/\b(send|share|tell|include|date|photo|call|email|venue|access|size|window|photos|scope|count|guest|guests|palette|timing|timeline|checkout|lock|laundry|menu|headcount|event|surface|project|bike|vehicle|yard|home|room|address|role|usage|decision|family|package)\b/i.test(spec.serviceDetails.whatToSend)) {
    errors.push("serviceDetails.whatToSend should include a concrete visitor instruction.");
  }
  if (sameNormalizedSentence(spec.serviceDetails?.whatToSend, spec.copy?.quoteText)) {
    errors.push("serviceDetails.whatToSend should be source QA detail, not a copy of copy.quoteText.");
  }
  if (spec.serviceDetails?.objectionAnswer && /\b(scope, access, timing, and fit|photos are enough for the first pass|guest count, venue rules|condition, dimensions, materials, and use case)\b/i.test(spec.serviceDetails.objectionAnswer)) {
    errors.push("serviceDetails.objectionAnswer should be archetype-specific, not a broad bucket template.");
  }
  if (spec.serviceDetails?.objectionAnswer && !/\b(access|photos?|surface|date|venue|guest|route|weather|power|water|room|window|handoff|report|materials?|finish|ladder|roofline|proof|timing|cadence|prep|risk|scope|package|fit|decision)\b/i.test(spec.serviceDetails.objectionAnswer)) {
    errors.push("serviceDetails.objectionAnswer should name at least one concrete operating detail.");
  }

  return errors;
}

export function requiredBrandBriefFields() {
  return [...REQUIRED_BRAND_BRIEF_FIELDS];
}

export function requiredServiceDetailFields() {
  return [...REQUIRED_SERVICE_DETAIL_FIELDS];
}

function validateTextObject(value, name, fields, minLength, errors, minimums = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${name} is required.`);
    return;
  }
  for (const field of fields) {
    const text = value[field];
    if (typeof text !== "string" || text.trim().length < (minimums[field] || minLength)) {
      errors.push(`${name}.${field} must be a useful sentence.`);
    }
  }
}

function extractSignatureMove(styleContract) {
  const match = String(styleContract).match(/,\s*and\s+(.+?)\s+as the signature move/i);
  return match?.[1] || "";
}

function firstClause(value) {
  return String(value || "").split(",")[0].trim();
}

function sentence(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) {
    return "";
  }
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function sameNormalizedSentence(left, right) {
  const normalize = (value) => String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
  const leftText = normalize(left);
  const rightText = normalize(right);
  return Boolean(leftText && rightText && leftText === rightText);
}

function humanize(value) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildTurnaroundDetail(spec, archetype, firstProof) {
  if (firstProof) {
    return firstProof;
  }
  const action = spec.copy?.primaryCta || "the first contact";
  const detail = {
    "photo-to-plan": "Photos turn into a method, risk note, and next available window before anything is scheduled",
    "date-window": "Date checks come back with setup timing, hold status, and the package that fits the room",
    "route-fit": "Route replies confirm cadence, access, and the next realistic service stop",
    "receipt-scope": "Scope replies separate included work, access needs, add-ons, and reporting before the handoff",
    "calm-consult": "Consult replies set pace, priorities, and the smallest useful next step",
    "risk-check": "Risk replies name safe access, weather limits, and what not to touch before the visit",
    "menu-board": "Menu replies compare guest flow, footprint, service style, and host workload"
  }[archetype];
  return detail || `Reply path is set by ${action}`;
}

function buildWhatToSend(spec, archetype) {
  const profile = serviceDetailProfile(spec);
  if (profile?.whatToSend) {
    return profile.whatToSend;
  }

  const niche = spec.niche || spec.businessName || "service";
  const map = {
    "photo-to-plan": `Send 3 to 5 photos of the ${niche} surface or item, the access point, close-up problem spots, and the timing window you are hoping for.`,
    "date-window": "Share the event date, venue or address, guest count, setup window, power/water rules, and the package style you are considering.",
    "route-fit": "Send your address or neighborhood, access notes, preferred cadence, photos when useful, and any skip conditions before joining the route.",
    "receipt-scope": "Share the address or room context, access rules, must-include items, optional add-ons, and where the finished report or handoff should go.",
    "calm-consult": "Tell us the room, decision pressure, preferred pace, photos or inspiration, and what would make the next step feel manageable.",
    "risk-check": "Send photos from the ground, access notes, weather or date constraints, and the warning signs you noticed so the visit starts safely.",
    "menu-board": "Share the date, guest count, venue footprint, service window, menu preferences, and host workload you want to avoid."
  };
  return map[archetype] || `Share the project scope, timing, access notes, and the best way to reply about ${niche}.`;
}

function buildServiceRhythm(spec, archetype, rhythm) {
  const profile = serviceDetailProfile(spec);
  if (profile?.serviceRhythm) {
    return profile.serviceRhythm;
  }

  const serviceArea = spec.contact?.serviceArea || spec.niche || "the local service area";
  const identity = specIdentityHaystack(spec);
  if (archetype === "menu-board" && /\b(auto|detailing|vehicle|car|truck|suv)\b/.test(identity)) {
    return `Package-board flow for ${serviceArea}: compare fit by vehicle size, interior condition, paint needs, access, and arrival window.`;
  }
  const map = {
    "photo-to-plan": `Photo-to-plan flow for ${serviceArea}: first the evidence, then method, timing, and risk notes.`,
    "date-window": `Date-window flow for ${serviceArea}: date fit, setup rules, guest flow, and hold status come before package pressure.`,
    "route-fit": `Route-fit flow for ${serviceArea}: cadence, access, skip rules, and first-visit notes make the route realistic.`,
    "receipt-scope": `Receipt-scope flow for ${serviceArea}: included work, access, add-ons, and proof notes stay visible before handoff.`,
    "calm-consult": `Calm-consult flow for ${serviceArea}: priorities, pace, decision support, and next steps stay intentionally small.`,
    "risk-check": `Risk-check flow for ${serviceArea}: photos, weather, access, and no-go conditions shape the safe visit plan.`,
    "menu-board": `Menu-board flow for ${serviceArea}: compare package fit by guest movement, footprint, timing, and cleanup load.`
  };
  return map[archetype] || `${humanize(rhythm)} for ${serviceArea}`;
}

function buildObjectionAnswer(spec, archetype = contentArchetypeFor(spec)) {
  const profile = serviceDetailProfile(spec);
  if (profile?.objectionAnswer) {
    return profile.objectionAnswer;
  }

  const haystack = specHaystack(spec);
  const identity = specIdentityHaystack(spec);
  const niche = spec.niche || spec.businessName || "service";

  if (archetype === "risk-check") {
    if (/\b(gutter|downspout)\b/.test(identity)) {
      return `For ${niche}, roof height, gutter runs, downspout locations, ladder reach, and debris level shape the quote before a crew is scheduled.`;
    }
    if (/\b(driveway|sealcoating)\b/.test(identity)) {
      return `For ${niche}, surface photos, crack edges, shade timing, and cure-window weather decide the quote, so the plan names what can be sealed now and what should wait.`;
    }
    if (/\b(solar|panel)\b/.test(identity)) {
      return `For ${niche}, panel count, roof pitch, water access, production dips, and safe reach are checked first, so nobody guesses from the driveway.`;
    }
    if (/\b(holiday|roofline|light)\b/.test(identity)) {
      return `For ${niche}, roofline photos, outlet locations, ladder reach, timers, and takedown timing shape the plan before a date is promised.`;
    }
    return `For ${niche}, ground photos, weather timing, roofline access, and ladder reach are checked first, so the quote can name safe access without asking you to climb.`;
  }
  if (archetype === "date-window") {
    if (/\b(coffee|mocktail|pizza|taco|dessert|catering|cart|bar|menu)\b/.test(identity)) {
      return `For ${niche}, guest count, menu pace, service footprint, prep access, and cleanup timing are matched before the package is recommended.`;
    }
    if (/\b(balloon|photo booth|dj|sound|backdrop|booth)\b/.test(identity)) {
      return `For ${niche}, venue load-in, power, backdrop or sound footprint, guest flow, and teardown timing are checked before the date is held.`;
    }
    if (/\b(wedding|floral|picnic|proposal|venue|style)\b/.test(identity)) {
      return `For ${niche}, date fit, venue rules, palette direction, guest movement, and setup window are confirmed before the look gets locked.`;
    }
    return `For ${niche}, the date is not treated as held until guest count, venue load-in, power or water needs, service footprint, and teardown timing match the package.`;
  }
  if (archetype === "route-fit") {
    if (/\b(lawn|yard|mowing)\b/.test(identity)) {
      return `For ${niche}, yard size, gate access, mowing cadence, edging needs, clippings, and weather windows are checked before the first route day is set.`;
    }
    if (/\b(bicycle|bike|commuter)\b/.test(identity)) {
      return `For ${niche}, bike photos, tire size, symptoms, access spot, and route window are confirmed before the mobile stand gets added to the day.`;
    }
    if (/\b(knife|sharpening|edge)\b/.test(identity)) {
      return `For ${niche}, item count, blade condition, pickup access, and what should skip the bench are confirmed before the route stop is booked.`;
    }
    if (/\b(pool|water|skimming|filter)\b/.test(identity)) {
      return `For ${niche}, gate access, water condition, equipment photos, route cadence, and storm/debris notes are checked before weekly service starts.`;
    }
    if (/\b(plant|houseplant|watering)\b/.test(identity)) {
      return `For ${niche}, plant count, room light, watering history, access, and skip dates shape the first route before a care cadence is set.`;
    }
    return `For ${niche}, access, cadence, skip conditions, and first-visit proof are confirmed before the route spot is added to a service day.`;
  }
  if (archetype === "receipt-scope") {
    if (/\b(turnover|rental|checkout|linen)\b/.test(haystack)) {
      return `For ${niche}, checkout time, lock access, linen rules, restock list, add-ons, and photo proof are written into the handoff before coverage starts.`;
    }
    if (/\b(headshot|photography|session)\b/.test(haystack)) {
      return `For ${niche}, usage, roles, background needs, proof timing, and delivery format are scoped before anyone picks a session lane.`;
    }
    if (/\b(smart home|tv|wi-fi|wifi|device)\b/.test(haystack)) {
      return `For ${niche}, device names, room photos, Wi-Fi notes, cable paths, and what should be simplified are scoped before setup day.`;
    }
    return `For ${niche}, included work, access needs, add-ons, and proof or report expectations are written like a handoff before the job is complete.`;
  }
  if (archetype === "calm-consult") {
    if (/\b(pet|portrait)\b/.test(identity)) {
      return `For ${niche}, pet temperament, location comfort, session pace, family groupings, and proof timing are set before a portrait path is picked.`;
    }
    if (/\b(pollinator|garden)\b/.test(identity)) {
      return `For ${niche}, sun exposure, bed size, bloom timing, watering reality, and existing plants shape the first refresh plan.`;
    }
    if (/\b(garage|closet|pantry|organization|storage)\b/.test(identity)) {
      return `For ${niche}, photos, parking or storage priorities, keep/toss boundaries, and install appetite define the first useful zone instead of a giant reset.`;
    }
    if (/\b(downsizing|move|senior|family)\b/.test(identity)) {
      return `For ${niche}, timeline, family decision pace, sensitive rooms, and donation or packing needs set the first step before any large package is suggested.`;
    }
    if (/\b(color|consult|palette|room)\b/.test(identity)) {
      return `For ${niche}, room light, fixed finishes, inspiration, sample timing, and decision pressure shape the consult before colors are narrowed.`;
    }
    return `For ${niche}, pace, decision comfort, room context, and the smallest useful scope are set first, so the plan feels guided instead of pushy.`;
  }
  if (archetype === "menu-board") {
    if (/\b(auto|detailing|vehicle|car|truck|suv)\b/.test(identity)) {
      return `For ${niche}, package fit depends on vehicle size, interior condition, paint sensitivity, driveway access, and weather window, so the detail level matches the actual car.`;
    }
    return `For ${niche}, package fit depends on guest flow, venue footprint, service window, power or prep access, and cleanup load, so the menu matches how the event will actually move.`;
  }
  if (archetype === "photo-to-plan") {
    if (/\b(junk|hauling|donation|cleanout|clean-out)\b/.test(identity)) {
      return `For ${niche}, pile photos, stairs or elevator access, donation-worthy items, truck space, and sweep-up expectations shape the estimate before pickup.`;
    }
    if (/\b(deck|fence|stain)\b/.test(identity)) {
      return `For ${niche}, wood condition, board or picket length, previous finish, plant protection, and dry-weather window decide the stain plan before the quote is set.`;
    }
    if (/\b(furniture|refinish|repair|wood|finish)\b/.test(identity)) {
      return `For ${niche}, condition photos, dimensions, finish goals, loose joints, and sentimental constraints decide whether the repair path is simple or needs a closer look.`;
    }
    if (/\b(carpet|upholstery|fabric|stain)\b/.test(identity)) {
      return `For ${niche}, fabric photos, stain age, room access, drying expectations, and delicate areas decide the method before the appointment window is set.`;
    }
    if (/\b(window cleaning|window-cleaning|window count|shine quote|inside, outside|screens?|tracks?)\b/.test(identity)) {
      return `For ${niche}, window count, tall glass photos, inside/outside scope, screens, tracks, and access notes shape the estimate before the shine day is booked.`;
    }
    if (/\b(auto|detailing|vehicle|car|truck|suv)\b/.test(identity)) {
      return `For ${niche}, vehicle photos, interior trouble spots, paint condition, driveway access, and weather window decide the package before arrival.`;
    }
    if (/\b(mural|lettering|window|artist|paint)\b/.test(identity)) {
      return `For ${niche}, surface photos, dimensions, visibility, install timing, and message needs shape the concept before paint or vinyl-style expectations creep in.`;
    }
    return `For ${niche}, photos choose the method, flag delicate surfaces or materials, name drying or cure timing, and call out anything that needs an in-person check.`;
  }

  if (/\b(gutter|roof|solar|holiday|roofline)\b/.test(haystack)) {
    return `Ground photos, weather timing, roofline access, and ladder reach are checked first, so the quote can name safe access without asking you to climb.`;
  }
  if (/\b(catering|coffee|mocktail|pizza|taco|dessert|balloon|photo booth|dj|sound|wedding|floral|picnic|proposal|event|venue)\b/.test(haystack)) {
    return `Guest flow, venue footprint, setup window, power or prep access, and teardown timing are confirmed before a package is recommended.`;
  }
  if (/\b(furniture|refinish|repair|mural|lettering|artist|knife|sharpening|bicycle|bike)\b/.test(haystack)) {
    return `Condition photos, materials, finish risk, access, and how the item will be used are checked before the work path is recommended.`;
  }
  if (/\b(closet|pantry|garage|organization|downsizing|move|plant|pollinator|garden|color|consult|smart home|portrait|headshot|pet)\b/.test(haystack)) {
    return `Room context, priorities, decision pace, access, and comfort level shape the first plan, so the next step stays useful and not pushy.`;
  }
  if (/\b(pool|lawn)\b/.test(haystack) || spec.pattern?.ctaRhythm === "route-join") {
    return `Route timing, property access, service cadence, weather limits, and first-visit notes are confirmed before the first visit is added.`;
  }
  if (/\b(carpet|upholstery|pressure|washing|driveway|sealcoating|staining|deck|fence|detailing|window|cleaning|turnover)\b/.test(haystack)) {
    return `Surface photos, access, water or power needs, material sensitivity, and drying or cure timing are checked before the work window is scheduled.`;
  }
  return `The first reply confirms scope, access, concrete timing, and proof expectations before booking, so the next step stays clear and low-pressure.`;
}

function serviceDetailProfile(spec) {
  const slug = spec.slug || "";
  const serviceArea = spec.contact?.serviceArea || spec.niche || "the local service area";
  const niche = spec.niche || spec.businessName || "service";
  const profiles = {
    "balloon-garland-party-backdrop": {
      whatToSend: "Share the event date, venue, wall or ceiling width, attachment rules, setup window, palette references, guest flow, and whether teardown is needed.",
      serviceRhythm: `Date-window flow for ${serviceArea}: wall width, venue rules, install timing, guest flow, and teardown come before package pressure.`,
      objectionAnswer: "For balloon garland and party backdrop styling, attachment rules, ceiling or wall access, backdrop width, guest-photo flow, and teardown timing are checked before the date is held."
    },
    "photo-booth-rental": {
      whatToSend: "Share the event date, venue, guest count, setup window, outlet access, 6-by-8-foot booth corner, backdrop preference, prop needs, and print or digital delivery choice.",
      serviceRhythm: `Date-window flow for ${serviceArea}: date fit, outlet access, booth footprint, guest flow, and gallery or print needs come before deposit pressure.`,
      objectionAnswer: "For photo booth rental service, outlet access, 6-by-8-foot booth footprint, backdrop placement, prop table, guest line flow, print timing, and breakdown rules are checked before the date is held."
    },
    "small-event-dj-sound": {
      whatToSend: "Share the event date, venue, room shape, guest count, load-in window, outlet or circuit access, microphone count, playlist tone, and any noise-limit rules.",
      serviceRhythm: `Date-window flow for ${serviceArea}: room shape, power, mic count, load-in, volume limits, and music flow come before package pressure.`,
      objectionAnswer: "For small-event DJ and sound service, outlet or circuit access, load-in route, speaker placement, microphone count, room shape, playlist boundaries, and noise limits are checked before the date is held."
    },
    "headshot-brand-photography": {
      whatToSend: "Share your role, photo usage, deadline, headcount, background preference, wardrobe questions, retouch comfort, and any brand examples or team scheduling needs.",
      serviceRhythm: `Receipt-scope flow for ${serviceArea}: role, usage, background, wardrobe, retouch comfort, and delivery format stay visible before booking.`,
      objectionAnswer: "For headshot and brand photography studio, usage, roles, headcount, background needs, wardrobe, proof timing, and delivery format are scoped before anyone picks a session lane."
    },
    "pollinator-garden-refresh": {
      whatToSend: "Send bed photos from a few angles, sun hours, rough dimensions, soil or drainage notes, watering access, existing plants, and any colors or maintenance limits.",
      serviceRhythm: `Calm-consult flow for ${serviceArea}: sun, soil, bed size, existing plants, watering reality, and maintenance appetite shape a small first plan.`,
      objectionAnswer: "For pollinator garden refresh service, sun exposure, bed size, soil or drainage notes, bloom timing, watering reality, and existing plants shape the first refresh plan."
    },
    "pet-portrait-photography": {
      whatToSend: "Share pet type, age, temperament, mobility or handling notes, favorite rewards, family grouping needs, location preference, and a few portrait examples you like.",
      serviceRhythm: `Calm-consult flow for ${serviceArea}: temperament, comfort, rewards, groupings, and location fit shape the portrait day.`,
      objectionAnswer: "For pet portrait photography studio, pet temperament, mobility, favorite rewards, location comfort, family groupings, session pace, and proof timing are set before a portrait path is picked."
    },
    "closet-pantry-organization": {
      whatToSend: "Send wide photos, shelf or closet measurements, pain points, household habits, donation boundaries, container preferences, and who uses the space most.",
      serviceRhythm: `Calm-consult flow for ${serviceArea}: photos, shelf measurements, habits, keep or donate boundaries, and maintenance appetite keep the first reset useful.`,
      objectionAnswer: "For closet and pantry organization service, photos, shelf measurements, storage priorities, keep or donate boundaries, and install appetite define the first useful zone instead of a giant reset."
    },
    "garage-organization": {
      whatToSend: "Send wide wall photos, ceiling height, parking goals, bulky gear notes, keep or donate boundaries, and the zones that need floor space first.",
      serviceRhythm: `Calm-consult flow for ${serviceArea}: wall photos, ceiling height, parking lanes, bulky gear, and storage habits decide the first useful zone.`,
      objectionAnswer: "For garage organization service, wall photos, ceiling height, parking lanes, bulky gear, keep or donate boundaries, and install appetite define the first useful zone instead of a giant reset."
    },
    "interior-color-consultant": {
      whatToSend: "Send room photos, daylight direction, fixed finishes, current paint questions, inspiration images, sample timing, and the decisions that feel stuck.",
      serviceRhythm: `Calm-consult flow for ${serviceArea}: room light, fixed finishes, undertones, sample timing, and decision comfort shape the consult before colors are narrowed.`,
      objectionAnswer: "For interior color consultant, room light, fixed finishes, undertones, inspiration, sample timing, and decision comfort shape the consult before colors are narrowed."
    },
    "dessert-table-bakery-catering": {
      whatToSend: "Share the event date, guest count, venue table size, setup window, palette, favorite flavors, dietary notes, and whether service or delivery-only support is needed.",
      serviceRhythm: `Date-window flow for ${serviceArea}: guest count, table size, palette, flavors, setup timing, and freshness window come before package pressure.`,
      objectionAnswer: "For dessert table and bakery catering, guest count, table size, menu pace, freshness window, dietary notes, and cleanup timing are matched before the package is recommended."
    },
    "picnic-proposal-setup": {
      whatToSend: "Share the date, location idea, guest count, occasion, color direction, access rules, setup window, weather concerns, and add-ons you are considering.",
      serviceRhythm: `Date-window flow for ${serviceArea}: date fit, location rules, access, shade, weather backup, guest movement, and reveal timing come before package pressure.`,
      objectionAnswer: "For picnic and proposal setup service, date fit, location rules, access, shade, weather backup, palette direction, guest movement, and setup window are confirmed before the look gets locked."
    },
    "senior-downsizing-move-prep": {
      whatToSend: "Share the move timeline, rooms involved, family decision makers, keepsake boundaries, donation or packing needs, access notes, and the first area that feels hardest.",
      serviceRhythm: `Calm-consult flow for ${serviceArea}: timeline, sensitive rooms, family decision pace, donation boundaries, and packing needs set the first useful step.`,
      objectionAnswer: "For senior downsizing and move prep, timeline, family decision pace, sensitive rooms, keepsake boundaries, and donation or packing needs set the first step before any large package is suggested."
    }
  };

  if (profiles[slug]) {
    return profiles[slug];
  }

  if (/mural-window-lettering-artist/.test(slug)) {
    return {
      whatToSend: `Send 3 to 5 photos of the ${niche} surface, dimensions, viewing distance, access point, message needs, brand colors, and the timing window you are hoping for.`,
      serviceRhythm: `Photo-to-plan flow for ${serviceArea}: first the surface evidence, then dimensions, visibility, concept direction, access, and install timing.`,
      objectionAnswer: `For ${niche}, surface photos, dimensions, visibility, install timing, and message needs shape the concept before paint or vinyl-style expectations creep in.`
    };
  }

  if (/furniture-refinishing-repair/.test(slug)) {
    return {
      whatToSend: `Send 3 to 5 photos of the ${niche} item, dimensions, close-up damage, finish goals, loose-joint notes, pickup or drop-off needs, and timing window.`,
      serviceRhythm: `Photo-to-plan flow for ${serviceArea}: first the condition evidence, then material risk, finish goals, timing, and pickup or drop-off notes.`,
      objectionAnswer: `For ${niche}, condition photos, dimensions, finish goals, loose joints, and sentimental constraints decide whether the repair path is simple or needs a closer look.`
    };
  }

  return null;
}

function contentArchetypeFor(spec) {
  const haystack = specHaystack(spec);
  const identity = specIdentityHaystack(spec);

  if (/\b(gutter|roof|solar|holiday|roofline|sealcoating)\b/.test(identity)) {
    return "risk-check";
  }
  if (/\b(catering|coffee|mocktail|pizza|taco|dessert|balloon|photo booth|dj|sound|wedding|floral|picnic|proposal|event|venue)\b/.test(identity)) {
    return "date-window";
  }
  if (spec.pattern?.ctaRhythm === "photo-first") {
    return "photo-to-plan";
  }
  if (/\b(lawn|pool|plant care|houseplant|sharpening|knife|bicycle|bike repair|commuter bike|recurring)\b/.test(identity)
    || spec.pattern?.ctaRhythm === "route-join"
    || (spec.pattern?.ctaRhythm === "book-first" && /\b(bicycle|bike repair|commuter bike|repair route|route-day)\b/.test(identity))) {
    return "route-fit";
  }
  if (/\b(window|glass|pane|squeegee)\b/.test(identity)) {
    return "photo-to-plan";
  }
  if (/\b(turnover|rental|solar|headshot|smart home|receipt|ledger|report|checkout)\b/.test(identity)) {
    return "receipt-scope";
  }
  if (/\b(downsizing|move|color|consult|organization|closet|pantry|garage|portrait|pet|pollinator|garden)\b/.test(identity)) {
    return "calm-consult";
  }
  if (/\b(menu|package|guest|cart|booth)\b/.test(identity) || spec.pattern?.ctaRhythm === "package-select") {
    return "menu-board";
  }
  if (/\b(photo|surface|stain|clean|wash|repair|refinish|detailing|window|carpet|upholstery|deck|fence|mural|lettering)\b/.test(haystack) || spec.pattern?.ctaRhythm === "photo-first") {
    return "photo-to-plan";
  }
  return "photo-to-plan";
}

function specHaystack(spec) {
  return [
    spec.slug,
    spec.niche,
    spec.businessName,
    spec.pattern?.primaryPattern,
    spec.pattern?.secondaryPattern,
    spec.pattern?.imageEvidence,
    spec.pattern?.ctaRhythm,
    spec.pattern?.surfaceFamily,
    spec.pattern?.surfaceModel,
    spec.copy?.heroTitle,
    spec.copy?.quoteText,
    ...(spec.services || []).map((service) => `${service.title || ""} ${service.text || ""}`)
  ].filter(Boolean).join(" ").toLowerCase();
}

function specIdentityHaystack(spec) {
  return [
    spec.slug,
    spec.niche,
    spec.businessName,
    spec.pattern?.secondaryPattern,
    spec.pattern?.imageEvidence,
    spec.copy?.heroTitle
  ].filter(Boolean).join(" ").toLowerCase();
}

function hasAnySharedWord(left, right) {
  const rightWords = new Set(significantWords(right));
  return significantWords(left).some((word) => rightWords.has(word));
}

function significantWords(value) {
  const stop = new Set(["with", "that", "this", "from", "your", "into", "real", "proof", "service", "image", "evidence"]);
  return String(value || "")
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.filter((word) => word.length > 3 && !stop.has(word)) || [];
}
