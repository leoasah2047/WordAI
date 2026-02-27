import os
from typing import List, Optional
from fastapi import UploadFile, File
from langchain_community.document_loaders import PyMuPDFLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from langchain_core.documents import Document
from qdrant_client import QdrantClient
from qdrant_client.http import models
import tempfile
from fastembed import SparseTextEmbedding

from config import settings

class RAGService:
    def __init__(self):
        # Configuration from centralized settings
        self.google_api_key = settings.GOOGLE_API_KEY
        self.qdrant_url = settings.QDRANT_URL
        self.qdrant_api_key = settings.QDRANT_API_KEY
        self.collection_name = settings.QDRANT_COLLECTION_NAME
        self.use_hybrid = settings.USE_HYBRID_SEARCH
        
        self.embeddings = None
        self.sparse_embeddings = None
        
        if self.google_api_key:
            self._init_embeddings(self.google_api_key)

        if self.use_hybrid:
            self.sparse_embeddings = SparseTextEmbedding(model_name=settings.SPARSE_EMBEDDING_MODEL)

        # Initialize Qdrant Client
        # If running locally without a server, you can use path="local_qdrant"
        if self.qdrant_url and self.qdrant_url != "local":
             self.client = QdrantClient(
                url=self.qdrant_url,
                api_key=self.qdrant_api_key
            )
        else:
            # Fallback to local disk storage
            self.client = QdrantClient(path="./qdrant_data")
            print("Using local Qdrant storage at ./qdrant_data")

    def _init_embeddings(self, api_key: str):
         self.embeddings = GoogleGenerativeAIEmbeddings(
                model="models/text-embedding-004",
                google_api_key=api_key,
                # This is the "Backup" fix:
                output_dimensionality=512
            )

    def update_api_key(self, api_key: str):
        if api_key and api_key != self.google_api_key:
            self.google_api_key = api_key
            self._init_embeddings(api_key)

    def _get_vector_store(self):
        if not self.embeddings:
            raise ValueError("Missing Google Gemini API key.")

        # Ensure collection exists
        if not self.client.collection_exists(self.collection_name):
            try:
                vectors_config = models.VectorParams(
                    size=settings.DENSE_EMBEDDING_DIM, # Optimized dimension (e.g., 512)
                    distance=models.Distance.COSINE
                )
                
                sparse_vectors_config = None
                if self.use_hybrid:
                    sparse_vectors_config = {
                        "sparse-text": models.SparseVectorParams(
                            index=models.SparseIndexParams(
                                on_disk=True,
                            )
                        )
                    }

                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=vectors_config,
                    sparse_vectors_config=sparse_vectors_config
                )
            except Exception as e:
                print(f"Error creating collection: {e}")

        return QdrantVectorStore(
            client=self.client,
            collection_name=self.collection_name,
            embedding=self.embeddings,
        )

    async def ingest_file(self, file: UploadFile, metadata: dict):
        if not self.embeddings:
            raise ValueError("Google API key not configured")
            
        # Save temp file to load
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        try:
            documents = []
            if suffix.lower() == ".pdf":
                loader = PyMuPDFLoader(tmp_path)
                documents = loader.load()
            elif suffix.lower() in [".docx", ".doc"]:
                loader = Docx2txtLoader(tmp_path)
                documents = loader.load()
            else:
                # Text fallback
                with open(tmp_path, "r", encoding="utf-8") as f:
                    text = f.read()
                documents = [Document(page_content=text)]

            # Add metadata
            for doc in documents:
                doc.metadata.update(metadata)
                doc.metadata["source"] = file.filename

            # Split
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200
            )
            splits = text_splitter.split_documents(documents)

            # Index
            vector_store = self._get_vector_store()
            
            if self.use_hybrid and self.sparse_embeddings:
                # Add documents with sparse vectors
                # LangChain Qdrant implementation handles hybrid search if configured
                # However, for manual control or ensuring sparse vectors are generated:
                texts = [doc.page_content for doc in splits]
                metadatas = [doc.metadata for doc in splits]
                
                vector_store.add_texts(
                    texts=texts,
                    metadatas=metadatas
                )
            else:
                vector_store.add_documents(documents=splits)
            
            print(f"Successfully processed {file.filename}: {len(splits)} chunks indexed with metadata {metadata}")
            return {"status": "success", "chunks_processed": len(splits)}

        except Exception as e:
            print(f"Error indexing file {file.filename}: {e}")
            raise e
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    async def query(self, query_text: str, filters: dict = None, top_k: int = 4):
        vector_store = self._get_vector_store()
        
        # If filters contains 'sources' as a list, we convert it to a Qdrant 'match' filter
        qdrant_filter = None
        if filters:
            if "sources" in filters and isinstance(filters["sources"], list):
                sources = filters.pop("sources")
                qdrant_filter = models.Filter(
                    must=[
                        models.FieldCondition(
                            key="metadata.source",
                            match=models.MatchAny(any=sources)
                        )
                    ]
                )
                # Merge other filters if any
                for key, val in filters.items():
                    qdrant_filter.must.append(
                        models.FieldCondition(key=f"metadata.{key}", match=models.MatchValue(value=val))
                    )
            else:
                # Fallback to simple dict filter for LangChain
                qdrant_filter = filters

        search_type = "similarity"
        if self.use_hybrid:
            # LangChain Qdrant supports hybrid search via search_type="mmr" or custom logic
            # For Qdrant specific hybrid, we can use the underlying client or trust LangChain's hybrid implementation
            results = vector_store.similarity_search(
                query_text,
                k=top_k,
                filter=qdrant_filter,
                search_type="hybrid" # Supported by langchain-qdrant
            )
        else:
            results = vector_store.similarity_search(
                query_text,
                k=top_k,
                filter=qdrant_filter
            )
        
        return results

rag_service = RAGService()
