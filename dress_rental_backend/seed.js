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
    const passwordHash = await bcrypt.hash("WondersDemo#2026!", 10);
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
