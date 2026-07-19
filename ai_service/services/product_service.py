import httpx

NODE_API = "http://localhost:4000/products"


async def get_products():
    async with httpx.AsyncClient() as client:
        response = await client.get(NODE_API)

        if response.status_code == 200:
            return response.json()

        return []
