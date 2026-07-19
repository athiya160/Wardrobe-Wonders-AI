import os
import json
import faiss
import numpy as np
from services.product_service import get_products
from services.embeddings import get_embeddings

DATA_DIR = "data"
INDEX_PATH = os.path.join(DATA_DIR, "product_vectors.index")
PRODUCTS_PATH = os.path.join(DATA_DIR, "products.json")

def format_product_text(p: dict) -> str:
    """Creates a text representation of the product for embedding."""
    return f"{p.get('name', '')} {p.get('category', '')} Price ₹{p.get('price', '')} {p.get('stock', '')}"

async def build_index():
    """Fetches products from Node.js, embeds them, and saves the FAISS index and product list."""
    print("Building FAISS index...")
    products = await get_products()
    
    if not products:
        print("No products fetched. Skipping index build.")
        return
        
    # Generate texts for all products
    texts = [format_product_text(p) for p in products]
    
    # Generate embeddings
    embeddings = get_embeddings(texts)
    
    # Convert to float32 numpy array as required by FAISS
    embeddings = np.array(embeddings).astype("float32")
    
    # Create FAISS index
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    
    # Save the index and product data
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        
    faiss.write_index(index, INDEX_PATH)
    
    with open(PRODUCTS_PATH, "w") as f:
        json.dump(products, f)
        
    print(f"Successfully indexed {len(products)} products.")

def load_index():
    """Loads the FAISS index and product list from disk. Returns (index, products)."""
    if not os.path.exists(INDEX_PATH) or not os.path.exists(PRODUCTS_PATH):
        return None, None
        
    index = faiss.read_index(INDEX_PATH)
    with open(PRODUCTS_PATH, "r", encoding="utf-8") as f:
        products = json.load(f)
        
    return index, products
