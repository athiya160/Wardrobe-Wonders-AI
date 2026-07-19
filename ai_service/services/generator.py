import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

def generate_product_details(name: str, category: str, price: float):
    prompt = f"""
    You are an expert fashion copywriter. Generate an SEO-optimized title, a compelling product description, relevant search tags, and the best occasion for a dress.
    
    Product details provided:
    Name: {name}
    Category: {category}
    Price: ₹{price}
    
    Return ONLY a JSON object with this exact structure:
    {{
        "title": "string",
        "description": "string",
        "tags": ["string", "string"],
        "occasion": "string"
    }}
    """
    
    completion = client.chat.completions.create(
        model=os.getenv("MODEL_NAME"),
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.7,
        response_format={"type": "json_object"}
    )
    
    return json.loads(completion.choices[0].message.content)

def generate_product_tags(name: str, category: str):
    prompt = f"""
    You are an expert fashion AI. Extract structured tags (color, pattern, style, season) from the product name and category.
    
    Product details provided:
    Name: {name}
    Category: {category}
    
    Return ONLY a JSON object with this exact structure:
    {{
        "color": "string",
        "pattern": "string",
        "style": "string",
        "season": "string"
    }}
    If a tag is not obvious, use a generic safe term or "N/A".
    """
    
    completion = client.chat.completions.create(
        model=os.getenv("MODEL_NAME"),
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.3,
        response_format={"type": "json_object"}
    )
    
    return json.loads(completion.choices[0].message.content)

def extract_search_filters(query: str):
    prompt = f"""
    You are an expert fashion AI assistant. A user has typed a natural language search query for a dress rental platform.
    Extract the following structured filters from the query if they exist:
    - max_price (integer, only if they mention a budget like "under 3000")
    - min_price (integer)
    - color (string)
    - category (string, e.g., "men", "women")
    - occasion (string)
    - style (string)
    
    User Query: "{query}"
    
    Return ONLY a JSON object with this exact structure (use null if a field is not specified in the query):
    {{
        "max_price": null,
        "min_price": null,
        "color": null,
        "category": null,
        "occasion": null,
        "style": null
    }}
    """
    
    completion = client.chat.completions.create(
        model=os.getenv("MODEL_NAME"),
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.0,
        response_format={"type": "json_object"}
    )
    
    return json.loads(completion.choices[0].message.content)

def ai_outfit_recommendation(preferences: dict, products: list):
    prompt = f"""
    You are an expert AI fashion stylist. You have been given a user's preferences and a list of available products from our catalog.
    
    User Preferences:
    {json.dumps(preferences, indent=2)}
    
    Available Products:
    {json.dumps([{'_id': p.get('_id'), 'name': p.get('name'), 'category': p.get('category'), 'price': p.get('price'), 'color': p.get('color'), 'style': p.get('style')} for p in products], indent=2)}
    
    Your job is to recommend an outfit consisting of up to 3 products from the list that best match the user's preferences.
    For each recommended product, provide a compelling "reason" explaining why it was chosen (e.g., "Fits your budget, elegant, and perfect for summer weddings").
    
    Return ONLY a JSON object with this exact structure:
    {{
        "recommendations": [
            {{
                "product_id": "string",
                "reason": "string"
            }}
        ]
    }}
    """
    
    completion = client.chat.completions.create(
        model=os.getenv("MODEL_NAME"),
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.7,
        response_format={"type": "json_object"}
    )
    
    return json.loads(completion.choices[0].message.content)

def ai_weekly_picks(products: list):
    import random
    # Select a random subset to avoid token limits if the catalog is huge
    sample_size = min(20, len(products))
    sampled_products = random.sample(products, sample_size)
    
    prompt = f"""
    You are the head curator of our fashion platform. Review these available products and pick the 4 best items to feature as "AI Picks For This Week".
    
    Available Products:
    {json.dumps([{'_id': p.get('_id'), 'name': p.get('name'), 'category': p.get('category'), 'price': p.get('price')} for p in sampled_products], indent=2)}
    
    For each picked product, provide a short, exciting 1-sentence "reason" why it's a must-have this week.
    
    Return ONLY a JSON object with this exact structure:
    {{
        "picks": [
            {{
                "product_id": "string",
                "reason": "string"
            }}
        ]
    }}
    """
    
    completion = client.chat.completions.create(
        model=os.getenv("MODEL_NAME"),
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.7,
        response_format={"type": "json_object"}
    )
    
    return json.loads(completion.choices[0].message.content)
