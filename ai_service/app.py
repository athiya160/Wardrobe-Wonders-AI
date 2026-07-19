import asyncio
from fastapi import FastAPI
from routes.ai import router
from services.vector_store import build_index, load_index

app = FastAPI(
    title="AI Fashion Service",
    version="1.0"
)

app.include_router(router)

@app.on_event("startup")
async def startup_event():
    # Only build if not already existing
    index, products = load_index()
    if not index or not products:
        await build_index()
    else:
        print("FAISS index loaded from disk.")

@app.get("/")
def home():
    return {"message": "AI Service Running"}
