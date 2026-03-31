import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ── Clear all data (order matters for FK constraints) ──────────────
  await prisma.complianceSubmission.deleteMany();
  await prisma.planogramClusterAssignment.deleteMany();
  await prisma.planogramSlot.deleteMany();
  await prisma.planogramVersion.deleteMany();
  await prisma.planogram.deleteMany();
  await prisma.storeClusterAssignment.deleteMany();
  await prisma.storeCluster.deleteMany();
  await prisma.store.deleteMany();
  await prisma.categoryPin.deleteMany();
  await prisma.categoryMerchRule.deleteMany();
  await prisma.landingPage.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.lensOption.deleteMany();
  await prisma.productTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.productMedia.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();

  console.log("Cleared all existing data.");

  // ── Tags ───────────────────────────────────────────────────────────
  const tagData = [
    // Collections
    { name: "Spring 2026", taxonomy: "collection", color: "#86EFAC" },
    { name: "Summer 2026", taxonomy: "collection", color: "#FDE68A" },
    { name: "Best Sellers", taxonomy: "collection", color: "#F97316" },
    { name: "New Arrivals", taxonomy: "collection", color: "#A78BFA" },
    { name: "Classic Collection", taxonomy: "collection", color: "#6B7280" },
    // Seasons
    { name: "Spring", taxonomy: "season", color: "#4ADE80" },
    { name: "Summer", taxonomy: "season", color: "#FACC15" },
    { name: "Fall", taxonomy: "season", color: "#F59E0B" },
    { name: "Winter", taxonomy: "season", color: "#93C5FD" },
    { name: "Year-Round", taxonomy: "season", color: "#D1D5DB" },
    // Materials
    { name: "Acetate", taxonomy: "material", color: "#FBBF24" },
    { name: "Metal", taxonomy: "material", color: "#9CA3AF" },
    { name: "Mixed Material", taxonomy: "material", color: "#C084FC" },
    { name: "Titanium", taxonomy: "material", color: "#60A5FA" },
    // Styles
    { name: "Round", taxonomy: "style", color: "#34D399" },
    { name: "Square", taxonomy: "style", color: "#FB923C" },
    { name: "Rectangle", taxonomy: "style", color: "#38BDF8" },
    { name: "Cat-Eye", taxonomy: "style", color: "#F472B6" },
    { name: "Aviator", taxonomy: "style", color: "#A3E635" },
    { name: "Browline", taxonomy: "style", color: "#E879F9" },
    { name: "Oversized", taxonomy: "style", color: "#2DD4BF" },
    // Promos
    { name: "Home Try-On", taxonomy: "promo", color: "#06B6D4" },
    { name: "Virtual Try-On", taxonomy: "promo", color: "#8B5CF6" },
    { name: "Staff Pick", taxonomy: "promo", color: "#EF4444" },
  ];

  const tags: Record<string, string> = {};
  for (const t of tagData) {
    const tag = await prisma.tag.create({ data: t });
    tags[t.name] = tag.id;
  }
  console.log(`Created ${tagData.length} tags.`);

  // ── Lens Options ───────────────────────────────────────────────────
  const lensOptions = [
    { name: "Single Vision", type: "SINGLE_VISION", price: 0, description: "Standard single-vision prescription lenses included with every frame.", sortOrder: 1 },
    { name: "Progressives", type: "PROGRESSIVES", price: 100, description: "No-line multifocal lenses for distance, intermediate, and reading.", sortOrder: 2 },
    { name: "Readers", type: "READERS", price: 0, description: "Magnifying lenses for reading, available in various strengths.", sortOrder: 3 },
    { name: "Non-Prescription", type: "NON_RX", price: 0, description: "Clear demo lenses with no corrective power.", sortOrder: 4 },
    { name: "Blue-Light Filtering", type: "SINGLE_VISION", addOnName: "BLUE_LIGHT", price: 50, description: "Filters blue light from screens to reduce eye strain.", sortOrder: 5 },
    { name: "Light-Responsive", type: "SINGLE_VISION", addOnName: "LIGHT_RESPONSIVE", price: 100, description: "Lenses that darken in sunlight and clear indoors.", sortOrder: 6 },
    { name: "Polarized", type: "NON_RX", addOnName: "POLARIZED", price: 100, description: "Polarized sunglass lenses that reduce glare.", sortOrder: 7 },
  ];

  for (const lo of lensOptions) {
    await prisma.lensOption.create({ data: lo });
  }
  console.log(`Created ${lensOptions.length} lens options.`);

  // ── Products ───────────────────────────────────────────────────────

  interface ProductSeed {
    name: string;
    slug: string;
    category: string;
    subcategory?: string;
    basePrice: number;
    material?: string;
    shape?: string;
    gender?: string;
    widthCategory?: string;
    bridgeFit?: string;
    isBestseller: boolean;
    isNewArrival: boolean;
    description?: string;
    colors: { colorName: string; colorHex: string; isDefault: boolean }[];
    tagNames: string[];
  }

  const products: ProductSeed[] = [
    // ── Eyeglasses ──────────────────────────────────────────────────
    {
      name: "Durand",
      slug: "durand",
      category: "FRAMES",
      subcategory: "eyeglasses",
      basePrice: 95,
      material: "acetate",
      shape: "rectangle",
      gender: "unisex",
      widthCategory: "medium",
      bridgeFit: "standard",
      isBestseller: true,
      isNewArrival: false,
      description: "A refined rectangular frame with keyhole bridge and polished acetate construction.",
      colors: [
        { colorName: "Whiskey Tortoise", colorHex: "#8B6914", isDefault: true },
        { colorName: "Jet Black", colorHex: "#0A0A0A", isDefault: false },
        { colorName: "Crystal", colorHex: "#E8E8E8", isDefault: false },
        { colorName: "Striped Sassafras", colorHex: "#6B4226", isDefault: false },
      ],
      tagNames: ["Classic Collection", "Year-Round", "Acetate", "Rectangle", "Best Sellers", "Home Try-On"],
    },
    {
      name: "Percey",
      slug: "percey",
      category: "FRAMES",
      subcategory: "eyeglasses",
      basePrice: 95,
      material: "acetate",
      shape: "square",
      gender: "unisex",
      widthCategory: "wide",
      bridgeFit: "standard",
      isBestseller: true,
      isNewArrival: false,
      description: "Bold and angular with a wider fit, Percey is a standout square frame.",
      colors: [
        { colorName: "Striped Sassafras", colorHex: "#6B4226", isDefault: true },
        { colorName: "Jet Black Matte", colorHex: "#1A1A1A", isDefault: false },
        { colorName: "Mission Clay Fade", colorHex: "#C4856A", isDefault: false },
      ],
      tagNames: ["Classic Collection", "Year-Round", "Acetate", "Square", "Best Sellers", "Home Try-On"],
    },
    {
      name: "Chamberlain",
      slug: "chamberlain",
      category: "FRAMES",
      subcategory: "eyeglasses",
      basePrice: 95,
      material: "acetate",
      shape: "round",
      gender: "women",
      widthCategory: "medium",
      bridgeFit: "standard",
      isBestseller: false,
      isNewArrival: true,
      description: "A perfectly round frame with a contemporary feel, designed for women.",
      colors: [
        { colorName: "Jet Black", colorHex: "#0A0A0A", isDefault: true },
        { colorName: "Layered Ivory Tortoise", colorHex: "#D4C5A0", isDefault: false },
        { colorName: "Rosewater Crystal", colorHex: "#F5D5D5", isDefault: false },
      ],
      tagNames: ["Spring 2026", "Spring", "Acetate", "Round", "New Arrivals"],
    },
    {
      name: "Haskell",
      slug: "haskell",
      category: "FRAMES",
      subcategory: "eyeglasses",
      basePrice: 95,
      material: "acetate",
      shape: "rectangle",
      gender: "men",
      widthCategory: "medium",
      bridgeFit: "standard",
      isBestseller: true,
      isNewArrival: false,
      description: "A versatile rectangular frame with clean lines and classic proportions.",
      colors: [
        { colorName: "Whiskey Tortoise", colorHex: "#8B6914", isDefault: true },
        { colorName: "Jet Black", colorHex: "#0A0A0A", isDefault: false },
        { colorName: "Burnt Umber Tortoise", colorHex: "#6E3B2A", isDefault: false },
      ],
      tagNames: ["Classic Collection", "Year-Round", "Acetate", "Rectangle", "Best Sellers", "Staff Pick"],
    },
    {
      name: "Barkley",
      slug: "barkley",
      category: "FRAMES",
      subcategory: "eyeglasses",
      basePrice: 95,
      material: "acetate",
      shape: "rectangle",
      gender: "men",
      widthCategory: "wide",
      bridgeFit: "standard",
      isBestseller: true,
      isNewArrival: false,
      description: "A wider rectangular frame built for larger faces with bold acetate rims.",
      colors: [
        { colorName: "Whiskey Tortoise", colorHex: "#8B6914", isDefault: true },
        { colorName: "Jet Black", colorHex: "#0A0A0A", isDefault: false },
        { colorName: "English Oak", colorHex: "#5C4033", isDefault: false },
      ],
      tagNames: ["Classic Collection", "Year-Round", "Acetate", "Rectangle", "Best Sellers", "Home Try-On"],
    },
    {
      name: "Wright",
      slug: "wright",
      category: "FRAMES",
      subcategory: "eyeglasses",
      basePrice: 145,
      material: "metal",
      shape: "round",
      gender: "unisex",
      widthCategory: "medium",
      bridgeFit: "standard",
      isBestseller: false,
      isNewArrival: true,
      description: "A lightweight round metal frame with adjustable nose pads for all-day comfort.",
      colors: [
        { colorName: "Polished Gold", colorHex: "#D4AF37", isDefault: true },
        { colorName: "Antique Silver", colorHex: "#A8A9AD", isDefault: false },
        { colorName: "Polished Silver", colorHex: "#C0C0C0", isDefault: false },
      ],
      tagNames: ["Spring 2026", "Spring", "Metal", "Round", "New Arrivals", "Virtual Try-On"],
    },
    {
      name: "Ames",
      slug: "ames",
      category: "FRAMES",
      subcategory: "eyeglasses",
      basePrice: 95,
      material: "acetate",
      shape: "square",
      gender: "unisex",
      widthCategory: "medium",
      bridgeFit: "standard",
      isBestseller: false,
      isNewArrival: false,
      description: "A sleek square frame with subtle curves and everyday wearability.",
      colors: [
        { colorName: "Jet Black", colorHex: "#0A0A0A", isDefault: true },
        { colorName: "Crystal", colorHex: "#E8E8E8", isDefault: false },
        { colorName: "Blue Slate", colorHex: "#6A8EAE", isDefault: false },
      ],
      tagNames: ["Classic Collection", "Year-Round", "Acetate", "Square", "Home Try-On"],
    },
    {
      name: "Downing",
      slug: "downing",
      category: "FRAMES",
      subcategory: "eyeglasses",
      basePrice: 95,
      material: "acetate",
      shape: "rectangle",
      gender: "men",
      widthCategory: "wide",
      bridgeFit: "standard",
      isBestseller: true,
      isNewArrival: false,
      description: "A sophisticated wide-fit rectangle with bold temples and a commanding presence.",
      colors: [
        { colorName: "Black Matte Eclipse", colorHex: "#1C1C1C", isDefault: true },
        { colorName: "Whiskey Tortoise", colorHex: "#8B6914", isDefault: false },
        { colorName: "Striped Pacific", colorHex: "#3B6FA0", isDefault: false },
      ],
      tagNames: ["Classic Collection", "Year-Round", "Acetate", "Rectangle", "Best Sellers"],
    },
    {
      name: "Louise",
      slug: "louise",
      category: "FRAMES",
      subcategory: "eyeglasses",
      basePrice: 95,
      material: "acetate",
      shape: "cat-eye",
      gender: "women",
      widthCategory: "medium",
      bridgeFit: "standard",
      isBestseller: false,
      isNewArrival: true,
      description: "A modern cat-eye with subtle upswept corners and feminine proportions.",
      colors: [
        { colorName: "Jet Black", colorHex: "#0A0A0A", isDefault: true },
        { colorName: "Layered Violet Tortoise", colorHex: "#7B5EA7", isDefault: false },
        { colorName: "Rose Crystal", colorHex: "#F4C2C2", isDefault: false },
      ],
      tagNames: ["Spring 2026", "Spring", "Acetate", "Cat-Eye", "New Arrivals", "Staff Pick"],
    },
    {
      name: "Kimball",
      slug: "kimball",
      category: "FRAMES",
      subcategory: "eyeglasses",
      basePrice: 95,
      material: "acetate",
      shape: "rectangle",
      gender: "unisex",
      widthCategory: "narrow",
      bridgeFit: "standard",
      isBestseller: false,
      isNewArrival: false,
      description: "A narrow rectangular frame with a streamlined profile for smaller faces.",
      colors: [
        { colorName: "Jet Black", colorHex: "#0A0A0A", isDefault: true },
        { colorName: "Whiskey Tortoise", colorHex: "#8B6914", isDefault: false },
        { colorName: "Crystal", colorHex: "#E8E8E8", isDefault: false },
      ],
      tagNames: ["Classic Collection", "Year-Round", "Acetate", "Rectangle", "Home Try-On"],
    },
    {
      name: "Daisy",
      slug: "daisy",
      category: "FRAMES",
      subcategory: "eyeglasses",
      basePrice: 95,
      material: "acetate",
      shape: "round",
      gender: "women",
      widthCategory: "medium",
      bridgeFit: "standard",
      isBestseller: false,
      isNewArrival: true,
      description: "A playful round frame with warm colorways and a vintage-inspired silhouette.",
      colors: [
        { colorName: "Rosewater Crystal", colorHex: "#F5D5D5", isDefault: true },
        { colorName: "Tea Rose Fade", colorHex: "#F5C3C2", isDefault: false },
        { colorName: "Lemon Tortoise", colorHex: "#D4C75F", isDefault: false },
      ],
      tagNames: ["Spring 2026", "Spring", "Acetate", "Round", "New Arrivals"],
    },
    {
      name: "Felix",
      slug: "felix",
      category: "FRAMES",
      subcategory: "eyeglasses",
      basePrice: 95,
      material: "acetate",
      shape: "square",
      gender: "men",
      widthCategory: "wide",
      bridgeFit: "standard",
      isBestseller: true,
      isNewArrival: false,
      description: "A bold wide-fit square frame with thick rims and a strong profile.",
      colors: [
        { colorName: "Jet Black", colorHex: "#0A0A0A", isDefault: true },
        { colorName: "Striped Sassafras", colorHex: "#6B4226", isDefault: false },
        { colorName: "English Oak", colorHex: "#5C4033", isDefault: false },
      ],
      tagNames: ["Classic Collection", "Year-Round", "Acetate", "Square", "Best Sellers"],
    },
    {
      name: "Esme",
      slug: "esme",
      category: "FRAMES",
      subcategory: "eyeglasses",
      basePrice: 95,
      material: "acetate",
      shape: "cat-eye",
      gender: "women",
      widthCategory: "medium",
      bridgeFit: "standard",
      isBestseller: false,
      isNewArrival: false,
      description: "A dramatic cat-eye frame with elongated tips and rich acetate layers.",
      colors: [
        { colorName: "Jet Black", colorHex: "#0A0A0A", isDefault: true },
        { colorName: "Rose Crystal", colorHex: "#F4C2C2", isDefault: false },
        { colorName: "Violet Magnolia", colorHex: "#9B59B6", isDefault: false },
      ],
      tagNames: ["Classic Collection", "Year-Round", "Acetate", "Cat-Eye", "Virtual Try-On"],
    },
    {
      name: "Baker",
      slug: "baker",
      category: "FRAMES",
      subcategory: "eyeglasses",
      basePrice: 145,
      material: "metal",
      shape: "aviator",
      gender: "men",
      widthCategory: "wide",
      bridgeFit: "standard",
      isBestseller: true,
      isNewArrival: false,
      description: "A modern aviator in lightweight metal with a double bridge and slim temples.",
      colors: [
        { colorName: "Polished Gold", colorHex: "#D4AF37", isDefault: true },
        { colorName: "Antique Silver", colorHex: "#A8A9AD", isDefault: false },
        { colorName: "Brushed Ink", colorHex: "#36454F", isDefault: false },
      ],
      tagNames: ["Classic Collection", "Year-Round", "Metal", "Aviator", "Best Sellers", "Staff Pick"],
    },
    {
      name: "Tilley",
      slug: "tilley",
      category: "FRAMES",
      subcategory: "eyeglasses",
      basePrice: 95,
      material: "acetate",
      shape: "rectangle",
      gender: "unisex",
      widthCategory: "medium",
      bridgeFit: "low-bridge",
      isBestseller: false,
      isNewArrival: false,
      description: "A rectangle frame with low-bridge fit, offering comfort for wider nose bridges and higher cheekbones.",
      colors: [
        { colorName: "Jet Black", colorHex: "#0A0A0A", isDefault: true },
        { colorName: "Layered Tortoise Opal", colorHex: "#B8860B", isDefault: false },
        { colorName: "Agave Tortoise", colorHex: "#5F8575", isDefault: false },
      ],
      tagNames: ["Classic Collection", "Year-Round", "Acetate", "Rectangle", "Home Try-On"],
    },

    // ── Sunglasses ──────────────────────────────────────────────────
    {
      name: "Griffin",
      slug: "griffin",
      category: "SUNGLASSES",
      subcategory: "sunglasses",
      basePrice: 95,
      material: "acetate",
      shape: "square",
      gender: "unisex",
      widthCategory: "wide",
      bridgeFit: "standard",
      isBestseller: true,
      isNewArrival: false,
      description: "A wide-fit square sunglass with classic proportions and UV-protective lenses.",
      colors: [
        { colorName: "Jet Black", colorHex: "#0A0A0A", isDefault: true },
        { colorName: "Whiskey Tortoise", colorHex: "#8B6914", isDefault: false },
        { colorName: "Crystal", colorHex: "#E8E8E8", isDefault: false },
      ],
      tagNames: ["Summer 2026", "Summer", "Acetate", "Square", "Best Sellers"],
    },
    {
      name: "Toddy",
      slug: "toddy",
      category: "SUNGLASSES",
      subcategory: "sunglasses",
      basePrice: 95,
      material: "acetate",
      shape: "round",
      gender: "women",
      widthCategory: "medium",
      bridgeFit: "standard",
      isBestseller: false,
      isNewArrival: true,
      description: "A round sunglass with a retro vibe and gradient lenses for women.",
      colors: [
        { colorName: "Jet Black", colorHex: "#0A0A0A", isDefault: true },
        { colorName: "Hazelnut Tortoise", colorHex: "#8B7355", isDefault: false },
        { colorName: "Lapis Crystal", colorHex: "#26619C", isDefault: false },
      ],
      tagNames: ["Summer 2026", "Summer", "Acetate", "Round", "New Arrivals"],
    },
    {
      name: "Hayes",
      slug: "hayes",
      category: "SUNGLASSES",
      subcategory: "sunglasses",
      basePrice: 95,
      material: "acetate",
      shape: "rectangle",
      gender: "men",
      widthCategory: "wide",
      bridgeFit: "standard",
      isBestseller: true,
      isNewArrival: false,
      description: "A commanding rectangular sunglass with wide temples and strong lines.",
      colors: [
        { colorName: "Jet Black", colorHex: "#0A0A0A", isDefault: true },
        { colorName: "Whiskey Tortoise", colorHex: "#8B6914", isDefault: false },
        { colorName: "Black Matte Eclipse", colorHex: "#1C1C1C", isDefault: false },
      ],
      tagNames: ["Classic Collection", "Summer", "Acetate", "Rectangle", "Best Sellers"],
    },
    {
      name: "Nellie",
      slug: "nellie",
      category: "SUNGLASSES",
      subcategory: "sunglasses",
      basePrice: 95,
      material: "acetate",
      shape: "cat-eye",
      gender: "women",
      widthCategory: "medium",
      bridgeFit: "standard",
      isBestseller: false,
      isNewArrival: false,
      description: "A cat-eye sunglass with retro flair and high-contrast lenses.",
      colors: [
        { colorName: "Layered Ivory Tortoise", colorHex: "#D4C5A0", isDefault: true },
        { colorName: "Jet Black", colorHex: "#0A0A0A", isDefault: false },
        { colorName: "Plum", colorHex: "#8E4585", isDefault: false },
      ],
      tagNames: ["Classic Collection", "Summer", "Acetate", "Cat-Eye", "Virtual Try-On"],
    },
    {
      name: "Abe",
      slug: "abe",
      category: "SUNGLASSES",
      subcategory: "sunglasses",
      basePrice: 145,
      material: "metal",
      shape: "aviator",
      gender: "men",
      widthCategory: "wide",
      bridgeFit: "standard",
      isBestseller: false,
      isNewArrival: false,
      description: "A timeless metal aviator sunglass with teardrop lenses and slim temples.",
      colors: [
        { colorName: "Polished Gold", colorHex: "#D4AF37", isDefault: true },
        { colorName: "Antique Silver", colorHex: "#A8A9AD", isDefault: false },
      ],
      tagNames: ["Classic Collection", "Summer", "Metal", "Aviator"],
    },
    {
      name: "Beacon",
      slug: "beacon",
      category: "SUNGLASSES",
      subcategory: "sunglasses",
      basePrice: 95,
      material: "acetate",
      shape: "rectangle",
      gender: "unisex",
      widthCategory: "medium",
      bridgeFit: "standard",
      isBestseller: false,
      isNewArrival: false,
      description: "A versatile rectangular sunglass that transitions seamlessly from city to coast.",
      colors: [
        { colorName: "Jet Black", colorHex: "#0A0A0A", isDefault: true },
        { colorName: "Striped Sassafras", colorHex: "#6B4226", isDefault: false },
        { colorName: "English Oak", colorHex: "#5C4033", isDefault: false },
      ],
      tagNames: ["Classic Collection", "Year-Round", "Acetate", "Rectangle"],
    },

    // ── Accessories ─────────────────────────────────────────────────
    {
      name: "Clean My Lenses Kit",
      slug: "clean-my-lenses-kit",
      category: "ACCESSORIES",
      basePrice: 15,
      isBestseller: false,
      isNewArrival: false,
      description: "Everything you need to keep your lenses crystal clear: spray, cloth, and carrying pouch.",
      colors: [{ colorName: "Standard", colorHex: "#FFFFFF", isDefault: true }],
      tagNames: ["Year-Round"],
    },
    {
      name: "Lens Cleaning Cloth",
      slug: "lens-cleaning-cloth",
      category: "ACCESSORIES",
      basePrice: 5,
      isBestseller: false,
      isNewArrival: false,
      description: "Ultra-soft microfiber cloth for smudge-free lenses.",
      colors: [{ colorName: "Standard", colorHex: "#FFFFFF", isDefault: true }],
      tagNames: ["Year-Round"],
    },
    {
      name: "Hard Case",
      slug: "hard-case",
      category: "ACCESSORIES",
      basePrice: 25,
      isBestseller: false,
      isNewArrival: false,
      description: "A durable clamshell case lined with soft felt to protect your frames.",
      colors: [{ colorName: "Standard", colorHex: "#FFFFFF", isDefault: true }],
      tagNames: ["Year-Round"],
    },
    {
      name: "Pouch",
      slug: "pouch",
      category: "ACCESSORIES",
      basePrice: 15,
      isBestseller: false,
      isNewArrival: false,
      description: "A soft squeeze-top pouch that doubles as a cleaning cloth.",
      colors: [{ colorName: "Standard", colorHex: "#FFFFFF", isDefault: true }],
      tagNames: ["Year-Round"],
    },
  ];

  const productIds: Record<string, string> = {};

  for (const p of products) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        category: p.category,
        subcategory: p.subcategory ?? null,
        basePrice: p.basePrice,
        material: p.material ?? null,
        shape: p.shape ?? null,
        gender: p.gender ?? null,
        widthCategory: p.widthCategory ?? null,
        bridgeFit: p.bridgeFit ?? null,
        isBestseller: p.isBestseller,
        isNewArrival: p.isNewArrival,
        description: p.description ?? null,
        status: "LIVE",
        launchDate: new Date("2026-01-15"),
      },
    });

    productIds[p.name] = product.id;

    // Create variants
    for (const c of p.colors) {
      const skuBase = p.slug.replace(/-/g, "").toUpperCase();
      const skuColor = c.colorName.replace(/\s+/g, "-").toUpperCase();
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          colorName: c.colorName,
          colorHex: c.colorHex,
          sku: `WP-${skuBase}-${skuColor}`,
          isDefault: c.isDefault,
          inStock: true,
        },
      });
    }

    // Create product-tag associations
    for (const tagName of p.tagNames) {
      if (tags[tagName]) {
        await prisma.productTag.create({
          data: {
            productId: product.id,
            tagId: tags[tagName],
          },
        });
      }
    }
  }

  console.log(`Created ${products.length} products with variants and tags.`);

  // ── Stores ─────────────────────────────────────────────────────────
  const storeData = [
    // Northeast
    { storeCode: "WP-NYC-SOHO", name: "SoHo", address: "121 Greene St", city: "New York", state: "NY", zipCode: "10012", region: "Northeast", format: "FLAGSHIP" },
    { storeCode: "WP-NYC-UES", name: "Upper East Side", address: "927 Madison Ave", city: "New York", state: "NY", zipCode: "10021", region: "Northeast", format: "STANDARD" },
    { storeCode: "WP-BOS-NEWBURY", name: "Newbury Street", address: "139 Newbury St", city: "Boston", state: "MA", zipCode: "02116", region: "Northeast", format: "STANDARD" },
    { storeCode: "WP-BKN-WBURG", name: "Williamsburg", address: "94 N 6th St", city: "Brooklyn", state: "NY", zipCode: "11249", region: "Northeast", format: "STANDARD" },
    { storeCode: "WP-PHL-RITT", name: "Rittenhouse", address: "1524 Walnut St", city: "Philadelphia", state: "PA", zipCode: "19102", region: "Northeast", format: "STANDARD" },
    // Southeast
    { storeCode: "WP-MIA-DESIGN", name: "Design District", address: "140 NE 39th St", city: "Miami", state: "FL", zipCode: "33137", region: "Southeast", format: "FLAGSHIP" },
    { storeCode: "WP-ATL-BUCK", name: "Buckhead", address: "3035 Peachtree Rd NE", city: "Atlanta", state: "GA", zipCode: "30305", region: "Southeast", format: "STANDARD" },
    { storeCode: "WP-NSH-12S", name: "12South", address: "2703 12th Ave S", city: "Nashville", state: "TN", zipCode: "37204", region: "Southeast", format: "STANDARD" },
    { storeCode: "WP-CLT-SOUTH", name: "SouthPark", address: "4400 Sharon Rd", city: "Charlotte", state: "NC", zipCode: "28211", region: "Southeast", format: "SHOP_IN_SHOP" },
    { storeCode: "WP-DC-GTOWN", name: "Georgetown", address: "3107 M St NW", city: "Washington", state: "DC", zipCode: "20007", region: "Southeast", format: "STANDARD" },
    // Midwest
    { storeCode: "WP-CHI-LP", name: "Lincoln Park", address: "938 W Armitage Ave", city: "Chicago", state: "IL", zipCode: "60614", region: "Midwest", format: "FLAGSHIP" },
    { storeCode: "WP-CHI-WP", name: "Wicker Park", address: "1513 N Milwaukee Ave", city: "Chicago", state: "IL", zipCode: "60622", region: "Midwest", format: "STANDARD" },
    { storeCode: "WP-MSP-NLOOP", name: "North Loop", address: "212 N Washington Ave", city: "Minneapolis", state: "MN", zipCode: "55401", region: "Midwest", format: "STANDARD" },
    { storeCode: "WP-DET-MIDTOWN", name: "Midtown", address: "4240 Cass Ave", city: "Detroit", state: "MI", zipCode: "48201", region: "Midwest", format: "SHOP_IN_SHOP" },
    { storeCode: "WP-CMH-SHORT", name: "Short North", address: "789 N High St", city: "Columbus", state: "OH", zipCode: "43215", region: "Midwest", format: "STANDARD" },
    // West
    { storeCode: "WP-LA-ABBOT", name: "Abbot Kinney", address: "1225 Abbot Kinney Blvd", city: "Los Angeles", state: "CA", zipCode: "90291", region: "West", format: "FLAGSHIP" },
    { storeCode: "WP-SF-HAYES", name: "Hayes Valley", address: "414 Hayes St", city: "San Francisco", state: "CA", zipCode: "94102", region: "West", format: "STANDARD" },
    { storeCode: "WP-PDX-PEARL", name: "Pearl District", address: "1140 NW Everett St", city: "Portland", state: "OR", zipCode: "97209", region: "West", format: "STANDARD" },
    { storeCode: "WP-SEA-CAP", name: "Capitol Hill", address: "315 E Pine St", city: "Seattle", state: "WA", zipCode: "98122", region: "West", format: "STANDARD" },
    { storeCode: "WP-DEN-CHERRY", name: "Cherry Creek", address: "2929 E 3rd Ave", city: "Denver", state: "CO", zipCode: "80206", region: "West", format: "STANDARD" },
    // Southwest
    { storeCode: "WP-AUS-SOCO", name: "South Congress", address: "1601 S Congress Ave", city: "Austin", state: "TX", zipCode: "78704", region: "Southwest", format: "STANDARD" },
    { storeCode: "WP-DAL-HP", name: "Highland Park", address: "47 Highland Park Village", city: "Dallas", state: "TX", zipCode: "75205", region: "Southwest", format: "STANDARD" },
    { storeCode: "WP-HOU-RICE", name: "Rice Village", address: "2401 University Blvd", city: "Houston", state: "TX", zipCode: "77005", region: "Southwest", format: "STANDARD" },
    { storeCode: "WP-PHX-SCOTT", name: "Scottsdale", address: "7014 E Camelback Rd", city: "Scottsdale", state: "AZ", zipCode: "85251", region: "Southwest", format: "SHOP_IN_SHOP" },
    { storeCode: "WP-AUS-DOMAIN", name: "Domain", address: "11701 Domain Blvd", city: "Austin", state: "TX", zipCode: "78758", region: "Southwest", format: "STANDARD" },
  ];

  const storeIds: Record<string, string> = {};
  for (const s of storeData) {
    const store = await prisma.store.create({ data: s });
    storeIds[s.storeCode] = store.id;
  }
  console.log(`Created ${storeData.length} stores.`);

  // ── Store Clusters ─────────────────────────────────────────────────
  const clusterData = [
    // Format clusters
    { name: "Flagship Stores", description: "Full-size flagship locations with expanded assortment.", clusterType: "format" },
    { name: "Standard Stores", description: "Standard retail locations.", clusterType: "format" },
    { name: "Shop-in-Shop", description: "Smaller footprint locations within partner retailers.", clusterType: "format" },
    // Region clusters
    { name: "Northeast", description: "Stores in the Northeast region.", clusterType: "region" },
    { name: "Southeast", description: "Stores in the Southeast region.", clusterType: "region" },
    { name: "Midwest", description: "Stores in the Midwest region.", clusterType: "region" },
    { name: "West", description: "Stores in the West region.", clusterType: "region" },
    { name: "Southwest", description: "Stores in the Southwest region.", clusterType: "region" },
    // Performance clusters
    { name: "High Volume", description: "Top-performing stores by revenue volume.", clusterType: "performance" },
    { name: "Growth Market", description: "Stores in high-growth potential markets.", clusterType: "performance" },
  ];

  const clusterIds: Record<string, string> = {};
  for (const c of clusterData) {
    const cluster = await prisma.storeCluster.create({ data: c });
    clusterIds[c.name] = cluster.id;
  }
  console.log(`Created ${clusterData.length} store clusters.`);

  // ── Assign Stores to Clusters ──────────────────────────────────────

  // Format assignments
  const formatMap: Record<string, string> = {
    FLAGSHIP: "Flagship Stores",
    STANDARD: "Standard Stores",
    SHOP_IN_SHOP: "Shop-in-Shop",
  };
  for (const s of storeData) {
    await prisma.storeClusterAssignment.create({
      data: { storeId: storeIds[s.storeCode], clusterId: clusterIds[formatMap[s.format]] },
    });
  }

  // Region assignments
  for (const s of storeData) {
    await prisma.storeClusterAssignment.create({
      data: { storeId: storeIds[s.storeCode], clusterId: clusterIds[s.region] },
    });
  }

  // High Volume: flagships + select standards
  const highVolumeCodes = [
    "WP-NYC-SOHO", "WP-MIA-DESIGN", "WP-CHI-LP", "WP-LA-ABBOT",
    "WP-NYC-UES", "WP-BKN-WBURG", "WP-SF-HAYES", "WP-DC-GTOWN",
  ];
  for (const code of highVolumeCodes) {
    await prisma.storeClusterAssignment.create({
      data: { storeId: storeIds[code], clusterId: clusterIds["High Volume"] },
    });
  }

  // Growth Market
  const growthMarketCodes = [
    "WP-NSH-12S", "WP-AUS-SOCO", "WP-DEN-CHERRY", "WP-DET-MIDTOWN",
    "WP-CMH-SHORT", "WP-AUS-DOMAIN",
  ];
  for (const code of growthMarketCodes) {
    await prisma.storeClusterAssignment.create({
      data: { storeId: storeIds[code], clusterId: clusterIds["Growth Market"] },
    });
  }

  console.log("Assigned stores to clusters.");

  // ── Campaigns ──────────────────────────────────────────────────────
  await prisma.campaign.createMany({
    data: [
      {
        name: "Spring 2026 Collection Launch",
        description: "Launch campaign for the full Spring 2026 eyewear collection featuring new colorways and styles.",
        objective: "awareness",
        status: "ACTIVE",
        channels: JSON.stringify(["online", "in-store", "social", "email"]),
        startDate: new Date("2026-03-15"),
        endDate: new Date("2026-04-30"),
      },
      {
        name: "Summer Sun Event",
        description: "Seasonal sunglass promotion with in-store events and online exclusives.",
        objective: "conversion",
        status: "SCHEDULED",
        channels: JSON.stringify(["online", "in-store"]),
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-30"),
      },
      {
        name: "Back to School",
        description: "Back-to-school campaign targeting students and parents with prescription frame bundles.",
        objective: "conversion",
        status: "DRAFT",
        channels: JSON.stringify(["online", "in-store", "social", "email"]),
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-09-15"),
      },
    ],
  });
  console.log("Created 3 campaigns.");

  // ── Landing Pages ──────────────────────────────────────────────────
  await prisma.landingPage.createMany({
    data: [
      {
        title: "Spring Collection",
        slug: "spring-collection",
        status: "LIVE",
        blocks: JSON.stringify([
          { type: "hero", heading: "Spring 2026 Collection", subheading: "Fresh frames for a fresh season", imageUrl: "/images/spring-hero.jpg" },
          { type: "product-grid", title: "New Spring Frames", filter: { tag: "Spring 2026" }, columns: 4 },
          { type: "feature-callout", heading: "Home Try-On", body: "Try 5 frames at home for free.", ctaText: "Get Started", ctaUrl: "/home-try-on" },
        ]),
        publishAt: new Date("2026-03-01"),
      },
      {
        title: "Best Sellers",
        slug: "best-sellers",
        status: "LIVE",
        blocks: JSON.stringify([
          { type: "hero", heading: "Our Best Sellers", subheading: "The frames everyone is wearing", imageUrl: "/images/bestsellers-hero.jpg" },
          { type: "product-grid", title: "Top Frames", filter: { isBestseller: true }, columns: 4 },
        ]),
        publishAt: new Date("2026-01-01"),
      },
      {
        title: "New Arrivals",
        slug: "new-arrivals",
        status: "LIVE",
        blocks: JSON.stringify([
          { type: "hero", heading: "Just Dropped", subheading: "Be the first to wear our newest styles", imageUrl: "/images/new-arrivals-hero.jpg" },
          { type: "product-grid", title: "New Frames", filter: { isNewArrival: true }, columns: 4 },
        ]),
        publishAt: new Date("2026-01-15"),
      },
    ],
  });
  console.log("Created 3 landing pages.");

  // ── Planogram ──────────────────────────────────────────────────────
  const planogram = await prisma.planogram.create({
    data: {
      name: "Spring 2026 Standard Layout",
      description: "Standard in-store planogram for Spring 2026 featuring a wall unit and display table with 12 product slots.",
      version: 1,
      status: "APPROVED",
      instructions: "Place bestsellers at eye level on the wall unit. Feature new arrivals on the display table near the entrance.",
      complianceDeadline: new Date("2026-03-20"),
    },
  });

  // 12 slots: 8 wall unit, 4 display table
  const planogramProducts = [
    // Wall unit (eye-level bestsellers and classics)
    { fixtureType: "WALL_UNIT", position: 1, productName: "Durand" },
    { fixtureType: "WALL_UNIT", position: 2, productName: "Percey" },
    { fixtureType: "WALL_UNIT", position: 3, productName: "Haskell" },
    { fixtureType: "WALL_UNIT", position: 4, productName: "Barkley" },
    { fixtureType: "WALL_UNIT", position: 5, productName: "Baker" },
    { fixtureType: "WALL_UNIT", position: 6, productName: "Felix" },
    { fixtureType: "WALL_UNIT", position: 7, productName: "Downing" },
    { fixtureType: "WALL_UNIT", position: 8, productName: "Griffin" },
    // Display table (new arrivals + seasonal)
    { fixtureType: "DISPLAY_TABLE", position: 1, productName: "Chamberlain" },
    { fixtureType: "DISPLAY_TABLE", position: 2, productName: "Wright" },
    { fixtureType: "DISPLAY_TABLE", position: 3, productName: "Louise" },
    { fixtureType: "DISPLAY_TABLE", position: 4, productName: "Daisy" },
  ];

  for (const slot of planogramProducts) {
    await prisma.planogramSlot.create({
      data: {
        planogramId: planogram.id,
        fixtureType: slot.fixtureType,
        position: slot.position,
        productId: productIds[slot.productName],
        notes: slot.fixtureType === "DISPLAY_TABLE" ? "Spring 2026 new arrival feature" : undefined,
      },
    });
  }

  // Assign planogram to Standard Stores cluster
  await prisma.planogramClusterAssignment.create({
    data: {
      planogramId: planogram.id,
      clusterId: clusterIds["Standard Stores"],
    },
  });

  console.log("Created planogram with 12 slots.");

  // ── Summary ────────────────────────────────────────────────────────
  const productCount = await prisma.product.count();
  const variantCount = await prisma.productVariant.count();
  const storeCount = await prisma.store.count();
  const tagCount = await prisma.tag.count();

  console.log("\n--- Seed Complete ---");
  console.log(`  Products:  ${productCount}`);
  console.log(`  Variants:  ${variantCount}`);
  console.log(`  Stores:    ${storeCount}`);
  console.log(`  Tags:      ${tagCount}`);
  console.log("---------------------\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
