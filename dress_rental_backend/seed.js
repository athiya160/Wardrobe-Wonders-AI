import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Product from "./models/productModel.js";
import UserModel from "./models/UserModel.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dress_rental";

const mockProducts = [
  // Women — Bridal & Wedding
  { name: "Regal Crimson Bridal Lehenga", price: 14000, advance: "3000", image: "/assets/Women/bridal_01.png", stock: "3", category: "Wedding", gender: "women" },
  { name: "Peach Rose Gold Embroidered Bridal Lehenga", price: 15500, advance: "3500", image: "/assets/Women/bridal_02.png", stock: "2", category: "Wedding", gender: "women" },
  { name: "Maroon Velvet Royal Bridal Lehenga", price: 16800, advance: "4000", image: "/assets/Women/bridal_03.png", stock: "4", category: "Wedding", gender: "women" },
  { name: "Ivory Gold Reception Lehenga", price: 12500, advance: "3000", image: "/assets/Women/bridal_04.png", stock: "3", category: "Wedding", gender: "women" },
  { name: "Emerald Green Embroidered Bridal Lehenga", price: 15800, advance: "3500", image: "/assets/Women/bridal_05.png", stock: "2", category: "Wedding", gender: "women" },
  { name: "Rani Pink Designer Embroidered Lehenga", price: 13500, advance: "3000", image: "/assets/Women/bridal_06.png", stock: "4", category: "Wedding", gender: "women" },
  { name: "Lavender Lilac Zari Bridal Lehenga", price: 14200, advance: "3200", image: "/assets/Women/bridal_07.png", stock: "3", category: "Wedding", gender: "women" },
  { name: "Midnight Navy Zari Lehenga Choli", price: 14800, advance: "3400", image: "/assets/Women/bridal_08.png", stock: "2", category: "Wedding", gender: "women" },

  // Women — Traditional & Festive
  { name: "Crimson Red Banarasi Silk Saree", price: 3400, advance: "800", image: "/assets/Women/festive_01.png", stock: "8", category: "Traditional", gender: "women" },
  { name: "Ivory & Gold Tissue Silk Saree", price: 3600, advance: "900", image: "/assets/Women/festive_02.png", stock: "6", category: "Traditional", gender: "women" },
  { name: "Emerald Green Embroidered Anarkali Gown", price: 3900, advance: "950", image: "/assets/Women/festive_03.png", stock: "5", category: "Traditional", gender: "women" },
  { name: "Mustard Haldi Festive Kurta & Trouser Set", price: 2600, advance: "600", image: "/assets/Women/festive_04.png", stock: "10", category: "Traditional", gender: "women" },
  { name: "Lilac Lavender Silk Kurta & Trouser Set", price: 2700, advance: "650", image: "/assets/Women/festive_05.png", stock: "7", category: "Traditional", gender: "women" },
  { name: "Rani Pink Embroidered Festive Lehenga Choli", price: 4200, advance: "1000", image: "/assets/Women/festive_06.png", stock: "6", category: "Traditional", gender: "women" },
  { name: "Teal Blue Silk Kurta & Trouser Set", price: 2800, advance: "700", image: "/assets/Women/festive_07.png", stock: "5", category: "Traditional", gender: "women" },
  { name: "Regal Black Zari Banarasi Silk Saree", price: 3800, advance: "900", image: "/assets/Women/festive_08.png", stock: "9", category: "Traditional", gender: "women" },

  // Women — Party & Evening Wear
  { name: "Midnight Blue Sequin Party Saree", price: 3600, advance: "900", image: "/assets/Women/outfit_01.png", stock: "5", category: "Party", gender: "women" },
  { name: "Burgundy Wine Sequin Bustier Lehenga", price: 4800, advance: "1200", image: "/assets/Women/outfit_02.png", stock: "4", category: "Party", gender: "women" },
  { name: "Obsidian Black Halter Evening Jumpsuit", price: 2900, advance: "700", image: "/assets/Women/outfit_03.png", stock: "6", category: "Evening Wear", gender: "women" },
  { name: "Champagne Rose Shimmer Cocktail Lehenga", price: 4600, advance: "1100", image: "/assets/Women/outfit_04.png", stock: "5", category: "Party", gender: "women" },
  { name: "Emerald Green One-Shoulder Satin Slit Gown", price: 3800, advance: "950", image: "/assets/Women/outfit_05.png", stock: "4", category: "Evening Wear", gender: "women" },
  { name: "Dusty Rose Embroidered Georgette Sharara Set", price: 3200, advance: "800", image: "/assets/Women/outfit_06.png", stock: "7", category: "Traditional", gender: "women" },
  { name: "Midnight Black Sequin One-Shoulder Cocktail Dress", price: 3500, advance: "850", image: "/assets/Women/outfit_07.png", stock: "6", category: "Party", gender: "women" },
  { name: "Ice Blue Starlight Embroidered Lehenga Choli", price: 4500, advance: "1100", image: "/assets/Women/outfit_08.png", stock: "4", category: "Party", gender: "women" },
  { name: "Navy Blue Tailored Luxe Power Pantsuit", price: 2800, advance: "700", image: "/assets/Women/outfit_09.png", stock: "5", category: "Evening Wear", gender: "women" },
  { name: "Royal Plum Grecian One-Shoulder Drape Gown", price: 3900, advance: "950", image: "/assets/Women/outfit_10.png", stock: "5", category: "Evening Wear", gender: "women" },

  // Women — Smart Casual & Contemporary
  { name: "Classic White Blouse & High-Rise Denim", price: 1400, advance: "350", image: "/assets/Women/look_01.png", stock: "10", category: "Casual", gender: "women" },
  { name: "Minimalist Ribbed Top & Pleated Chinos", price: 1350, advance: "300", image: "/assets/Women/look_02.png", stock: "8", category: "Casual", gender: "women" },
  { name: "Sage Green Smocked Floral Midi Dress", price: 1500, advance: "400", image: "/assets/Women/look_03.png", stock: "6", category: "Casual", gender: "women" },
  { name: "Classic Denim Jacket & Slim Black Jeans", price: 1600, advance: "400", image: "/assets/Women/look_04.png", stock: "7", category: "Casual", gender: "women" },

  // Men — Formal Suits & Tuxedos
  { name: "Classic Midnight Black Tuxedo", price: 3800, advance: "1000", image: "/assets/Men/suit_01.png", stock: "5", category: "Formal", gender: "men" },
  { name: "Midnight Blue Velvet Bandhgala Suit", price: 3600, advance: "900", image: "/assets/Men/suit_02.png", stock: "6", category: "Formal", gender: "men" },
  { name: "Emerald Satin Dinner Jacket & Trousers", price: 4200, advance: "950", image: "/assets/Men/suit_03.png", stock: "5", category: "Formal", gender: "men" },
  { name: "Ivory Cream Slim-Fit Tailored Suit", price: 4800, advance: "1000", image: "/assets/Men/suit_04.png", stock: "3", category: "Formal", gender: "men" },
  { name: "Burgundy Wine Tailored Evening Suit", price: 3900, advance: "900", image: "/assets/Men/suit_06.png", stock: "4", category: "Formal", gender: "men" },
  { name: "Charcoal Italian Wool Three-Piece Suit", price: 5400, advance: "1200", image: "/assets/Men/suit_07.png", stock: "5", category: "Formal", gender: "men" },

  // Men — Party & Cocktails
  { name: "Midnight Black Sequined Party Tuxedo", price: 4500, advance: "1100", image: "/assets/Men/suit_05.png", stock: "6", category: "Party", gender: "men" },
  { name: "Royal Blue Velvet Shawl Lapel Tuxedo", price: 4900, advance: "1200", image: "/assets/Men/suit_08.png", stock: "5", category: "Party", gender: "men" },

  // Men — Groom & Royal Wedding Sherwanis
  { name: "Royal Ivory Embroidered Sherwani with Stole", price: 6500, advance: "1500", image: "/assets/Men/mens_01.png", stock: "4", category: "Wedding", gender: "men" },
  { name: "Deep Wine Velvet Royal Sherwani", price: 7200, advance: "1800", image: "/assets/Men/mens_02.png", stock: "3", category: "Wedding", gender: "men" },
  { name: "Imperial Raw Silk Groom Sherwani", price: 8500, advance: "2000", image: "/assets/Men/sherwani_01.png", stock: "3", category: "Wedding", gender: "men" },
  { name: "Gold Resham Hand-Woven Sherwani", price: 9800, advance: "2200", image: "/assets/Men/sherwani_02.png", stock: "2", category: "Wedding", gender: "men" },
  { name: "Maroon Velvet Royal Sherwani", price: 8800, advance: "2000", image: "/assets/Men/sherwani_03.png", stock: "3", category: "Wedding", gender: "men" },
  { name: "Ivory Pearl Heritage Royal Sherwani", price: 13500, advance: "3000", image: "/assets/Men/sherwani_04.png", stock: "2", category: "Wedding", gender: "men" },

  // Men — Festive Kurtas & Traditional Sets
  { name: "Emerald Silk Kurta & Brocade Bundi Set", price: 4200, advance: "1000", image: "/assets/Men/mens_03.png", stock: "5", category: "Traditional", gender: "men" },
  { name: "Midnight Navy Silk Kurta with Zari Stole", price: 4600, advance: "1100", image: "/assets/Men/mens_04.png", stock: "6", category: "Traditional", gender: "men" },
  { name: "Ivory Tussar Silk Dhoti Kurta & Shawl", price: 3600, advance: "800", image: "/assets/Men/mens_05.png", stock: "7", category: "Traditional", gender: "men" },
  { name: "Midnight Black Gold Pinstripe Kurta", price: 3200, advance: "750", image: "/assets/Men/mens_06.png", stock: "8", category: "Traditional", gender: "men" },
  { name: "Sage Green Embroidered Silk Kurta", price: 2900, advance: "700", image: "/assets/Men/mens_07.png", stock: "7", category: "Traditional", gender: "men" },
  { name: "Pastel Mint Embroidered Festive Kurta", price: 2400, advance: "600", image: "/assets/Men/sherwani_05.png", stock: "8", category: "Traditional", gender: "men" },
  { name: "Royal Blue Silk Festive Kurta", price: 2200, advance: "500", image: "/assets/Men/sherwani_06.png", stock: "7", category: "Traditional", gender: "men" },

  // Men — Smart Casual (ONLY genuine casuals: shirts, polos, chinos, overshirts)
  { name: "Crisp White Linen Shirt & Khaki Chinos", price: 950, advance: "250", image: "/assets/Men/casual_01.png", stock: "10", category: "Casual", gender: "men" },
  { name: "Olive Knit Crewneck & Dark Denim", price: 1100, advance: "300", image: "/assets/Men/casual_02.png", stock: "12", category: "Casual", gender: "men" },
  { name: "Midnight Navy Pique Polo & Chinos", price: 1250, advance: "300", image: "/assets/Men/casual_03.png", stock: "15", category: "Casual", gender: "men" },
  { name: "Classic Plaid Casual Shirt & Blue Jeans", price: 1050, advance: "250", image: "/assets/Men/casual_04.png", stock: "10", category: "Casual", gender: "men" },
  { name: "Camel Utility Overshirt & Cargo Trousers", price: 1400, advance: "350", image: "/assets/Men/casual_05.png", stock: "8", category: "Casual", gender: "men" },
  { name: "Sky Blue Linen Shirt & Navy Trousers", price: 1150, advance: "300", image: "/assets/Men/casual_06.png", stock: "10", category: "Casual", gender: "men" },
  { name: "Obsidian Hoodie & Heather Grey Joggers", price: 1300, advance: "300", image: "/assets/Men/casual_07.png", stock: "6", category: "Casual", gender: "men" },
  { name: "Stone Canvas Overshirt & Olive Chinos", price: 1350, advance: "350", image: "/assets/Men/casual_08.png", stock: "8", category: "Casual", gender: "men" },

  // Jewellery — 1-Gram Gold, Temple & Royal Kundan Bridal Sets
  {
    name: "Padmavati 1-Gram Gold Lakshmi Temple Nakshi Bridal Set",
    price: 2400,
    rentalPricePerDay: 2400,
    advance: "4000",
    securityDeposit: 4000,
    image: "/assets/Jewellery/image_20261019_002031.jpg",
    images: [
      "/assets/Jewellery/image_20261019_002031.jpg",
      "/assets/Jewellery/image_20261019_002031_1.jpg",
      "/assets/Jewellery/image_20261019_002031_2.jpg",
      "/assets/Jewellery/image_20261019_002031_3.jpg"
    ],
    stock: "4",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Marriage",
    style: "Temple",
    color: "Antique Gold",
    description: "Authentic 24K 1-gram micro gold plated temple jewelry set designed with traditional Nakshi craftsmanship and Goddess Lakshmi motifs. Comes with matching Jhumkas and pearl droplets. Sanitized and sealed for Hindu wedding Muhurtham ceremonies.",
    tags: ["1-gram gold", "temple", "nakshi", "lakshmi", "bridal jewellery", "muhurtham", "marriage"]
  },
  {
    name: "Kempu Ratna 1-Gram Gold Lakshmi Bridal Haram & Jhumka Set",
    price: 2800,
    rentalPricePerDay: 2800,
    advance: "4500",
    securityDeposit: 4500,
    image: "/assets/Jewellery/image_20261019_002033.jpg",
    images: [
      "/assets/Jewellery/image_20261019_002033.jpg",
      "/assets/Jewellery/image_20261019_002033_1.jpg",
      "/assets/Jewellery/image_20261019_002033_2.jpg",
      "/assets/Jewellery/image_20261019_002033_3.jpg",
      "/assets/Jewellery/image_20261019_002033_4.jpg"
    ],
    stock: "3",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Marriage",
    style: "Temple",
    color: "Antique Gold & Ruby",
    description: "Royal South Indian Kemp stone antique matte temple bridal haram set. Features Goddess Lakshmi pendant, peacock carvings, matching earrings, and maang tikka. Paired ideally with Kanjeevaram and silk sarees.",
    tags: ["kemp jewellery", "1 gram gold", "temple haram", "south indian bride", "marriage", "muhurtham"]
  },
  {
    name: "Aura Rose Gold American Diamond (AD) Bridal Choker Set",
    price: 1600,
    rentalPricePerDay: 1600,
    advance: "3000",
    securityDeposit: 3000,
    image: "/assets/Jewellery/image_20261019_002857.jpg",
    images: [
      "/assets/Jewellery/image_20261019_002857.jpg",
      "/assets/Jewellery/image_20261019_002857_1.jpg",
      "/assets/Jewellery/image_20261019_002857_2.jpg",
      "/assets/Jewellery/image_20261019_002857_3.jpg"
    ],
    stock: "5",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Engagement",
    style: "American Diamond",
    color: "Rose Gold Diamond",
    description: "High-grade Cubic Zirconia solitaires encrusted in rose gold finish. Includes contouring choker and pear-cut drop earrings. Designed for Hindu engagements, ring ceremonies, and reception gowns.",
    tags: ["american diamond", "ad choker", "engagement jewellery", "rose gold", "reception"]
  },
  {
    name: "Imperial Kundan & Jadau Royal 7-Piece Bridal Set with Mathapatti & Nath",
    price: 3200,
    rentalPricePerDay: 3200,
    advance: "5000",
    securityDeposit: 5000,
    image: "/assets/Jewellery/image_20261019_003318.jpg",
    images: [
      "/assets/Jewellery/image_20261019_003318.jpg",
      "/assets/Jewellery/image_20261019_003319.jpg",
      "/assets/Jewellery/image_20261019_003319_1.jpg",
      "/assets/Jewellery/image_20261019_003319_2.jpg",
      "/assets/Jewellery/image_20261019_003319_3.jpg"
    ],
    stock: "3",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Marriage",
    style: "Kundan",
    color: "Gold & Emerald Green",
    description: "Magnificent 7-piece royal bridal collection complete with Kundan choker, rani haar, broad mathapatti, bridal nath with pearl chain, jhumkas, ring, and kadas. Handcrafted with emerald green and ruby gemstones for wedding pheras.",
    tags: ["kundan", "jadau", "bridal set", "mathapatti", "nath", "marriage", "pherhas"]
  },
  {
    name: "Mayuri Antique Matte 1-Gram Gold Peacock Waist Belt (Vaddanam) & Haar",
    price: 1900,
    rentalPricePerDay: 1900,
    advance: "3500",
    securityDeposit: 3500,
    image: "/assets/Jewellery/image_20261019_002032.jpg",
    images: [
      "/assets/Jewellery/image_20261019_002032.jpg",
      "/assets/Jewellery/image_20261019_002034.jpg",
      "/assets/Jewellery/image_20261019_002038.jpg"
    ],
    stock: "4",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Marriage",
    style: "Antique Matte",
    color: "Matte Gold",
    description: "Traditional peacock-motif Nakshi bridal waist belt (Vaddanam/Ottiyanam) and collar necklace. Cast in brass with 1-gram matte gold electroplating and antique patina finish.",
    tags: ["vaddanam", "waist belt", "peacock", "1 gram gold", "traditional wedding"]
  },
  {
    name: "Rajputana Uncut Polki & Meenakari Choker Set",
    price: 2100,
    rentalPricePerDay: 2100,
    advance: "3800",
    securityDeposit: 3800,
    image: "/assets/Jewellery/image_20261019_002858.jpg",
    images: [
      "/assets/Jewellery/image_20261019_002858.jpg",
      "/assets/Jewellery/image_20261019_002858_1.jpg"
    ],
    stock: "4",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Sangeet",
    style: "Kundan",
    color: "Gold & Mint Green",
    description: "Royal uncut Polki stones set in gold foil with reverse turquoise Meenakari artwork. Lightweight and glamorous for Sangeet dances and cocktail evenings.",
    tags: ["polki", "meenakari", "sangeet jewellery", "choker", "lehenga jewellery"]
  },
  {
    name: "Celeste Zirconia & Rhodium Solitaire Waterfall Necklace Set",
    price: 1800,
    rentalPricePerDay: 1800,
    advance: "3200",
    securityDeposit: 3200,
    image: "/assets/Jewellery/image_20261019_002859.jpg",
    images: [
      "/assets/Jewellery/image_20261019_002859.jpg",
      "/assets/Jewellery/image_20261019_002859_1.jpg",
      "/assets/Jewellery/image_20261019_002859_2.jpg",
      "/assets/Jewellery/image_20261019_002859_3.jpg"
    ],
    stock: "4",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Reception",
    style: "American Diamond",
    color: "Silver Diamond",
    description: "Dazzling diamond-look waterfall collar necklace with matching chandelier drops. Rhodium electroplated for platinum-like gleam under stage spotlights.",
    tags: ["reception jewellery", "diamond necklace", "zirconia", "western bridal"]
  },
  {
    name: "Sita Kalyanam Heritage Kasu Mala & Lakshmi Choker Combo",
    price: 2600,
    rentalPricePerDay: 2600,
    advance: "4200",
    securityDeposit: 4200,
    image: "/assets/Jewellery/image_20261019_003320.jpg",
    images: [
      "/assets/Jewellery/image_20261019_003320.jpg",
      "/assets/Jewellery/image_20261019_003320_1.jpg",
      "/assets/Jewellery/image_20261019_003320_2.jpg",
      "/assets/Jewellery/image_20261019_003320_3.jpg",
      "/assets/Jewellery/image_20261019_003323.jpg"
    ],
    stock: "3",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Marriage",
    style: "Temple",
    color: "1-Gram Yellow Gold",
    description: "Sacred coin necklace (Kasu Mala) paired with a high choker necklace, embellished with temple deities, South Sea pearl drops, and rich ruby gems.",
    tags: ["kasu mala", "lakshmi coin", "temple combo", "south indian wedding", "marriage"]
  },
  {
    name: "Noor Emerald Beaded Jadau Choker with Chandbali Earrings",
    price: 2200,
    rentalPricePerDay: 2200,
    advance: "3600",
    securityDeposit: 3600,
    image: "/assets/Jewellery/image_20261019_002900.jpg",
    images: [
      "/assets/Jewellery/image_20261019_002900.jpg",
      "/assets/Jewellery/image_20261019_002900_1.jpg",
      "/assets/Jewellery/image_20261019_002901.jpg"
    ],
    stock: "5",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Engagement",
    style: "Kundan",
    color: "Gold & Emerald Green",
    description: "Traditional Jadau choker featuring hand-strung Colombian emerald beads, delicate floral Kundan panels, and royal crescent Chandbali earrings.",
    tags: ["jadau", "chandbali", "emerald choker", "engagement", "sangeet"]
  },
  {
    name: "Vrinda Haldi & Mehendi Yellow Floral Pearl Jewelry Set",
    price: 850,
    rentalPricePerDay: 850,
    advance: "1200",
    securityDeposit: 1200,
    image: "/assets/Jewellery/image_20261019_002905.jpg",
    images: [
      "/assets/Jewellery/image_20261019_002905.jpg",
      "/assets/Jewellery/image_20261019_002907.jpg",
      "/assets/Jewellery/image_20261019_002909.jpg"
    ],
    stock: "8",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Haldi",
    style: "Floral",
    color: "Marigold Yellow & Pearl White",
    description: "Handcrafted artificial marigold and jasmine flower jewelry set with pearl clusters, floral tiara, earrings, double haathphools, and floral anklets for Haldi rituals.",
    tags: ["haldi jewellery", "floral jewellery", "mehendi set", "gota patti", "haldi ceremony"]
  },
  {
    name: "Devangana Handcrafted 1-Gram Gold Broad Kadas & Temple Bangles Set",
    price: 950,
    rentalPricePerDay: 950,
    advance: "1800",
    securityDeposit: 1800,
    image: "/assets/Jewellery/image_20261019_002925.jpg",
    images: [
      "/assets/Jewellery/image_20261019_002925.jpg",
      "/assets/Jewellery/image_20261019_002926.jpg",
      "/assets/Jewellery/image_20261019_002926_1.jpg",
      "/assets/Jewellery/image_20261019_002935.jpg"
    ],
    stock: "6",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Marriage",
    style: "Antique Matte",
    color: "Antique Gold",
    description: "Set of 4 heavy screw-type bridal bangles with micro-carved elephant and floral motifs in 1-gram antique gold polish. Fits standard 2.4 to 2.8 wrist sizes.",
    tags: ["bangles", "kadas", "temple bangles", "1 gram gold", "bridal choora"]
  },
  {
    name: "Ananya Traditional Mathapatti, Borla & Statement Jhumkas Combo",
    price: 1400,
    rentalPricePerDay: 1400,
    advance: "2500",
    securityDeposit: 2500,
    image: "/assets/Jewellery/image_20261019_002040.jpg",
    images: [
      "/assets/Jewellery/image_20261019_002040.jpg",
      "/assets/Jewellery/image_20261019_002043.jpg",
      "/assets/Jewellery/image_20261019_002045.jpg",
      "/assets/Jewellery/image_20261019_002052.jpg"
    ],
    stock: "4",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Marriage",
    style: "Kundan",
    color: "Gold & Ruby",
    description: "Regal forehead mathapatti with authentic Rajasthani Borla and 3-tier grand jhumkas. Enriched with ruby cabochons and pearl latkans.",
    tags: ["mathapatti", "borla", "sheeshpatti", "jhumkas", "bridal forehead"]
  },
  {
    name: "Meenakshi Divine Temple Vanki (Armlet) & Nethi Chutti Set",
    price: 1200,
    rentalPricePerDay: 1200,
    advance: "2200",
    securityDeposit: 2200,
    image: "/assets/Jewellery/image_20261019_002111.jpg",
    images: [
      "/assets/Jewellery/image_20261019_002111.jpg",
      "/assets/Jewellery/image_20261019_002116.jpg",
      "/assets/Jewellery/image_20261019_002118.jpg",
      "/assets/Jewellery/image_20261019_002130.jpg"
    ],
    stock: "4",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Marriage",
    style: "Temple",
    color: "1-Gram Matte Gold",
    description: "Pair of Vanki (bridal upper-armlets) with snake/peacock carving and matching bridal Maang Tikka (Nethi Chutti). Hand-polished in 1-gram matte gold.",
    tags: ["vanki", "armlet", "bajuband", "nethi chutti", "temple wedding"]
  }
];

async function seedDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Seed Products
    await Product.deleteMany({});
    console.log("Cleared existing products");
    await Product.insertMany(mockProducts);
    console.log("Successfully inserted " + mockProducts.length + " products");

    // 2. Seed Recruiter Demo Accounts
    const passwordHash = await bcrypt.hash("Password123!", 10);
    const demoUsers = [
      {
        name: "Demo Customer",
        firstname: "Demo",
        lastname: "Customer",
        email: "customer@wardrobewonders.com",
        password: passwordHash,
        passwordHash: passwordHash,
        role: "customer",
        type: "customer",
        phone: "9876543210",
        isActive: true,
      },
      {
        name: "Demo Luxury Boutique",
        firstname: "Demo",
        lastname: "Provider",
        email: "provider@wardrobewonders.com",
        password: passwordHash,
        passwordHash: passwordHash,
        role: "provider",
        type: "provider",
        phone: "9876543211",
        isActive: true,
      },
      {
        name: "Demo Platform Admin",
        firstname: "Demo",
        lastname: "Admin",
        email: "admin@wardrobewonders.com",
        password: passwordHash,
        passwordHash: passwordHash,
        role: "admin",
        type: "admin",
        phone: "9876543212",
        isActive: true,
      },
    ];

    for (const u of demoUsers) {
      await UserModel.findOneAndUpdate({ email: u.email }, u, { upsert: true, new: true });
    }
    console.log("Successfully seeded 3 demo accounts (Customer, Provider, Admin)");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding DB:", error);
    process.exit(1);
  }
}

seedDB();
