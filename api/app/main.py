from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.articles import router as articles_router
from app.routes.categories import router as categories_router
from app.routes.health import router as health_router
from app.routes.sources import router as sources_router
from app.routes.sync import router as sync_router

app = FastAPI(
    title="RSS Reader",
    description="A personal RSS and Atom feed reader.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(categories_router, prefix="/api")
app.include_router(articles_router, prefix="/api")
app.include_router(health_router)
app.include_router(sources_router, prefix="/api")
app.include_router(sync_router, prefix="/api")
