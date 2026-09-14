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
  { name: "Royal Gold Embroidered Lehenga", price: 15500, advance: "3500", image: "/assets/Women/bridal_02.png", stock: "2", category: "Wedding", gender: "women" },
  { name: "Ivory Rose Reception Gown", price: 9800, advance: "2500", image: "/assets/Women/bridal_03.png", stock: "4", category: "Wedding", gender: "women" },
  { name: "Pastel Peach Floral Bridal Set", price: 11500, advance: "2800", image: "/assets/Women/bridal_04.png", stock: "3", category: "Wedding", gender: "women" },
  { name: "Scarlet Velvet Wedding Lehenga", price: 13800, advance: "3200", image: "/assets/Women/bridal_05.png", stock: "2", category: "Wedding", gender: "women" },
  { name: "Champagne Shimmer Bridal Dress", price: 10500, advance: "2600", image: "/assets/Women/bridal_06.png", stock: "4", category: "Wedding", gender: "women" },
  { name: "Blush Heritage Silk Lehenga", price: 12500, advance: "3000", image: "/assets/Women/bridal_07.png", stock: "3", category: "Wedding", gender: "women" },
  { name: "Maharani Zardozi Bridal Ensemble", price: 16000, advance: "4000", image: "/assets/Women/bridal_08.png", stock: "2", category: "Wedding", gender: "women" },

  // Women — Traditional & Festive
  { name: "Emerald Hand-Embroidered Anarkali", price: 3200, advance: "800", image: "/assets/Women/festive_01.png", stock: "8", category: "Traditional", gender: "women" },
  { name: "Sapphire Silk Festive Saree", price: 3800, advance: "900", image: "/assets/Women/festive_02.png", stock: "6", category: "Traditional", gender: "women" },
  { name: "Golden Zari Banarasi Saree", price: 4200, advance: "1000", image: "/assets/Women/festive_03.png", stock: "5", category: "Traditional", gender: "women" },
  { name: "Plum Georgette Anarkali Suit", price: 2900, advance: "700", image: "/assets/Women/festive_04.png", stock: "7", category: "Traditional", gender: "women" },
  { name: "Mustard Haldi Festive Sharara", price: 2600, advance: "600", image: "/assets/Women/festive_05.png", stock: "10", category: "Traditional", gender: "women" },
  { name: "Ruby Designer Party Saree", price: 3400, advance: "800", image: "/assets/Women/festive_06.png", stock: "6", category: "Party", gender: "women" },
  { name: "Teal Mirror-Work Festive Lehenga", price: 4500, advance: "1100", image: "/assets/Women/festive_07.png", stock: "5", category: "Traditional", gender: "women" },
  { name: "Dusty Rose Embroidered Kurta Set", price: 2100, advance: "500", image: "/assets/Women/festive_08.png", stock: "9", category: "Traditional", gender: "women" },

  // Women — Party & Evening Wear
  { name: "Midnight Black Sequin Gown", price: 3500, advance: "800", image: "/assets/Women/look_01.png", stock: "5", category: "Party", gender: "women" },
  { name: "Modern Rose Gold Cocktail Dress", price: 2800, advance: "700", image: "/assets/Women/look_02.png", stock: "6", category: "Party", gender: "women" },
  { name: "Cobalt Blue Slit Evening Gown", price: 3600, advance: "900", image: "/assets/Women/look_03.png", stock: "4", category: "Evening Wear", gender: "women" },
  { name: "Silver Starlight Gala Gown", price: 4200, advance: "1000", image: "/assets/Women/look_04.png", stock: "3", category: "Evening Wear", gender: "women" },
  { name: "Blush Pink Tiered Tulle Dress", price: 2900, advance: "700", image: "/assets/Women/look_05.png", stock: "7", category: "Party", gender: "women" },
  { name: "Burgundy Velvet Floor-Length Gown", price: 3800, advance: "900", image: "/assets/Women/look_06.png", stock: "4", category: "Evening Wear", gender: "women" },
  { name: "Chic Floral Silk Wrap Dress", price: 1400, advance: "350", image: "/assets/Women/outfit_01.png", stock: "12", category: "Casual", gender: "women" },
  { name: "Bohemian Summer Linen Co-ord", price: 1200, advance: "300", image: "/assets/Women/outfit_02.png", stock: "15", category: "Casual", gender: "women" },

  // Men — Formal Suits & Tuxedos
  { name: "Classic Midnight Black Tuxedo", price: 3800, advance: "1000", image: "/assets/Men/suit_01.png", stock: "5", category: "Formal", gender: "men" },
  { name: "Charcoal Grey Slim-Fit Three-Piece", price: 3400, advance: "850", image: "/assets/Men/suit_02.png", stock: "6", category: "Formal", gender: "men" },
  { name: "Navy Royal Italian Wool Suit", price: 3600, advance: "900", image: "/assets/Men/suit_03.png", stock: "5", category: "Formal", gender: "men" },
  { name: "Double-Breasted Ivory Tuxedo", price: 4200, advance: "1000", image: "/assets/Men/suit_04.png", stock: "3", category: "Formal", gender: "men" },
  { name: "Burgundy Velvet Evening Blazer", price: 2800, advance: "700", image: "/assets/Men/suit_05.png", stock: "6", category: "Party", gender: "men" },
  { name: "Emerald Satin Lapel Dinner Jacket", price: 3100, advance: "750", image: "/assets/Men/suit_07.png", stock: "4", category: "Party", gender: "men" },

  // Men — Groom & Traditional Sherwanis
  { name: "Imperial Raw Silk Groom Sherwani", price: 8500, advance: "2000", image: "/assets/Men/sherwani_01.png", stock: "3", category: "Wedding", gender: "men" },
  { name: "Gold Resham Hand-Woven Sherwani", price: 9200, advance: "2200", image: "/assets/Men/sherwani_02.png", stock: "2", category: "Wedding", gender: "men" },
  { name: "Maroon Velvet Royal Sherwani", price: 8800, advance: "2000", image: "/assets/Men/sherwani_03.png", stock: "3", category: "Wedding", gender: "men" },
  { name: "Ivory Pearl Heritage Sherwani", price: 9500, advance: "2400", image: "/assets/Men/sherwani_04.png", stock: "2", category: "Wedding", gender: "men" },
  { name: "Pastel Mint Embroidered Kurta Set", price: 2400, advance: "600", image: "/assets/Men/sherwani_05.png", stock: "8", category: "Traditional", gender: "men" },
  { name: "Royal Blue Silk Festive Kurta", price: 2200, advance: "500", image: "/assets/Men/sherwani_06.png", stock: "7", category: "Traditional", gender: "men" },

  // Men — Smart Casual & Designer Looks
  { name: "Structured Camel Trench & Blazer", price: 1600, advance: "400", image: "/assets/Men/mens_01.png", stock: "10", category: "Casual", gender: "men" },
  { name: "Casual Indigo Denim Jacket Set", price: 1100, advance: "300", image: "/assets/Men/casual_01.png", stock: "12", category: "Casual", gender: "men" },
  { name: "Olive Linen Summer Shirt & Chinos", price: 950, advance: "250", image: "/assets/Men/casual_02.png", stock: "15", category: "Casual", gender: "men" },
  { name: "Monochrome Urban Minimalist Look", price: 1250, advance: "300", image: "/assets/Men/casual_03.png", stock: "10", category: "Casual", gender: "men" },
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
