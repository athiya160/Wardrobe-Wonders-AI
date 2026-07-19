import numpy as np
from services.vector_store import load_index
from services.embeddings import get_embedding

def search_products(query: str, top_k: int = 5):
    """Searches the local FAISS index for relevant products."""
    index, products = load_index()
    
    if not index or not products:
        print("Warning: Index not found or empty.")
        return []
        
    # Embed the query
    query_vector = get_embedding(query)
    query_vector = np.array([query_vector]).astype("float32")
    
    # Limit top_k to the number of available products
    top_k = min(top_k, len(products))
    if top_k == 0:
        return []
        
    # Search the index
    distances, indices = index.search(query_vector, top_k)
    
    # Retrieve the corresponding products
    results = []
    for idx in indices[0]:
        if idx != -1 and idx < len(products):
            results.append(products[idx])
            
    return results
