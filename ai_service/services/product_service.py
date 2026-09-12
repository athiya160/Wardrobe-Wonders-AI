import os
import httpx

BACKEND_BASE = os.getenv("BACKEND_URL", os.getenv("NODE_API_URL", "http://localhost:4000")).rstrip("/")
NODE_API = f"{BACKEND_BASE}/products"


async def get_products():
    async with httpx.AsyncClient() as client:
        response = await client.get(NODE_API)

        if response.status_code == 200:
            return response.json()

        return []
