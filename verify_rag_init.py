import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

try:
    from config import settings
    from rag import RAGService
    from fastembed import SparseTextEmbedding
    
    print(f"FASTEMBED_CACHE_PATH: {settings.FASTEMBED_CACHE_PATH}")
    
    # Mock settings if necessary or just try to init
    # We want to see if SparseTextEmbedding inits with the cache_dir
    rag = RAGService()
    
    if rag.sparse_embeddings:
        print("Successfully initialized SparseTextEmbedding via RAGService")
        # Check internal state if possible
        print(f"Model cache dir: {rag.sparse_embeddings.model.cache_dir}")
    else:
        print("SparseTextEmbedding not initialized (USE_HYBRID_SEARCH might be False)")

    print("Verification complete!")
    
except Exception as e:
    print(f"Verification failed: {e}")
    sys.exit(1)
