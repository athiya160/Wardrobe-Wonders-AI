from sentence_transformers import SentenceTransformer

# Load the model once
model = SentenceTransformer('all-MiniLM-L6-v2')

def get_embedding(text: str):
    """Generates a single vector embedding for a given string."""
    return model.encode(text)

def get_embeddings(texts: list[str]):
    """Generates vector embeddings for a list of strings."""
    return model.encode(texts)
