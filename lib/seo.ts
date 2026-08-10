// Shared helpers for structured data (Schema.org JSON-LD).

type BreadcrumbItem = { name: string; url: string };

/** BreadcrumbList — enables breadcrumb rich results in Google. */
export function breadcrumbLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url
    }))
  };
}

/** HowTo — built from the plain-language steps every tool already has. */
export function howToLd({
  name,
  description,
  steps
}: {
  name: string;
  description?: string;
  steps: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    step: steps.map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: text.length > 60 ? text.slice(0, 60).trimEnd() + "…" : text,
      text
    }))
  };
}

/**
 * Recipe — emitted only for tools that genuinely produce recipe-like output,
 * so Google never sees fabricated recipe markup on pure calculators.
 * The ingredient examples mirror what the widget's "Try an example" fills in.
 */
const RECIPE_META: Record<
  string,
  { name: string; ingredients: string[]; yield?: string; prep?: string; cook?: string }
> = {
  "recipe-scaler": {
    name: "Vanilla birthday cake (scaled to 12 servings)",
    ingredients: [
      "300 g all-purpose flour",
      "200 g granulated sugar",
      "150 g unsalted butter",
      "3 large eggs",
      "240 ml whole milk",
      "2 tsp baking powder"
    ],
    yield: "12 servings",
    prep: "PT15M",
    cook: "PT35M"
  },
  "recipe-cost-calculator": {
    name: "Spaghetti bolognese for 4",
    ingredients: [
      "500 g spaghetti",
      "400 g lean ground beef",
      "800 g canned tomatoes",
      "1 onion",
      "2 cloves garlic",
      "2 tbsp olive oil"
    ],
    yield: "4 servings",
    prep: "PT10M",
    cook: "PT45M"
  },
  "dough-batch-converter": {
    name: "White bread dough, 72% hydration (1.2 kg batch)",
    ingredients: [
      "700 g bread flour",
      "504 g water",
      "14 g fine sea salt",
      "7 g instant yeast"
    ],
    yield: "2 loaves",
    prep: "PT20M",
    cook: "PT40M"
  },
  "pizza-dough-calculator": {
    name: "Neapolitan-style pizza dough, 65% hydration",
    ingredients: ["500 g bread flour", "325 g water", "10 g fine salt", "2 g instant yeast"],
    yield: "2 × 280 g dough balls",
    prep: "PT15M",
    cook: "PT10M"
  },
  "bread-hydration": {
    name: "70% hydration artisan bread loaf",
    ingredients: ["500 g bread flour", "350 g water", "10 g fine salt", "5 g instant yeast"],
    yield: "1 loaf",
    prep: "PT25M",
    cook: "PT45M"
  },
  "sourdough-calculator": {
    name: "Sourdough starter fed at 1:2:2 to 300 g",
    ingredients: ["60 g sourdough starter", "120 g bread flour", "120 g water"],
    yield: "300 g starter",
    prep: "PT5M"
  },
  "brine-calculator": {
    name: "5% wet brine for a 1.5 kg whole chicken",
    ingredients: ["1.5 kg whole chicken", "1.5 L water", "75 g kosher salt", "30 g sugar"],
    yield: "1 whole chicken",
    prep: "PT10M"
  },
  "sweetener-converter": {
    name: "Sugar-to-honey swap for muffins",
    ingredients: ["100 g granulated sugar", "75 g honey"],
    yield: "1 batch",
    prep: "PT5M"
  },
  "measurement-to-weight": {
    name: "Cup-based baking recipe converted to grams",
    ingredients: [
      "2 cups all-purpose flour",
      "1/2 cup granulated sugar",
      "8 tbsp unsalted butter",
      "1 cup whole milk",
      "3 tbsp honey"
    ],
    yield: "1 batch",
    prep: "PT10M",
    cook: "PT30M"
  },
  "recipe-comparator": {
    name: "Garlic chicken & rice vs beef tacos",
    ingredients: [
      "600 g chicken breast",
      "200 g white rice",
      "300 g broccoli",
      "500 g beef mince",
      "300 g flour tortillas",
      "100 g cheddar cheese",
      "150 g avocado"
    ],
    yield: "2 recipes, 4 servings each",
    prep: "PT15M",
    cook: "PT30M"
  }
};

export function recipeLd({
  slug,
  description,
  steps,
  siteUrl,
  siteName
}: {
  slug: string;
  description: string;
  steps: string[];
  siteUrl: string;
  siteName: string;
}) {
  const meta = RECIPE_META[slug];
  if (!meta) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: meta.name,
    description,
    image: [`${siteUrl}/api/og/${slug}`],
    author: { "@type": "Organization", name: siteName },
    recipeCategory: "Baking and cooking calculator",
    recipeCuisine: "International",
    recipeYield: meta.yield,
    prepTime: meta.prep,
    cookTime: meta.cook,
    recipeIngredient: meta.ingredients,
    // Real, human-readable instructions from the tool's own "How to use it"
    // steps — not fabricated content. Mirrors the visible page content.
    recipeInstructions: steps.map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: text.length > 60 ? text.slice(0, 60).trimEnd() + "…" : text,
      text
    })),
    mainEntityOfPage: `${siteUrl}/tools/${slug}`
  };
}

/** FAQPage — from any {q,a} pair list (used on hub pages too). */
export function faqPageLd(faq: { q: string; a: string }[]) {
  if (!faq.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a }
    }))
  };
}

/** ItemList — every tool on a category hub page (rich search results). */
export function itemListLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: item.url
    }))
  };
}

/** CollectionPage — semantic wrapper for category hub pages. */
export function collectionPageLd({
  name,
  description,
  url
}: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url,
    mainEntity: { "@type": "ItemList" }
  };
}

/** WebApplication — every interactive tool. */
export function webAppLd({
  name,
  slug,
  tagline,
  siteUrl,
  siteName
}: {
  name: string;
  slug: string;
  tagline: string;
  siteUrl: string;
  siteName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    url: `${siteUrl}/tools/${slug}`,
    description: tagline,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: { "@type": "Organization", name: siteName },
    image: `${siteUrl}/api/og/${slug}`
  };
}
