import os
import httpx

BACKEND_BASE = os.getenv("BACKEND_URL", os.getenv("NODE_API_URL", "http://localhost:4000")).rstrip("/")
NODE_API = f"{BACKEND_BASE}/products"


async def get_products():
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(NODE_API)

            if response.status_code == 200:
                return response.json()

            return []
    except Exception as e:
        print(f"Notice: Could not fetch initial products from backend ({NODE_API}): {e}")
        return []
