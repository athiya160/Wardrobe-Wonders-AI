import productModel from "../models/productModel.js";
import StoreProduct from "../models/StoreProductModel.js";
import Store from "../models/StoreModel.js";

/**
 * Direct Groq LLM Client for Node.js
 * Automatically supports qwen/qwen3.8-27b and openai/gpt-oss-20b with failover.
 */
async function callGroqLLM({ messages, json = true, temperature = 0.7 }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const models = [
    process.env.MODEL_NAME || "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
  ];

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const payload = {
        model,
        messages,
        temperature,
      };
      if (json) {
        payload.response_format = { type: "json_object" };
      }

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          return json ? JSON.parse(content) : content;
        }
      }
    } catch (err) {
      // Try next model or fallback
      continue;
    }
  }

  return null;
}

/**
 * Classify user intent into RENT, BUY, or HYBRID, and detect jewellery/pre-owned interests
 */
export function classifyShoppingIntent(message = "") {
  const text = String(message || "").toLowerCase();

  const buyPattern = /\b(buy|buying|purchase|purchasing|own|owning|pre-owned|preowned|second\s*hand|used|to\s*keep|forever|permanent|store)\b/i;
  const rentPattern = /\b(rent|rental|renting|hire|hiring|borrow|weekend|3\s*days?|event\s*only|temporary)\b/i;
  const jewelleryPattern = /\b(jewellery|jewelry|necklace|choker|jhumka|earrings?|bangles?|polki|kundan|1-gram|gold|silver|diamond)\b/i;
  const preOwnedPattern = /\b(pre-owned|preowned|second\s*hand|gently\s*used|vintage|resale)\b/i;

  const hasBuy = buyPattern.test(text);
  const hasRent = rentPattern.test(text);
  const hasJewellery = jewelleryPattern.test(text);
  const hasPreOwned = preOwnedPattern.test(text);

  let intent = "HYBRID";
  if (hasBuy && !hasRent) {
    intent = "BUY";
  } else if (hasRent && !hasBuy) {
    intent = "RENT";
  }

  return {
    intent,
    hasBuy,
    hasRent,
    hasJewellery,
    hasPreOwned,
  };
}

/**
 * Eligible Rental Recommendations from productModel
 */
export async function aiRentalRecommendations({ query, maxBudget, gender, category, limit = 6 } = {}) {
  try {
    let filter = {
      availability: { $ne: false },
    };

    if (maxBudget && !isNaN(maxBudget)) {
      filter.price = { $lte: Number(maxBudget) };
    }

    if (gender) {
      const g = String(gender).toLowerCase();
      if (g === "jewellery" || g === "jewelry") {
        filter.$or = [{ gender: "jewellery" }, { category: "Jewellery" }];
      } else {
        filter.gender = g;
      }
    }

    if (category && !filter.$or) {
      filter.category = new RegExp(category, "i");
    }

    if (query) {
      const tokens = String(query).toLowerCase().split(/\s+/).filter((t) => t.length > 2);
      if (tokens.length > 0 && !filter.$or) {
        const orConditions = [];
        for (const token of tokens) {
          const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regex = new RegExp(escaped, "i");
          orConditions.push(
            { name: regex },
            { category: regex },
            { gender: regex },
            { color: regex },
            { tags: regex },
            { description: regex }
          );
        }
        filter.$or = orConditions;
      }
    }

    let items = await productModel.find(filter).limit(limit * 2).lean();

    if (items.length < 2) {
      const backfillFilter = { availability: { $ne: false } };
      if (filter.price) backfillFilter.price = filter.price;
      const backfill = await productModel
        .find(backfillFilter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      const existingIds = new Set(items.map((i) => String(i._id)));
      for (const b of backfill) {
        if (!existingIds.has(String(b._id))) {
          items.push(b);
        }
      }
    }

    return items.slice(0, limit).map((p) => ({
      _id: p._id,
      name: p.name,
      title: p.name,
      price: p.price,
      rentalPricePerDay: p.rentalPricePerDay || p.price,
      securityDeposit: p.securityDeposit || 0,
      category: p.category,
      gender: p.gender || "Women",
      image: p.image || (Array.isArray(p.images) && p.images[0]) || "/assets/Women/bridal_01.png",
      images: p.images?.length > 0 ? p.images : (p.image ? [p.image] : ["/assets/Women/bridal_01.png"]),
      type: "RENTAL",
      url: `/product/${p._id}`,
    }));
  } catch (err) {
    console.error("aiRentalRecommendations error:", err);
    return [];
  }
}

/**
 * Eligible Store (Buy) Recommendations from StoreProductModel
 * Strict validation: status: 'APPROVED', stockQuantity > 0, store status: 'ACTIVE'
 */
export async function aiStoreBuyRecommendations({ query, category, condition, maxBudget, limit = 6 } = {}) {
  try {
    const filter = {
      status: "APPROVED",
      stockQuantity: { $gt: 0 },
    };

    if (condition && ["NEW", "PRE_OWNED"].includes(String(condition).toUpperCase())) {
      filter.condition = String(condition).toUpperCase();
    }

    if (maxBudget && !isNaN(maxBudget)) {
      filter.price = { $lte: Number(maxBudget) };
    }

    if (category) {
      filter.category = new RegExp(category, "i");
    }

    if (query) {
      const tokens = String(query).toLowerCase().split(/\s+/).filter((t) => t.length > 2);
      if (tokens.length > 0 && !filter.category) {
        const orConditions = [];
        for (const token of tokens) {
          const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regex = new RegExp(escaped, "i");
          orConditions.push(
            { title: regex },
            { description: regex },
            { category: regex },
            { subcategory: regex },
            { brand: regex }
          );
        }
        filter.$or = orConditions;
      }
    }

    let items = await StoreProduct.find(filter)
      .populate("storeId", "storeName storeSlug status")
      .sort({ rating: -1, createdAt: -1 })
      .limit(limit * 2)
      .lean();

    // Strict invariant: seller store must be ACTIVE
    items = items.filter((p) => p.storeId && p.storeId.status === "ACTIVE");

    // Backfill with approved in-stock items from active stores if query yielded few
    if (items.length < 2) {
      const backfillFilter = {
        status: "APPROVED",
        stockQuantity: { $gt: 0 },
      };
      if (filter.condition) backfillFilter.condition = filter.condition;
      if (filter.price) backfillFilter.price = filter.price;

      const backfill = await StoreProduct.find(backfillFilter)
        .populate("storeId", "storeName storeSlug status")
        .sort({ rating: -1, createdAt: -1 })
        .limit(limit)
        .lean();

      const validBackfill = backfill.filter((p) => p.storeId && p.storeId.status === "ACTIVE");
      const existingIds = new Set(items.map((i) => String(i._id)));
      for (const b of validBackfill) {
        if (!existingIds.has(String(b._id))) {
          items.push(b);
        }
      }
    }

    return items.slice(0, limit).map((p) => ({
      _id: p._id,
      name: p.title,
      title: p.title,
      price: p.price,
      condition: p.condition || "NEW",
      conditionDescription: p.conditionDescription || "",
      category: p.category,
      brand: p.brand || p.storeId?.storeName || "Wardrobe Designer",
      storeName: p.storeId?.storeName || "Wardrobe Wonders Store",
      storeSlug: p.storeId?.storeSlug || "",
      image: (Array.isArray(p.images) && p.images[0]) || "/assets/Store/store_default.png",
      images: p.images || [],
      stockQuantity: p.stockQuantity,
      rating: p.rating || 5,
      reviewsCount: p.reviewsCount || 0,
      type: "STORE",
      url: `/store/product/${p._id}`,
    }));
  } catch (err) {
    console.error("aiStoreBuyRecommendations error:", err);
    return [];
  }
}

/**
 * 1. AI Fashion Stylist Chat (RAG over MongoDB Catalog & Dual-Domain Rent/Buy)
 */
export async function aiStylistChat(userMessage) {
  const message = String(userMessage || "").trim();
  if (!message) {
    return {
      text: "Hello! I am your AI Fashion Stylist at Wardrobe Wonders. What occasion, style, or outfit are you looking for today? We offer both luxury designer rentals and permanent store purchases.",
      intent: "HYBRID",
      rentalProducts: [],
      storeProducts: [],
      products: [],
    };
  }

  const intentMeta = classifyShoppingIntent(message);

  // Parse budget if user mentions numbers
  const budgetMatch =
    message.match(/(?:under|below|less than|within|around)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i) ||
    message.match(/(\d+)\s*(?:budget|rupees|rs)/i);
  const maxBudget = budgetMatch ? Number(budgetMatch[1]) : null;

  // Retrieve candidate items from both domains based on intent
  let rentalCandidates = [];
  let storeCandidates = [];

  if (intentMeta.intent === "RENT") {
    rentalCandidates = await aiRentalRecommendations({ query: message, maxBudget, limit: 4 });
    storeCandidates = await aiStoreBuyRecommendations({ query: message, maxBudget, limit: 2 });
  } else if (intentMeta.intent === "BUY") {
    storeCandidates = await aiStoreBuyRecommendations({
      query: message,
      maxBudget,
      condition: intentMeta.hasPreOwned ? "PRE_OWNED" : null,
      limit: 4,
    });
    rentalCandidates = await aiRentalRecommendations({ query: message, maxBudget, limit: 2 });
  } else {
    // HYBRID
    rentalCandidates = await aiRentalRecommendations({ query: message, maxBudget, limit: 3 });
    storeCandidates = await aiStoreBuyRecommendations({ query: message, maxBudget, limit: 3 });
  }

  // Construct catalog summaries for Groq LLM
  const rentalSummary = rentalCandidates
    .map(
      (p) =>
        `[RENTAL ID: ${p._id}] Name: "${p.name}", Category: "${p.category}", Rental: ₹${p.price}/3-days, Gender: "${p.gender}"`
    )
    .join("\n");

  const storeSummary = storeCandidates
    .map(
      (p) =>
        `[STORE BUY ID: ${p._id}] Title: "${p.title}", Category: "${p.category}", Purchase: ₹${p.price}, Condition: ${p.condition}, Seller: "${p.storeName}"`
    )
    .join("\n");

  const groqPrompt = [
    {
      role: "system",
      content: `You are an elite, warm, and articulate AI Fashion Stylist for 'Wardrobe Wonders', India's premier luxury fashion destination offering BOTH Haute Couture Rentals and an exclusive Store Marketplace to buy designer and pre-owned pieces.
Your mission is to provide personalized, high-fashion styling recommendations based on the customer's request.
Always explain the distinction between:
- "Recommended to Rent": Ideal for luxury events, weddings, and galas without full ownership costs.
- "Recommended to Buy": Designer couture or authenticated pre-owned pieces to keep forever.

AVAILABLE RENTAL CATALOG:
${rentalSummary || "No rental items currently matching."}

AVAILABLE STORE (BUY) CATALOG:
${storeSummary || "No store items currently matching."}

Recommend matching items by their exact IDs from the catalogs above.
Respond strictly in valid JSON:
{
  "text": "Your warm, professional, high-fashion advice explaining the style, occasion match, and rent vs buy recommendations.",
  "recommended_rental_ids": ["id1"],
  "recommended_store_ids": ["id2"]
}`,
    },
    {
      role: "user",
      content: message,
    },
  ];

  const groqResult = await callGroqLLM({ messages: groqPrompt, json: true });

  let finalRentals = rentalCandidates;
  let finalStores = storeCandidates;

  if (groqResult && groqResult.text) {
    if (Array.isArray(groqResult.recommended_rental_ids) && groqResult.recommended_rental_ids.length > 0) {
      const rIds = groqResult.recommended_rental_ids.map(String);
      const matched = rentalCandidates.filter((r) => rIds.includes(String(r._id)));
      if (matched.length > 0) finalRentals = matched;
    }
    if (Array.isArray(groqResult.recommended_store_ids) && groqResult.recommended_store_ids.length > 0) {
      const sIds = groqResult.recommended_store_ids.map(String);
      const matched = storeCandidates.filter((s) => sIds.includes(String(s._id)));
      if (matched.length > 0) finalStores = matched;
    }

    return {
      text: groqResult.text,
      intent: intentMeta.intent,
      rentalProducts: finalRentals,
      storeProducts: finalStores,
      products: [...finalRentals, ...finalStores],
      source: "groq_direct_rag",
    };
  }

  // Resilient heuristic concierge response
  let adviceText = "";
  if (intentMeta.intent === "BUY") {
    adviceText = `For purchasing your dream outfit for "${message}", I recommend these verified pieces from our Store marketplace. Each piece is authenticated and ready for prompt courier dispatch to your doorstep.`;
  } else if (intentMeta.intent === "RENT") {
    adviceText = `For your upcoming occasion ("${message}"), renting allows you to wear premium designer couture at a fraction of the retail cost, complete with sanitized delivery and hassle-free returns.`;
  } else {
    adviceText = `Here are curated options for "${message}". You can choose to rent designer couture for your special event, or purchase authenticated new & pre-owned pieces to keep in your permanent wardrobe!`;
  }

  return {
    text: adviceText,
    intent: intentMeta.intent,
    rentalProducts: finalRentals,
    storeProducts: finalStores,
    products: [...finalRentals, ...finalStores],
    source: "resilient_semantic_fallback",
  };
}

/**
 * 2. AI Outfit Recommendation for Stylist Page (/stylist)
 */
export async function aiOutfitRecommendation({ occasion, budget, gender, color, season, style }) {
  let query = {};
  const isJewellery = gender && (gender.toLowerCase() === "jewellery" || gender.toLowerCase() === "jewelry");

  if (isJewellery) {
    query.$or = [{ gender: "jewellery" }, { category: "Jewellery" }];
    if (occasion && occasion !== "all") {
      query.$and = [
        { $or: [{ gender: "jewellery" }, { category: "Jewellery" }] },
        { $or: [{ occasion: new RegExp(occasion, "i") }, { description: new RegExp(occasion, "i") }, { tags: new RegExp(occasion, "i") }] }
      ];
      delete query.$or;
    }
  } else {
    if (gender) query.gender = String(gender).toLowerCase();
    if (occasion) query.category = new RegExp(occasion, "i");
  }

  if (budget) query.price = { $lte: Number(budget) };

  let products = await productModel.find(query).limit(6);
  if (!products || products.length === 0) {
    if (isJewellery) {
      products = await productModel.find({ $or: [{ gender: "jewellery" }, { category: "Jewellery" }] }).limit(6);
    } else {
      products = await productModel.find().limit(6);
    }
  }

  // Generate dynamic styling rationale via Groq
  const itemsText = products.map((p) => `ID: ${p._id}, Name: ${p.name}, Price: ₹${p.price}`).join("\n");
  const prompt = [
    {
      role: "system",
      content: `You are an AI Stylist. Given a user preference (Occasion: ${occasion}, Style: ${style}, Season: ${season}, Color: ${color}), write a 1-sentence styling reason for each product.
Products:
${itemsText}

Respond in JSON:
{
  "reasons": {
    "product_id": "Tailored 1-sentence reason why it fits their occasion and style."
  }
}`,
    },
  ];

  const groqResult = await callGroqLLM({ messages: prompt, json: true });
  const reasonsMap = groqResult?.reasons || {};

  const formattedOutfit = products.map((p) => ({
    product: p,
    reason:
      reasonsMap[String(p._id)] ||
      `This ${p.name} balances ${style || "sophisticated"} aesthetics with luxurious comfort, tailored specifically for a ${occasion || "celebration"}.`,
  }));

  return { outfit: formattedOutfit };
}

/**
 * 3. AI Garment Description Generator for Provider Studio
 */
export async function aiGenerateDescription({ productName, category, price, brand }) {
  const cleanName = (productName || "Luxury Garment").trim();
  const cleanCategory = (category || "Occasion Wear").trim();
  const numPrice = Number(price) || 2500;
  const cleanBrand = (brand || "Wardrobe Wonders").trim();

  const prompt = [
    {
      role: "system",
      content: `You are an elite fashion copywriter for a high-end luxury dress rental boutique.
Generate an SEO-optimized title, a compelling 3-sentence description, 5 luxury tags, and the recommended occasion.
Garment: "${cleanName}", Category: "${cleanCategory}", Brand: "${cleanBrand}", Rental: ₹${numPrice}/day.

Respond in JSON:
{
  "title": "...",
  "description": "...",
  "tags": ["...", "..."],
  "occasion": "..."
}`,
    },
  ];

  const groqResult = await callGroqLLM({ messages: prompt, json: true });
  if (groqResult && groqResult.title && groqResult.description) {
    return {
      status: true,
      source: "groq_direct",
      data: groqResult,
    };
  }

  // Fallback
  return {
    status: true,
    source: "editorial_fashion_ai",
    data: {
      title: `${cleanBrand} ${cleanName} - Premium ${cleanCategory} Collection`,
      description: `Turn heads in this exquisite ${cleanName}. Masterfully designed for high-profile events, this piece balances couture aesthetics with flattering comfort. Tailored with premium luxury fabric and intricate finishing.`,
      tags: [cleanCategory, "Designer Rental", "Luxury Fashion", "Couture", "Boutique"],
      occasion: "Bridal Receptions, Galas & Celebrations",
    },
  };
}

/**
 * 4. AI Tag Extractor for Provider Studio
 */
export async function aiGenerateTags({ productName, category, description }) {
  const text = `${productName || ""} ${category || ""} ${description || ""}`;
  const prompt = [
    {
      role: "system",
      content: `Extract structured tags from this garment information:
"${text}"

Respond in JSON:
{
  "color": "primary color or N/A",
  "pattern": "e.g. embroidered, floral, solid, sequined",
  "style": "e.g. elegant, contemporary, traditional, royal",
  "season": "e.g. all-season, festive, summer, winter"
}`,
    },
  ];

  const groqResult = await callGroqLLM({ messages: prompt, json: true });
  if (groqResult && groqResult.style) {
    return {
      status: true,
      source: "groq_direct",
      data: groqResult,
    };
  }

  return {
    status: true,
    source: "heuristic_tags",
    data: {
      color: "Designer Palette",
      pattern: "Embroidered",
      style: "Contemporary Royal",
      season: "All-Season Festive",
    },
  };
}
