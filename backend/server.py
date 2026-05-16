from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
import re
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field


mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# Lojas principais
STORES = ["Castelo", "Mesc", "Delivery", "Baeta", "Producao"]

# Sublojas da Baeta aceitas pelo backend
BAETA_SUBSTORES = ["Pizzaria", "Copa", "Bar"]

# Todas as lojas válidas para criar pedido
VALID_STORES = STORES + BAETA_SUBSTORES

STORE_LABELS = {
    "Castelo": "Castelo",
    "Mesc": "Mesc",
    "Delivery": "Delivery",
    "Baeta": "Baeta",
    "Producao": "Produção",
    "Pizzaria": "Pizzaria",
    "Copa": "Copa",
    "Bar": "Bar",
}

# Aceita tanto maiúsculo quanto minúsculo vindo do frontend
STORE_ALIASES = {
    "castelo": "Castelo",
    "mesc": "Mesc",
    "delivery": "Delivery",
    "baeta": "Baeta",
    "producao": "Producao",
    "produção": "Producao",
    "pizzaria": "Pizzaria",
    "copa": "Copa",
    "bar": "Bar",
}

CATEGORIES = ["Mercearia", "Resfriados", "Limpeza", "Embalagens", "Hortifruti", "Bebidas", "Doces", "Outros"]


CATEGORY_ALIASES = {
    "Hortfrut": "Hortifruti",
    "Hortifrut": "Hortifruti",
    "hortifrt": "Hortifruti",
    "Hortifruti": "Hortifruti",
}


def normalize_category(category: Optional[str]) -> Optional[str]:
    if not category:
        return category
    return CATEGORY_ALIASES.get(category, category)


def normalize_store(store: Optional[str]) -> Optional[str]:
    if not store:
        return store
    store_clean = store.strip()
    return STORE_ALIASES.get(store_clean.lower(), store_clean)


from products_config import PRODUCTS as SEED_PRODUCTS



def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def normalize_phone(phone: str) -> str:
    return re.sub(r"\D", "", phone or "")


def create_access_token(user_id: str, phone: str) -> str:
    payload = {
        "sub": user_id,
        "phone": phone,
        "exp": datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if not creds or not creds.credentials:
        raise HTTPException(status_code=401, detail="Não autenticado")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token inválido")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")



class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    phone: str = Field(..., min_length=8, max_length=20)
    password: str = Field(..., min_length=4, max_length=80)
    role: str = Field(..., pattern="^(pedir|receber)$")


class LoginRequest(BaseModel):
    phone: str
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    phone: str
    role: str
    created_at: datetime


class AuthResponse(BaseModel):
    token: str
    user: UserOut


class Product(BaseModel):
    id: str
    name: str
    category: str


class OrderItem(BaseModel):
    product_id: str
    name: str
    quantity: int = Field(..., ge=0)


class CreateOrderRequest(BaseModel):
    store: str
    items: List[OrderItem]


class ReceiveOrderRequest(BaseModel):

    items: Optional[List[OrderItem]] = None
    adjustment_note: Optional[str] = None


class Order(BaseModel):
    id: str
    store: str
    store_label: str
    items: List[OrderItem]
    original_items: Optional[List[OrderItem]] = None
    adjustment_note: Optional[str] = None
    has_adjustments: bool = False
    status: str  # 'em_via' or 'recebido'
    created_by: str
    created_by_name: Optional[str] = None
    created_at: datetime
    received_by: Optional[str] = None
    received_by_name: Optional[str] = None
    received_at: Optional[datetime] = None


def require_role(user: dict, role: str):
    user_role = user.get("role") or "pedir"
    if user_role != role:
        raise HTTPException(
            status_code=403,
            detail=f"Acesso negado: este usuário é do tipo '{user_role}'.",
        )



@api_router.post("/auth/register", response_model=AuthResponse)
async def register(payload: RegisterRequest):
    phone = normalize_phone(payload.phone)
    if len(phone) < 8:
        raise HTTPException(status_code=400, detail="Telefone inválido")
    existing = await db.users.find_one({"phone": phone})
    if existing:
        raise HTTPException(status_code=400, detail="Telefone já cadastrado")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": payload.name.strip(),
        "phone": phone,
        "role": payload.role,
        "password_hash": hash_password(payload.password),
        "created_at": datetime.now(timezone.utc),
    }
    await db.users.insert_one(user_doc)
    token = create_access_token(user_id, phone)
    return AuthResponse(
        token=token,
        user=UserOut(id=user_id, name=user_doc["name"], phone=phone, role=payload.role, created_at=user_doc["created_at"]),
    )


@api_router.post("/auth/login", response_model=AuthResponse)
async def login(payload: LoginRequest):
    phone = normalize_phone(payload.phone)
    user = await db.users.find_one({"phone": phone})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Telefone ou senha incorretos")
    token = create_access_token(user["id"], user["phone"])
    return AuthResponse(
        token=token,
        user=UserOut(
            id=user["id"],
            name=user["name"],
            phone=user["phone"],
            role=user.get("role") or "pedir",
            created_at=user["created_at"],
        ),
    )


@api_router.get("/auth/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return UserOut(
        id=user["id"],
        name=user["name"],
        phone=user["phone"],
        role=user.get("role") or "pedir",
        created_at=user["created_at"],
    )



@api_router.get("/stores")
async def list_stores(_: dict = Depends(get_current_user)):
    return [{"id": s, "label": STORE_LABELS[s]} for s in STORES]


@api_router.get("/categories")
async def list_categories(_: dict = Depends(get_current_user)):

    return [normalize_category(c) or c for c in CATEGORIES]


@api_router.get("/products", response_model=List[Product])
async def list_products(category: Optional[str] = None, _: dict = Depends(get_current_user)):
    query = {}
    if category:
        normalized_category = normalize_category(category)
        aliases = [old for old, new in CATEGORY_ALIASES.items() if new == normalized_category]
        query["category"] = {"$in": list(set([normalized_category, *aliases]))}
    products = await db.products.find(query, {"_id": 0}).sort("name", 1).to_list(500)
    return [
        Product(**{**p, "category": normalize_category(p.get("category")) or p.get("category")})
        for p in products
    ]



@api_router.post("/orders", response_model=Order)
async def create_order(payload: CreateOrderRequest, user: dict = Depends(get_current_user)):
    require_role(user, "pedir")
    normalized_store = normalize_store(payload.store)
    if normalized_store not in VALID_STORES:
        raise HTTPException(status_code=400, detail="Loja inválida")
    if not payload.items:
        raise HTTPException(status_code=400, detail="Carrinho vazio")
    order_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    doc = {
        "id": order_id,
        "store": normalized_store,
        "store_label": STORE_LABELS[normalized_store],
        "items": [item.model_dump() for item in payload.items],
        "original_items": None,
        "adjustment_note": None,
        "has_adjustments": False,
        "status": "em_via",
        "created_by": user["id"],
        "created_by_name": user["name"],
        "created_at": now,
        "received_by": None,
        "received_by_name": None,
        "received_at": None,
    }
    await db.orders.insert_one(doc)
    doc.pop("_id", None)
    return Order(**doc)


@api_router.get("/orders", response_model=List[Order])
async def list_orders(
    store: Optional[str] = None,
    status: Optional[str] = None,
    mine: bool = False,
    user: dict = Depends(get_current_user),
):
    user_role = user.get("role") or "pedir"
    query = {}
    if store:
        query["store"] = normalize_store(store)
    if status:
        query["status"] = status
    if mine or user_role == "pedir":
        
        query["created_by"] = user["id"]
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [Order(**o) for o in orders]


@api_router.post("/orders/{order_id}/receive", response_model=Order)
async def receive_order(
    order_id: str,
    payload: Optional[ReceiveOrderRequest] = None,
    user: dict = Depends(get_current_user),
):

    require_role(user, "receber")
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    if order["status"] == "recebido":
        raise HTTPException(status_code=400, detail="Pedido já recebido")

    now = datetime.now(timezone.utc)
    original_items: List[dict] = list(order.get("items") or [])

    
    final_items: List[dict] = [dict(it) for it in original_items]
    adjustment_note: Optional[str] = None
    altered = False  # marca se o recebedor de fato mandou um payload com items

    if payload and payload.items is not None:
        if not payload.items:
            raise HTTPException(status_code=400, detail="O pedido precisa ter pelo menos 1 item")
    
        final_items = [
            {
                "product_id": str(item.product_id),
                "name": item.name,
                "quantity": int(item.quantity) if item.quantity is not None else 0,
            }
            for item in payload.items
        ]
        altered = True

    if payload and payload.adjustment_note:
        adjustment_note = (payload.adjustment_note.strip()[:500]) or None

    def item_key(item: dict) -> str:
        return str(item.get("product_id") or item.get("name") or "")

    original_by_product = {item_key(item): item for item in original_items}
    final_by_product = {item_key(item): item for item in final_items}

    
    has_adjustments = bool(adjustment_note)
    if not has_adjustments:
        has_adjustments = set(original_by_product.keys()) != set(final_by_product.keys())
    if not has_adjustments:
        for product_id, original in original_by_product.items():
            delivered = final_by_product.get(product_id)
            if not delivered or int(original.get("quantity", 0)) != int(delivered.get("quantity", 0)):
                has_adjustments = True
                break

    update_doc = {
        "status": "recebido",
        
        "items": final_items,
        
        "original_items": original_items if (altered and has_adjustments) else None,
        "adjustment_note": adjustment_note,
        "has_adjustments": has_adjustments,
        "received_by": user["id"],
        "received_by_name": user["name"],
        "received_at": now,
    }

    await db.orders.update_one({"id": order_id}, {"$set": update_doc})
    order.update(update_doc)
    return Order(**order)


@api_router.get("/history", response_model=List[Order])
async def get_history(user: dict = Depends(get_current_user)):

    user_role = user.get("role") or "pedir"
    if user_role =="receber":
        query = {
            "status": "recebido",
            "hidden_from_receiver": {"$ne": True}
        }
    else:
        query = {
            "created_by": user["id"],
            "hidden_from_sender": {"$ne": True}
        }
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Order(**o) for o in orders]


@api_router.delete("/history")
async def clear_history(user: dict = Depends(get_current_user)):
    user_role = user.get("role") or "pedir"
    if user_role =="receber":
        query = {"status": "recebido"}
        update = {"$set": {"hidden_from_receiver": True}}
    else:
        query = {"created_by": user ["id"], "status": "recebido"}
        update = {"$set": {"hidden_from_sender": True}}

    res = await db.orders.update_many(query, update)
    return {"hidden": res.modified_count}

@api_router.get("/")
async def root():
    return {"app": "Estoque API", "status": "ok"}



@app.on_event("startup")
async def on_startup():
    await db.users.create_index("phone", unique=True)
    await db.products.create_index([("category", 1), ("name", 1)])
    await db.orders.create_index("store")
    await db.orders.create_index("status")
    await db.orders.create_index("created_at")

    await db.products.update_many(
        {"category": {"$in": ["Hortfrut", "Hortifrut", "hortifrt"]}},
        {"$set": {"category": "Hortifruti"}},
    )


    desired = {(cat, name.strip()) for cat, names in SEED_PRODUCTS.items() for name in names if name.strip()}
    existing_docs = await db.products.find({}, {"_id": 0}).to_list(2000)
    existing_set = {(d["category"], d["name"]) for d in existing_docs}

    to_insert = desired - existing_set
    to_delete = existing_set - desired

    if to_insert:
        await db.products.insert_many([
            {"id": str(uuid.uuid4()), "category": cat, "name": name}
            for (cat, name) in to_insert
        ])
    if to_delete:
        await db.products.delete_many({
            "$or": [{"category": cat, "name": name} for (cat, name) in to_delete]
        })

    logger.info("Sync produtos: +%d novos, -%d removidos, %d total",
                len(to_insert), len(to_delete), len(desired))


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()



app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
