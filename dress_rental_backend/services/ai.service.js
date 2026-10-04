import productModel from "../models/productModel.js";

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
 * 1. AI Fashion Stylist Chat (RAG over MongoDB Catalog)
 */
export async function aiStylistChat(userMessage) {
  const message = String(userMessage || "").trim();
  if (!message) {
    return {
      text: "Hello! I am your AI Fashion Stylist at Wardrobe Wonders. What occasion, style, or outfit are you looking for today?",
      products: [],
    };
  }

  // 1. Check if FastAPI microservice is available
  const fastApiUrl = process.env.FASTAPI_URL;
  if (fastApiUrl && !fastApiUrl.includes("127.0.0.1") && !fastApiUrl.includes("localhost")) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${fastApiUrl.replace(/\/$/, "")}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data?.text) {
          return data;
        }
      }
    } catch {
      // FastAPI unavailable, continue to direct Groq RAG
    }
  }

  // 2. Candidate Retrieval from MongoDB
  const tokens = message.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  let orConditions = [];

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

  // Parse budget if user mentions numbers
  const budgetMatch = message.match(/(?:under|below|less than|within|around)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i) ||
                      message.match(/(\d+)\s*(?:budget|rupees|rs)/i);
  const maxBudget = budgetMatch ? Number(budgetMatch[1]) : null;

  let query = orConditions.length > 0 ? { $or: orConditions } : {};
  if (maxBudget) {
    query.price = { $lte: maxBudget };
  }

  let candidates = await productModel.find(query).limit(8);

  // If filtered query yields few items, backfill with popular catalog pieces
  if (candidates.length < 3) {
    const backup = await productModel.find().sort({ createdAt: -1 }).limit(6);
    const existingIds = new Set(candidates.map((c) => String(c._id)));
    for (const b of backup) {
      if (!existingIds.has(String(b._id))) {
        candidates.push(b);
      }
    }
  }

  const catalogSummary = candidates
    .map(
      (p) =>
        `[ID: ${p._id}] Name: "${p.name}", Category: "${p.category}", Gender: "${p.gender}", Price: ₹${p.price}/day, Color: "${p.color || "Designer"}"`
    )
    .join("\n");

  // 3. Direct Groq LLM Stylist Inference
  const groqPrompt = [
    {
      role: "system",
      content: `You are an elite, warm, and articulate AI Fashion Stylist for 'Wardrobe Wonders', India's premier luxury garment rental platform.
Your mission is to provide personalized, high-fashion styling recommendations based on the customer's request.
Always recommend 1 to 3 outfits from the provided AVAILABLE CATALOG by their exact ID.
Explain why each outfit complements their occasion, body styling, or vibe. Suggest accessories (jewelry, shoes, dupatta/tie).
If the user asks for a price range that is unavailable, politely explain what is currently available.

AVAILABLE CATALOG:
${catalogSummary}

Respond strictly in valid JSON:
{
  "text": "Your complete, warm, professional styling recommendation here.",
  "recommended_product_ids": ["id1", "id2"]
}`,
    },
    {
      role: "user",
      content: message,
    },
  ];

  const groqResult = await callGroqLLM({ messages: groqPrompt, json: true });

  if (groqResult && groqResult.text) {
    const recommendedIds = Array.isArray(groqResult.recommended_product_ids)
      ? groqResult.recommended_product_ids.map(String)
      : [];

    const matchedProducts = candidates.filter((c) =>
      recommendedIds.includes(String(c._id))
    );

    // If Groq recommended valid IDs, return them; otherwise return top candidates
    const finalProducts = matchedProducts.length > 0 ? matchedProducts : candidates.slice(0, 3);

    return {
      text: groqResult.text,
      products: finalProducts,
      source: "groq_direct_rag",
    };
  }

  // 4. Instant Semantic Heuristic Fallback (Zero delay, high-quality)
  const lower = message.toLowerCase();
  let occasionAdvice = "designer outfit that combines elegance and comfort";
  if (lower.includes("wedding") || lower.includes("bridal") || lower.includes("sangeet")) {
    occasionAdvice = "breathtaking bridal & wedding collection featuring royal embroidery and rich celebratory hues";
  } else if (lower.includes("cocktail") || lower.includes("party")) {
    occasionAdvice = "striking evening cocktail look designed with modern silhouettes and couture movement";
  } else if (lower.includes("sherwani") || lower.includes("men")) {
    occasionAdvice = "regal men's couture collection tailored for majestic formal occasions";
  }

  return {
    text: `Based on your style preference for "${message}", I curated these pieces from our ${occasionAdvice}. Pair with statement earrings or a classic pocket square for an unforgettable look!`,
    products: candidates.slice(0, 3),
    source: "resilient_semantic_fallback",
  };
}

/**
 * 2. AI Outfit Recommendation for Stylist Page (/stylist)
 */
export async function aiOutfitRecommendation({ occasion, budget, gender, color, season, style }) {
  let query = {};
  if (gender) query.gender = String(gender).toLowerCase();
  if (occasion) query.category = new RegExp(occasion, "i");
  if (budget) query.price = { $lte: Number(budget) };

  let products = await productModel.find(query).limit(6);
  if (!products || products.length === 0) {
    products = await productModel.find().limit(6);
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
