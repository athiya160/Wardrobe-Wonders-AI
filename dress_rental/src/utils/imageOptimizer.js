import { BASE_URL } from "../config/axiosConfig";

/**
 * Clean Category-Appropriate Fallback Imagery
 * Guarantees that if an uploaded photo or remote URL is unreachable,
 * garments display an authentic, category-accurate fallback rather than
 * a single generic women's cocktail gown everywhere.
 */
export function getCategoryFallbackImage(gender = "", category = "") {
  const g = String(gender || "").toLowerCase();
  const c = String(category || "").toLowerCase();

  // Men's categories
  if (g === "men" || c.includes("sherwani") || c.includes("suit") || c.includes("tuxedo") || c.includes("kurta")) {
    if (c.includes("casual")) return "/assets/Men/casual_01.png";
    if (c.includes("sherwani") || c.includes("wedding") || c.includes("groom")) return "/assets/Men/sherwani_01.png";
    return "/assets/Men/suit_01.png";
  }

  // Fine & Temple Jewellery
  if (g === "jewellery" || g === "jewelry" || c.includes("jewel") || c.includes("kundan") || c.includes("temple") || c.includes("gold") || c.includes("choker")) {
    return "/assets/Jewellery/image_20261019_002031.jpg";
  }

  // Accessories & Bangles
  if (c.includes("accessori") || c.includes("bangle") || c.includes("clutch") || c.includes("potli")) {
    return "/assets/Jewellery/image_20261019_002925.jpg";
  }

  // Footwear / Juttis
  if (c.includes("footwear") || c.includes("shoe") || c.includes("jutti")) {
    return "/assets/Formal.jpg";
  }

  // Women's categories
  if (c.includes("casual")) return "/assets/Women/look_01.png";
  if (c.includes("traditional") || c.includes("festive") || c.includes("saree") || c.includes("anarkali")) {
    return "/assets/Women/festive_01.png";
  }
  if (c.includes("party") || c.includes("evening") || c.includes("cocktail") || c.includes("gown")) {
    return "/assets/Women/outfit_01.png";
  }

  // Default Women's Couture / Bridal
  return "/assets/Women/bridal_01.png";
}

/**
 * Intelligent Image Resolver
 * Resolves the true product image URL from MongoDB document fields (image, images[], imageUrl),
 * resolves local uploads against the active backend BASE_URL, optimizes Cloudinary delivery,
 * and falls back gracefully to a category-accurate image.
 */
export function resolveProductImage(product, width = 600) {
  if (!product) return getCategoryFallbackImage();

  let rawUrl = "";
  let gender = "";
  let category = "";

  if (typeof product === "string") {
    rawUrl = product.trim();
  } else if (Array.isArray(product)) {
    rawUrl = (product.find((item) => typeof item === "string" && item.trim()) || "").trim();
  } else if (typeof product === "object") {
    gender = product.gender || "";
    category = product.category || "";

    if (typeof product.image === "string" && product.image.trim()) {
      rawUrl = product.image.trim();
    } else if (Array.isArray(product.images) && product.images.length > 0) {
      rawUrl = (product.images.find((item) => typeof item === "string" && item.trim()) || "").trim();
    } else if (typeof product.imageUrl === "string" && product.imageUrl.trim()) {
      rawUrl = product.imageUrl.trim();
    } else if (typeof product.photo === "string" && product.photo.trim()) {
      rawUrl = product.photo.trim();
    }
  }

  // If missing or unpopulated, provide category-specific fallback
  if (!rawUrl) {
    return getCategoryFallbackImage(gender, category);
  }

  // Prevent placeholder repeating
  if (rawUrl.includes("res.cloudinary.com/demo/image/upload/sample.jpg")) {
    return getCategoryFallbackImage(gender, category);
  }

  // Rewrite localhost upload paths to active live backend BASE_URL
  if (rawUrl.startsWith("http://localhost:4000/uploads/") || rawUrl.startsWith("http://127.0.0.1:4000/uploads/")) {
    const filename = rawUrl.split("/uploads/")[1];
    return `${BASE_URL}/uploads/${filename}`;
  }

  // Optimize Cloudinary URLs dynamically without mutating stored database records
  if (rawUrl.includes("res.cloudinary.com") && rawUrl.includes("/upload/")) {
    if (rawUrl.includes("/upload/f_auto") || rawUrl.includes("/upload/w_")) {
      return rawUrl;
    }
    return rawUrl.replace("/upload/", `/upload/f_auto,q_auto:good,w_${width},c_limit/`);
  }

  return rawUrl;
}

/**
 * Cloudinary & Responsive Image Optimizer (Backwards Compatible)
 */
export function getOptimizedImageUrl(url, width = 600, category = "", gender = "") {
  if (!url) {
    return getCategoryFallbackImage(gender, category);
  }

  if (Array.isArray(url)) {
    const first = url.find((u) => typeof u === "string" && u.trim());
    return resolveProductImage(first || { gender, category }, width);
  }

  if (typeof url === "object") {
    return resolveProductImage(url, width);
  }

  return resolveProductImage({ image: url, gender, category }, width);
}
