import os

from groq import Groq
from dotenv import load_dotenv
from services.retriever import search_products

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

async def ask_fashion_ai(message: str):
    # Retrieve top 5 relevant products instead of all products
    products = search_products(message, top_k=5)
    
    catalog = ""
    if not products:
        catalog = "No relevant products found in the catalog."
    else:
        for p in products:
            catalog += f"""
Name: {p.get('name', 'N/A')}
Price: ₹{p.get('price', 'N/A')}
Category: {p.get('category', 'N/A')}
Stock: {p.get('stock', 'N/A')}
------------------------
"""

    system_prompt = f"""
You are an AI Fashion Assistant for an online dress rental platform.

You MUST recommend ONLY products from this catalog.
Never invent products.
If a product does not exist, tell the user politely.

Available Products:
{catalog}

Respond ONLY in JSON format with this exact structure:
{{
    "text": "Your conversational response here",
    "recommended_product_ids": ["id1", "id2"] // List of IDs from the catalog you are recommending, or empty array
}}
"""

    completion = client.chat.completions.create(
        model=os.getenv("MODEL_NAME"),
        messages=[
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": message
            }
        ],
        temperature=0.7,
        response_format={"type": "json_object"}
    )

    import json
    try:
        return json.loads(completion.choices[0].message.content)
    except:
        return {"text": completion.choices[0].message.content, "recommended_product_ids": []}
