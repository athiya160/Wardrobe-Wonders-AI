from fastapi import APIRouter
from pydantic import BaseModel
from services.chatbot import ask_fashion_ai
from services.vector_store import build_index
from services.generator import generate_product_details, generate_product_tags, extract_search_filters, ai_outfit_recommendation, ai_weekly_picks
from services.retriever import search_products

router = APIRouter(prefix="/ai", tags=["AI"])


class ChatRequest(BaseModel):
    message: str


@router.post("/chat")
async def chat(request: ChatRequest):
    response = await ask_fashion_ai(request.message)
    
    text = response.get("text", "I'm sorry, I couldn't process that request.")
    recommended_ids = response.get("recommended_product_ids", [])
    
    products_to_return = []
    if recommended_ids:
        # We need to fetch the full product objects for these IDs.
        # Since search_products retrieves from FAISS, we might need a way to get products by ID.
        # However, ask_fashion_ai internally fetches top 5 products and the LLM picks from those.
        # We can just fetch a larger pool and filter, or we can trust the ID.
        # For simplicity, let's fetch all products or re-run the search to get the objects.
        recent_search = search_products(request.message, top_k=20)
        for p_id in recommended_ids:
            matching_product = next((p for p in recent_search if str(p.get("_id")) == str(p_id)), None)
            if matching_product:
                products_to_return.append(matching_product)

    return {
        "text": text,
        "products": products_to_return
    }

@router.post("/refresh-index")
async def refresh_index():
    await build_index()
    return {"message": "FAISS index successfully rebuilt"}

class GenerateDescriptionRequest(BaseModel):
    productName: str
    category: str
    price: float

@router.post("/generate-description")
async def generate_description(request: GenerateDescriptionRequest):
    return generate_product_details(
        name=request.productName,
        category=request.category,
        price=request.price
    )

class GenerateTagsRequest(BaseModel):
    productName: str
    category: str

@router.post("/generate-tags")
async def generate_tags(request: GenerateTagsRequest):
    return generate_product_tags(
        name=request.productName,
        category=request.category
    )

class SearchRequest(BaseModel):
    query: str

@router.post("/search")
async def search_endpoint(request: SearchRequest):
    filters = extract_search_filters(request.query)
    products = search_products(request.query, top_k=20)
    
    # Filter products based on extracted AI constraints
    valid_products = []
    for p in products:
        if filters.get("max_price") and p.get("price", 0) > filters["max_price"]:
            continue
        if filters.get("min_price") and p.get("price", 0) < filters["min_price"]:
            continue
        if filters.get("category") and filters["category"].lower() not in p.get("category", "").lower():
            continue
        if filters.get("color") and filters["color"].lower() not in (p.get("color", "") or "").lower() and filters["color"].lower() not in (p.get("name", "") or "").lower():
            continue
        valid_products.append(p)
        
    # Return top 5 valid products
    return {"filters": filters, "results": valid_products[:5]}

class RecommendOutfitRequest(BaseModel):
    occasion: str
    budget: float
    color: str
    season: str
    style: str

@router.post("/recommend-outfit")
async def recommend_outfit(request: RecommendOutfitRequest):
    preferences = request.dict()
    # Create a unified search string
    query_str = f"Occasion: {request.occasion}, Budget: {request.budget}, Color: {request.color}, Season: {request.season}, Style: {request.style}"
    
    # Retrieve top 10 products from FAISS
    products = search_products(query_str, top_k=10)
    
    # Pre-filter by budget strictly
    affordable_products = [p for p in products if p.get("price", 0) <= request.budget]
    if not affordable_products:
        affordable_products = products # fallback if everything is too expensive
    
    # Ask Groq to act as a stylist
    ai_response = ai_outfit_recommendation(preferences, affordable_products)
    
    # Enhance the recommendations with full product details
    recommendations = ai_response.get("recommendations", [])
    final_outfit = []
    
    for rec in recommendations:
        product_id = rec.get("product_id")
        reason = rec.get("reason")
        
        # Find the actual product
        matching_product = next((p for p in affordable_products if p.get("_id") == product_id), None)
        if matching_product:
            final_outfit.append({
                "product": matching_product,
                "reason": reason
            })
            
            
    return {"outfit": final_outfit}

class PersonalizedHomeRequest(BaseModel):
    recent_searches: list[str]

@router.post("/personalized-home")
async def personalized_home(request: PersonalizedHomeRequest):
    # 1. AI Picks For This Week
    # We will pass the top 20 random products (or all products if small catalog) to Groq.
    all_products = search_products("", top_k=50) # get a large slice of catalog
    ai_picks_response = ai_weekly_picks(all_products)
    
    ai_picks = []
    for rec in ai_picks_response.get("picks", []):
        product_id = rec.get("product_id")
        matching_product = next((p for p in all_products if p.get("_id") == product_id), None)
        if matching_product:
            ai_picks.append({
                "product": matching_product,
                "reason": rec.get("reason")
            })

    # 2. Recommended For You (based on recent searches)
    recommended = []
    if request.recent_searches:
        combined_query = " ".join(request.recent_searches[-3:]) # last 3 searches
        recommended = search_products(combined_query, top_k=4)
    else:
        # Fallback to random/generic if no history
        recommended = search_products("beautiful elegant dress", top_k=4)
        
    # 3. Trending (mocked as static slice of products for now)
    trending = all_products[:4] if all_products else []
    
    return {
        "recommended": recommended,
        "trending": trending,
        "ai_picks": ai_picks
    }

class SimilarProductsRequest(BaseModel):
    product_id: str
    product_name: str
    product_category: str
    product_description: str = ""

@router.post("/similar-products")
async def similar_products(request: SimilarProductsRequest):
    # Construct a query string that encapsulates the essence of the product
    query = f"{request.product_category} {request.product_name} {request.product_description}"
    
    # Retrieve top matches from FAISS
    results = search_products(query, top_k=6)
    
    # Filter out the current product itself
    similar = [p for p in results if str(p.get("_id")) != request.product_id]
    
    # Return top 4
    return similar[:4]
