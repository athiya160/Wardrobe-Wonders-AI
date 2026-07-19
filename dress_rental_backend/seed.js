import mongoose from "mongoose";
import Product from "./models/productModel.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/dress_rental";

const mockProducts = [
  // Women
  { name: "Elegant Anarkali Suit", price: 1500, advance: "500", image: "/assets/Anarkali.jpg", stock: "10", category: "Traditional", gender: "women" },
  { name: "Designer Bridal Lehenga", price: 15000, advance: "3000", image: "/assets/Bridal.jpg", stock: "2", category: "Wedding", gender: "women" },
  { name: "Modern Cocktail Gown", price: 2500, advance: "800", image: "/assets/Cocktail Gown.jpg", stock: "5", category: "Party", gender: "women" },
  { name: "Floral Summer Crop Set", price: 1200, advance: "300", image: "/assets/Crop.jpg", stock: "15", category: "Casual", gender: "women" },
  { name: "Premium Silk Saree", price: 4000, advance: "1000", image: "/assets/black_saree.jpg", stock: "8", category: "Traditional", gender: "women" },
  { name: "Women's Formal Blazer", price: 1800, advance: "400", image: "/assets/Blazer.jpg", stock: "12", category: "Formal", gender: "women" },
  { name: "Pink Flamingo Dress", price: 2200, advance: "500", image: "/assets/Flamingo.jpg", stock: "7", category: "Party", gender: "women" },
  { name: "Punjabi Salwar Suit", price: 1000, advance: "200", image: "/assets/Punjabi.jpg", stock: "20", category: "Casual", gender: "women" },
  { name: "Classic Wedding Gown", price: 8000, advance: "2000", image: "/assets/Wedding.jpg", stock: "3", category: "Wedding", gender: "women" },
  { name: "Luxury Cape Dress", price: 3500, advance: "700", image: "/assets/Cape.jpg", stock: "6", category: "Evening Wear", gender: "women" },
  { name: "Sapphire Evening Gown", price: 3000, advance: "600", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800", stock: "4", category: "Evening Wear", gender: "women" },
  { name: "Golden Sequin Lehenga", price: 12000, advance: "2500", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800", stock: "3", category: "Wedding", gender: "women" },
  { name: "Chic Floral Maxi", price: 1800, advance: "400", image: "https://images.unsplash.com/photo-1550614000-4b95d4662d55?auto=format&fit=crop&q=80&w=800", stock: "9", category: "Casual", gender: "women" },
  { name: "Red Velvet Evening Dress", price: 3200, advance: "700", image: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&q=80&w=800", stock: "5", category: "Party", gender: "women" },
  { name: "White Summer Dress", price: 1500, advance: "300", image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&q=80&w=800", stock: "12", category: "Casual", gender: "women" },
  { name: "Elegant Black Gown", price: 4000, advance: "800", image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=800", stock: "6", category: "Formal", gender: "women" },
  { name: "Pastel Wedding Gown", price: 9000, advance: "2000", image: "https://images.unsplash.com/photo-1546804784-816d92634e2f?auto=format&fit=crop&q=80&w=800", stock: "3", category: "Wedding", gender: "women" },
  { name: "Boho Chic Dress", price: 1300, advance: "300", image: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&q=80&w=800", stock: "10", category: "Casual", gender: "women" },
  { name: "Emerald Green Saree", price: 3500, advance: "700", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800", stock: "8", category: "Traditional", gender: "women" },
  { name: "Glitter Party Dress", price: 2800, advance: "500", image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&q=80&w=800", stock: "7", category: "Party", gender: "women" },
  { name: "Vintage Lace Gown", price: 4500, advance: "1000", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800", stock: "4", category: "Evening Wear", gender: "women" },


  // Men
  { name: "Men's Classic Tuxedo", price: 3000, advance: "1000", image: "/assets/Men/men1.jpg", stock: "5", category: "Formal", gender: "men" },
  { name: "Traditional Men's Sherwani", price: 5000, advance: "1500", image: "/assets/Men/men2.jpg", stock: "3", category: "Wedding", gender: "men" },
  { name: "Men's Party Wear Suit", price: 2500, advance: "800", image: "/assets/Men/men3.jpg", stock: "8", category: "Party", gender: "men" },
  { name: "Casual Denim Outfit", price: 1000, advance: "300", image: "/assets/Men/men4.jpg", stock: "15", category: "Casual", gender: "men" },
  { name: "Men's Traditional Kurta", price: 1200, advance: "400", image: "/assets/Men/men5.jpg", stock: "10", category: "Traditional", gender: "men" },
  { name: "Premium Blue Blazer", price: 2000, advance: "500", image: "/assets/Men/men6.jpg", stock: "7", category: "Formal", gender: "men" },
  { name: "Men's Evening Wear", price: 2800, advance: "600", image: "/assets/Men/men7.jpg", stock: "4", category: "Evening Wear", gender: "men" },
  { name: "Groom's Special Outfit", price: 8000, advance: "2000", image: "/assets/Men/men8.jpg", stock: "2", category: "Wedding", gender: "men" },
  { name: "Men's Casual Set", price: 1500, advance: "300", image: "/assets/Men/men9.jpg", stock: "12", category: "Casual", gender: "men" },
  { name: "Designer Men's Jacket", price: 3500, advance: "800", image: "/assets/Men/men10.jpg", stock: "5", category: "Party", gender: "men" },
  { name: "Navy Blue Three-Piece Suit", price: 4000, advance: "1000", image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800", stock: "4", category: "Formal", gender: "men" },
  { name: "Burgundy Velvet Blazer", price: 2500, advance: "600", image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800", stock: "6", category: "Party", gender: "men" },
  { name: "Classic Black Tuxedo", price: 3800, advance: "900", image: "https://images.unsplash.com/photo-1593030103066-0093718efeb9?auto=format&fit=crop&q=80&w=800", stock: "3", category: "Formal", gender: "men" },
  { name: "Grey Wool Suit", price: 3200, advance: "800", image: "https://images.unsplash.com/photo-1592878904946-b3ce8ce2435e?auto=format&fit=crop&q=80&w=800", stock: "5", category: "Formal", gender: "men" },
  { name: "Casual Linen Shirt", price: 800, advance: "200", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ce3?auto=format&fit=crop&q=80&w=800", stock: "15", category: "Casual", gender: "men" },
  { name: "Summer Beach Shirt", price: 900, advance: "200", image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800", stock: "20", category: "Casual", gender: "men" },
  { name: "Groom's Sherwani", price: 8500, advance: "2000", image: "https://images.unsplash.com/photo-1598808503746-f34c53b9323e?auto=format&fit=crop&q=80&w=800", stock: "2", category: "Wedding", gender: "men" },
  { name: "Stylish Leather Jacket", price: 3500, advance: "800", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800", stock: "6", category: "Party", gender: "men" },
  { name: "Pinstripe Suit", price: 4200, advance: "1000", image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800", stock: "4", category: "Formal", gender: "men" },
  { name: "Embroidered Kurta", price: 1800, advance: "400", image: "https://images.unsplash.com/photo-1593030103066-0093718efeb9?auto=format&fit=crop&q=80&w=800", stock: "8", category: "Traditional", gender: "men" },
  { name: "Casual Chino Pants", price: 1100, advance: "300", image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800", stock: "12", category: "Casual", gender: "men" },

];

async function seedDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");
    await Product.deleteMany({});
    console.log("Cleared existing products");
    await Product.insertMany(mockProducts);
    console.log("Successfully inserted " + mockProducts.length + " products");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding DB:", error);
    process.exit(1);
  }
}

seedDB();
