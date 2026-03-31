#!/usr/bin/env npx tsx
/**
 * Warby Parker Product Catalog Scraper
 *
 * Scrapes warbyparker.com for the full product catalog and optionally seeds
 * the Prisma database.
 *
 * Usage:
 *   npx tsx scripts/scrape-wp.ts          # scrape and save JSON
 *   npx tsx scripts/scrape-wp.ts --seed   # read saved JSON and seed DB
 *   npx tsx scripts/scrape-wp.ts --resume # resume an interrupted scrape
 */

import * as cheerio from "cheerio";
import * as fs from "node:fs";
import * as path from "node:path";

// ── Types ──────────────────────────────────────────────────────────────

interface ScrapedVariant {
  colorName: string;
  colorHex?: string;
  imageUrl?: string;
  sku?: string;
}

interface ScrapedImage {
  url: string;
  type: string;
}

interface ScrapedProduct {
  name: string;
  slug: string;
  category: string;
  price: number;
  material?: string;
  shape?: string;
  width?: string;
  gender?: string;
  bridgeFit?: string;
  description?: string;
  variants: ScrapedVariant[];
  images: ScrapedImage[];
  tags: string[];
}

interface ScrapeProgress {
  completedSlugs: string[];
  products: ScrapedProduct[];
  lastUpdated: string;
}

interface NextDataProduct {
  name?: string;
  slug?: string;
  displayName?: string;
  path?: string;
  price?: number | string | { amount?: number };
  material?: string;
  frameMaterial?: string;
  shape?: string;
  frameShape?: string;
  width?: string;
  widthCategory?: string;
  frameWidth?: string;
  gender?: string;
  genderTarget?: string;
  bridgeFit?: string;
  description?: string;
  shortDescription?: string;
  colors?: NextDataColor[];
  variants?: NextDataColor[];
  colorways?: NextDataColor[];
  images?: NextDataImage[];
  media?: NextDataImage[];
  tags?: string[];
  collections?: string[];
  category?: string;
  sku?: string;
  [key: string]: unknown;
}

interface NextDataColor {
  name?: string;
  colorName?: string;
  displayName?: string;
  hex?: string;
  colorHex?: string;
  hexCode?: string;
  image?: string | { url?: string };
  imageUrl?: string;
  heroImage?: string;
  sku?: string;
  [key: string]: unknown;
}

interface NextDataImage {
  url?: string;
  src?: string;
  type?: string;
  mediaType?: string;
  alt?: string;
  [key: string]: unknown;
}

interface LdJsonProduct {
  "@type"?: string;
  name?: string;
  description?: string;
  image?: string | string[];
  url?: string;
  sku?: string;
  offers?: LdJsonOffer | LdJsonOffer[];
  brand?: { name?: string };
  color?: string;
  [key: string]: unknown;
}

interface LdJsonOffer {
  price?: number | string;
  priceCurrency?: string;
  [key: string]: unknown;
}

// ── Config ─────────────────────────────────────────────────────────────

const BASE_URL = "https://www.warbyparker.com";
const CATEGORIES = [
  { url: `${BASE_URL}/eyeglasses`, name: "eyeglasses" },
  { url: `${BASE_URL}/sunglasses`, name: "sunglasses" },
  { url: `${BASE_URL}/accessories`, name: "accessories" },
];

const OUTPUT_FILE = path.resolve(__dirname, "wp-catalog.json");
const PROGRESS_FILE = path.resolve(__dirname, "wp-progress.json");
const ERROR_LOG = path.resolve(__dirname, "scrape-errors.log");

const REQUEST_DELAY_MS = 1000;
const MAX_RETRIES = 3;

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ── Helpers ────────────────────────────────────────────────────────────

function logError(message: string): void {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(ERROR_LOG, line);
  console.error(`  ERROR: ${message}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  retries = MAX_RETRIES
): Promise<string | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (response.status === 503 || response.status === 502) {
        console.log(
          `  Site returned ${response.status} — may be down for maintenance.`
        );
        if (attempt < retries) {
          const backoff = Math.pow(2, attempt) * 1000;
          console.log(`  Retrying in ${backoff / 1000}s (attempt ${attempt}/${retries})...`);
          await sleep(backoff);
          continue;
        }
        return null;
      }

      if (response.status === 429) {
        const backoff = Math.pow(2, attempt) * 2000;
        console.log(
          `  Rate limited (429). Waiting ${backoff / 1000}s before retry...`
        );
        await sleep(backoff);
        continue;
      }

      if (!response.ok) {
        logError(`HTTP ${response.status} for ${url}`);
        if (attempt < retries) {
          const backoff = Math.pow(2, attempt) * 1000;
          await sleep(backoff);
          continue;
        }
        return null;
      }

      return await response.text();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logError(`Fetch error for ${url}: ${msg}`);
      if (attempt < retries) {
        const backoff = Math.pow(2, attempt) * 1000;
        console.log(`  Retrying in ${backoff / 1000}s (attempt ${attempt}/${retries})...`);
        await sleep(backoff);
        continue;
      }
    }
  }
  return null;
}

function loadProgress(): ScrapeProgress {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
    } catch {
      // corrupted file, start fresh
    }
  }
  return { completedSlugs: [], products: [], lastUpdated: "" };
}

function saveProgress(progress: ScrapeProgress): void {
  progress.lastUpdated = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// ── Parsing: Extract product links from a category page ────────────────

function extractProductSlugsFromNextData(
  html: string,
  category: string
): { slug: string; category: string }[] {
  const $ = cheerio.load(html);
  const results: { slug: string; category: string }[] = [];

  // Strategy 1: __NEXT_DATA__ JSON blob
  const nextDataScript = $('script#__NEXT_DATA__').html();
  if (nextDataScript) {
    try {
      const data = JSON.parse(nextDataScript);
      const products = findProductsInObject(data);
      for (const p of products) {
        const slug = p.slug || p.path?.replace(/^\//, "");
        if (slug) {
          results.push({ slug, category });
        }
      }
      if (results.length > 0) {
        console.log(
          `  Found ${results.length} products via __NEXT_DATA__`
        );
        return results;
      }
    } catch {
      logError(`Failed to parse __NEXT_DATA__ for ${category}`);
    }
  }

  // Strategy 2: ld+json structured data
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "{}");
      const items: LdJsonProduct[] = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item["@type"] === "Product" || item["@type"] === "ItemList") {
          const url = item.url as string | undefined;
          if (url) {
            const slug = url.replace(BASE_URL, "").replace(/^\//, "");
            results.push({ slug, category });
          }
          // ItemList may have itemListElement
          const listItems = (item as Record<string, unknown>)
            .itemListElement as { url?: string }[] | undefined;
          if (Array.isArray(listItems)) {
            for (const li of listItems) {
              if (li.url) {
                const slug = li.url
                  .replace(BASE_URL, "")
                  .replace(/^\//, "");
                results.push({ slug, category });
              }
            }
          }
        }
      }
    } catch {
      // skip malformed ld+json
    }
  });
  if (results.length > 0) {
    console.log(`  Found ${results.length} products via ld+json`);
    return results;
  }

  // Strategy 3: window.__INITIAL_STATE__ or similar global
  $("script").each((_, el) => {
    const text = $(el).html() || "";
    const stateMatch = text.match(
      /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});?\s*(?:<\/script>|$)/
    );
    if (stateMatch) {
      try {
        const state = JSON.parse(stateMatch[1]);
        const products = findProductsInObject(state);
        for (const p of products) {
          const slug = p.slug || p.path?.replace(/^\//, "");
          if (slug) results.push({ slug, category });
        }
      } catch {
        // ignore
      }
    }
  });
  if (results.length > 0) {
    console.log(`  Found ${results.length} products via __INITIAL_STATE__`);
    return results;
  }

  // Strategy 4: Fallback — parse <a> tags with product-like hrefs
  const categoryPrefix = `/${category}/`;
  const seen = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    // Match links like /eyeglasses/durand or /sunglasses/haskell
    if (
      href.startsWith(categoryPrefix) &&
      !href.includes("?") &&
      !href.includes("#")
    ) {
      const slug = href.replace(/^\//, "");
      // Skip sub-paths that are too deep (e.g., /eyeglasses/narrow/durand)
      const parts = slug.split("/");
      if (parts.length === 2 && !seen.has(slug)) {
        seen.add(slug);
        results.push({ slug, category });
      }
    }
  });
  if (results.length > 0) {
    console.log(`  Found ${results.length} products via HTML link parsing`);
  } else {
    console.log(`  No products found for ${category}`);
  }

  return results;
}

/**
 * Recursively walk an object tree looking for arrays of objects that look
 * like products (have a name/slug/path and price).
 */
function findProductsInObject(obj: unknown): NextDataProduct[] {
  const results: NextDataProduct[] = [];
  if (!obj || typeof obj !== "object") return results;

  if (Array.isArray(obj)) {
    // Check if this looks like a product array
    const couldBeProducts = obj.length > 0 && obj.every(
      (item) =>
        item &&
        typeof item === "object" &&
        (("name" in item && ("slug" in item || "path" in item)) ||
          ("displayName" in item && ("slug" in item || "path" in item)))
    );
    if (couldBeProducts && obj.length >= 2) {
      return obj as NextDataProduct[];
    }
    // Otherwise recurse into each element
    for (const item of obj) {
      results.push(...findProductsInObject(item));
    }
  } else {
    for (const value of Object.values(obj as Record<string, unknown>)) {
      results.push(...findProductsInObject(value));
    }
  }
  return results;
}

// ── Parsing: Extract full product data from a detail page ──────────────

function parseProductPage(
  html: string,
  slug: string,
  category: string
): ScrapedProduct | null {
  const $ = cheerio.load(html);
  let product: ScrapedProduct = {
    name: "",
    slug,
    category,
    price: 0,
    variants: [],
    images: [],
    tags: [category],
  };

  // ── Try __NEXT_DATA__ first ──
  const nextDataScript = $("script#__NEXT_DATA__").html();
  if (nextDataScript) {
    try {
      const data = JSON.parse(nextDataScript);
      const found = findProductDetail(data, slug);
      if (found) {
        product = mergeProductData(product, found);
      }
    } catch {
      logError(`Failed to parse __NEXT_DATA__ on ${slug}`);
    }
  }

  // ── Try ld+json ──
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "{}") as LdJsonProduct;
      if (data["@type"] === "Product") {
        if (!product.name && data.name) product.name = data.name;
        if (!product.description && data.description)
          product.description = data.description;

        // Price from offers
        if (!product.price && data.offers) {
          const offers = Array.isArray(data.offers)
            ? data.offers
            : [data.offers];
          for (const offer of offers) {
            if (offer.price) {
              product.price = parseFloat(String(offer.price));
              break;
            }
          }
        }

        // Images
        if (data.image) {
          const imgs = Array.isArray(data.image)
            ? data.image
            : [data.image];
          for (const img of imgs) {
            if (typeof img === "string" && !product.images.find((i) => i.url === img)) {
              product.images.push({ url: img, type: "product" });
            }
          }
        }

        // Color as a variant
        if (data.color && !product.variants.find((v) => v.colorName === data.color)) {
          product.variants.push({
            colorName: data.color,
            sku: data.sku,
          });
        }
      }
    } catch {
      // skip
    }
  });

  // ── Try __INITIAL_STATE__ ──
  $("script").each((_, el) => {
    const text = $(el).html() || "";
    const stateMatch = text.match(
      /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});?\s*(?:<\/script>|$)/
    );
    if (stateMatch) {
      try {
        const state = JSON.parse(stateMatch[1]);
        const found = findProductDetail(state, slug);
        if (found) {
          product = mergeProductData(product, found);
        }
      } catch {
        // ignore
      }
    }
  });

  // ── Fallback: HTML parsing ──
  if (!product.name) {
    const h1 = $("h1").first().text().trim();
    if (h1) product.name = h1;
  }

  if (!product.price) {
    // Look for price in common selectors
    const priceText =
      $('[data-testid="price"]').first().text() ||
      $(".price").first().text() ||
      $('[class*="price"]').first().text();
    const priceMatch = priceText.match(/\$?([\d,.]+)/);
    if (priceMatch) {
      product.price = parseFloat(priceMatch[1].replace(",", ""));
    }
  }

  if (!product.description) {
    const desc =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content");
    if (desc) product.description = desc;
  }

  // OG image as fallback
  if (product.images.length === 0) {
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) {
      product.images.push({ url: ogImage, type: "og_image" });
    }
  }

  // Extract image tags from the page for product images
  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src") || "";
    const alt = $(el).attr("alt") || "";
    if (
      src &&
      (src.includes("warbyparker") || src.startsWith("/")) &&
      (src.includes("product") ||
        src.includes("frame") ||
        alt.toLowerCase().includes(product.name.toLowerCase()))
    ) {
      const fullUrl = src.startsWith("http")
        ? src
        : `${BASE_URL}${src}`;
      if (!product.images.find((i) => i.url === fullUrl)) {
        product.images.push({ url: fullUrl, type: "product_image" });
      }
    }
  });

  // If we still have no name, derive from slug
  if (!product.name) {
    const frameName = slug.split("/").pop() || slug;
    product.name = frameName
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  return product;
}

/**
 * Recursively find a product detail object that matches the given slug.
 */
function findProductDetail(
  obj: unknown,
  slug: string
): NextDataProduct | null {
  if (!obj || typeof obj !== "object") return null;

  const frameName = slug.split("/").pop() || "";

  if (!Array.isArray(obj)) {
    const record = obj as Record<string, unknown>;
    // Check if this object itself is the product
    if (
      (record.slug === frameName ||
        record.slug === slug ||
        record.path === `/${slug}`) &&
      (record.name || record.displayName)
    ) {
      return record as NextDataProduct;
    }
    for (const value of Object.values(record)) {
      const found = findProductDetail(value, slug);
      if (found) return found;
    }
  } else {
    for (const item of obj) {
      const found = findProductDetail(item, slug);
      if (found) return found;
    }
  }
  return null;
}

function mergeProductData(
  product: ScrapedProduct,
  raw: NextDataProduct
): ScrapedProduct {
  if (!product.name && (raw.name || raw.displayName)) {
    product.name = (raw.name || raw.displayName) as string;
  }

  if (!product.price) {
    if (typeof raw.price === "number") {
      product.price = raw.price;
    } else if (typeof raw.price === "string") {
      product.price = parseFloat(raw.price.replace(/[^0-9.]/g, ""));
    } else if (raw.price && typeof raw.price === "object" && raw.price.amount) {
      product.price = raw.price.amount;
    }
  }

  if (!product.material)
    product.material = (raw.material || raw.frameMaterial) as string | undefined;
  if (!product.shape)
    product.shape = (raw.shape || raw.frameShape) as string | undefined;
  if (!product.width)
    product.width = (raw.width || raw.widthCategory || raw.frameWidth) as
      | string
      | undefined;
  if (!product.gender)
    product.gender = (raw.gender || raw.genderTarget) as string | undefined;
  if (!product.bridgeFit) product.bridgeFit = raw.bridgeFit as string | undefined;
  if (!product.description)
    product.description = (raw.description || raw.shortDescription) as
      | string
      | undefined;

  // Variants / colors
  const colorSources = raw.colors || raw.variants || raw.colorways;
  if (Array.isArray(colorSources)) {
    for (const c of colorSources) {
      const colorName =
        c.name || c.colorName || c.displayName || "Unknown";
      if (product.variants.find((v) => v.colorName === colorName)) continue;

      let imageUrl: string | undefined;
      if (typeof c.image === "string") imageUrl = c.image;
      else if (c.image && typeof c.image === "object" && c.image.url)
        imageUrl = c.image.url;
      else if (c.imageUrl) imageUrl = c.imageUrl;
      else if (c.heroImage) imageUrl = c.heroImage;

      product.variants.push({
        colorName,
        colorHex: c.hex || c.colorHex || c.hexCode,
        imageUrl,
        sku: c.sku,
      });
    }
  }

  // Images
  const imgSources = raw.images || raw.media;
  if (Array.isArray(imgSources)) {
    for (const img of imgSources) {
      const url = img.url || img.src;
      if (url && !product.images.find((i) => i.url === url)) {
        product.images.push({
          url,
          type: img.type || img.mediaType || "product",
        });
      }
    }
  }

  // Tags
  if (Array.isArray(raw.tags)) {
    for (const t of raw.tags) {
      if (typeof t === "string" && !product.tags.includes(t)) {
        product.tags.push(t);
      }
    }
  }
  if (Array.isArray(raw.collections)) {
    for (const c of raw.collections) {
      if (typeof c === "string" && !product.tags.includes(c)) {
        product.tags.push(c);
      }
    }
  }

  return product;
}

// ── Main Scrape Logic ──────────────────────────────────────────────────

async function scrape(resume: boolean): Promise<void> {
  console.log("=== Warby Parker Catalog Scraper ===\n");

  // Clear or create error log
  if (!resume) {
    fs.writeFileSync(ERROR_LOG, "");
  }

  const progress: ScrapeProgress = resume
    ? loadProgress()
    : { completedSlugs: [], products: [], lastUpdated: "" };

  if (resume && progress.completedSlugs.length > 0) {
    console.log(
      `Resuming scrape. ${progress.completedSlugs.length} products already scraped.\n`
    );
  }

  // 1. Discover all product slugs from category pages
  console.log("--- Discovering products from category pages ---\n");

  const allSlugs: { slug: string; category: string }[] = [];

  for (const cat of CATEGORIES) {
    console.log(`Fetching ${cat.url} ...`);
    const html = await fetchWithRetry(cat.url);

    if (!html) {
      console.log(
        `\n  Could not reach ${cat.url}.`
      );
      console.log(
        "  The site may be down for maintenance. Try again later.\n"
      );

      // If we can't reach any category page, check if the site is down entirely
      if (allSlugs.length === 0 && cat === CATEGORIES[0]) {
        const testHtml = await fetchWithRetry(BASE_URL);
        if (!testHtml) {
          console.log(
            "\n*** warbyparker.com appears to be down. ***"
          );
          console.log(
            "*** Save this script and re-run when the site is back up. ***\n"
          );
          return;
        }
      }
      continue;
    }

    const slugs = extractProductSlugsFromNextData(html, cat.name);
    allSlugs.push(...slugs);
    await sleep(REQUEST_DELAY_MS);
  }

  if (allSlugs.length === 0) {
    console.log("\nNo products discovered across any category page.");
    console.log(
      "The site may be down or its structure has changed significantly."
    );
    console.log("Check scrape-errors.log for details.\n");
    return;
  }

  console.log(`\nTotal product slugs discovered: ${allSlugs.length}\n`);

  // 2. Fetch each product detail page
  console.log("--- Scraping product detail pages ---\n");

  let scraped = 0;
  let skipped = 0;
  let failed = 0;

  for (const { slug, category } of allSlugs) {
    if (progress.completedSlugs.includes(slug)) {
      skipped++;
      continue;
    }

    const productUrl = `${BASE_URL}/${slug}`;
    console.log(
      `[${scraped + skipped + failed + 1}/${allSlugs.length}] ${productUrl}`
    );

    const html = await fetchWithRetry(productUrl);
    if (!html) {
      logError(`Failed to fetch product page: ${productUrl}`);
      failed++;
      await sleep(REQUEST_DELAY_MS);
      continue;
    }

    const product = parseProductPage(html, slug, category);
    if (product) {
      progress.products.push(product);
      progress.completedSlugs.push(slug);
      scraped++;
      console.log(
        `  -> ${product.name} | $${product.price} | ${product.variants.length} variant(s) | ${product.images.length} image(s)`
      );
    } else {
      logError(`Could not parse product data from ${productUrl}`);
      failed++;
    }

    // Save progress every 10 products
    if (scraped % 10 === 0) {
      saveProgress(progress);
    }

    await sleep(REQUEST_DELAY_MS);
  }

  // 3. Save final output
  saveProgress(progress);

  const output = progress.products;
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nSaved catalog to ${OUTPUT_FILE}`);

  // Clean up progress file on successful completion
  if (failed === 0 && fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
  }

  // 4. Summary
  const totalVariants = output.reduce((s, p) => s + p.variants.length, 0);
  const totalImages = output.reduce((s, p) => s + p.images.length, 0);

  console.log("\n=== Scrape Summary ===");
  console.log(`  Products scraped:   ${scraped}`);
  console.log(`  Products skipped:   ${skipped} (already scraped)`);
  console.log(`  Products failed:    ${failed}`);
  console.log(`  Total in catalog:   ${output.length}`);
  console.log(`  Total variants:     ${totalVariants}`);
  console.log(`  Total images:       ${totalImages}`);
  console.log(`  Output file:        ${OUTPUT_FILE}`);
  if (failed > 0) {
    console.log(`  Error log:          ${ERROR_LOG}`);
  }
  console.log("");
}

// ── Seed Mode ──────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  console.log("=== Seeding Prisma DB from wp-catalog.json ===\n");

  if (!fs.existsSync(OUTPUT_FILE)) {
    console.error(
      `Catalog file not found at ${OUTPUT_FILE}. Run the scraper first.`
    );
    process.exit(1);
  }

  // Dynamic import so Prisma isn't required just for scraping
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const products: ScrapedProduct[] = JSON.parse(
      fs.readFileSync(OUTPUT_FILE, "utf-8")
    );

    console.log(`Found ${products.length} products to seed.\n`);

    let created = 0;
    let updated = 0;
    let tagCache: Record<string, string> = {};

    for (const p of products) {
      const categoryMap: Record<string, string> = {
        eyeglasses: "FRAMES",
        sunglasses: "SUNGLASSES",
        accessories: "ACCESSORIES",
      };

      const data = {
        slug: p.slug.split("/").pop() || p.slug,
        name: p.name,
        category: categoryMap[p.category] || "FRAMES",
        subcategory: p.category,
        basePrice: p.price || 95,
        description: p.description || null,
        material: p.material || null,
        shape: p.shape || null,
        gender: p.gender || null,
        widthCategory: p.width || null,
        bridgeFit: p.bridgeFit || null,
        status: "LIVE",
      };

      // Upsert product
      const existing = await prisma.product.findUnique({
        where: { slug: data.slug },
      });

      let productId: string;

      if (existing) {
        const result = await prisma.product.update({
          where: { slug: data.slug },
          data,
        });
        productId = result.id;
        updated++;
      } else {
        const result = await prisma.product.create({ data });
        productId = result.id;
        created++;
      }

      // Variants
      for (const v of p.variants) {
        const existingVariant = v.sku
          ? await prisma.productVariant.findUnique({ where: { sku: v.sku } })
          : null;

        if (!existingVariant) {
          await prisma.productVariant.create({
            data: {
              productId,
              colorName: v.colorName,
              colorHex: v.colorHex || null,
              sku: v.sku || null,
              imageUrl: v.imageUrl || null,
              isDefault: p.variants.indexOf(v) === 0,
            },
          });
        }
      }

      // Media
      for (let i = 0; i < p.images.length; i++) {
        const img = p.images[i];
        const existingMedia = await prisma.productMedia.findFirst({
          where: { productId, url: img.url },
        });
        if (!existingMedia) {
          await prisma.productMedia.create({
            data: {
              productId,
              url: img.url,
              mediaType: mapMediaType(img.type),
              sortOrder: i,
              isPrimary: i === 0,
            },
          });
        }
      }

      // Tags
      for (const tagName of p.tags) {
        if (!tagCache[tagName]) {
          const existingTag = await prisma.tag.findUnique({
            where: { name: tagName },
          });
          if (existingTag) {
            tagCache[tagName] = existingTag.id;
          } else {
            const newTag = await prisma.tag.create({
              data: {
                name: tagName,
                taxonomy: guessTaxonomy(tagName),
              },
            });
            tagCache[tagName] = newTag.id;
          }
        }

        // Create ProductTag join if it doesn't exist
        try {
          await prisma.productTag.create({
            data: {
              productId,
              tagId: tagCache[tagName],
            },
          });
        } catch {
          // Already exists (unique constraint), skip
        }
      }

      console.log(`  ${existing ? "Updated" : "Created"}: ${p.name}`);
    }

    console.log(`\n=== Seed Summary ===`);
    console.log(`  Created: ${created}`);
    console.log(`  Updated: ${updated}`);
    console.log(`  Total:   ${products.length}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

function mapMediaType(type: string): string {
  const typeMap: Record<string, string> = {
    product: "PRODUCT_SHOT",
    product_image: "PRODUCT_SHOT",
    og_image: "PRODUCT_SHOT",
    lifestyle: "LIFESTYLE",
    on_model: "ON_MODEL",
    flat_lay: "FLAT_LAY",
    video: "VIDEO",
  };
  return typeMap[type.toLowerCase()] || "PRODUCT_SHOT";
}

function guessTaxonomy(tagName: string): string {
  const lower = tagName.toLowerCase();
  if (
    ["eyeglasses", "sunglasses", "accessories"].includes(lower)
  )
    return "collection";
  if (
    ["spring", "summer", "fall", "winter", "holiday"].some((s) =>
      lower.includes(s)
    )
  )
    return "season";
  if (
    ["acetate", "metal", "titanium", "mixed"].some((m) =>
      lower.includes(m)
    )
  )
    return "material";
  if (
    ["new", "bestseller", "sale", "limited"].some((p) =>
      lower.includes(p)
    )
  )
    return "promo";
  return "style";
}

// ── CLI Entry ──────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--seed")) {
    await seed();
  } else if (args.includes("--resume")) {
    await scrape(true);
  } else {
    await scrape(false);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  logError(`Fatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
