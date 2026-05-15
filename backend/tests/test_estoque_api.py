"""Estoque inventory API tests - covers auth, catalog, orders flows."""
import os
import time
import uuid

import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://estoque-simples.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


def _unique_phone() -> str:
    return "11" + str(int(time.time() * 1000) % 1_000_000_000).zfill(9)


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def user_a(session):
    """Register user A who will create orders."""
    phone = _unique_phone()
    r = session.post(f"{API}/auth/register", json={"name": "TEST_UserA", "phone": phone, "password": "senha123"})
    assert r.status_code == 200, r.text
    data = r.json()
    return {"token": data["token"], "user": data["user"], "password": "senha123", "phone": phone}


@pytest.fixture(scope="module")
def user_b(session):
    """Register user B who will receive orders."""
    time.sleep(0.01)
    phone = _unique_phone() + "X"  # ensure differs - phone normalized strips non-digits, append digit instead
    phone = "11" + str((int(time.time() * 1000) + 1) % 1_000_000_000).zfill(9)
    r = session.post(f"{API}/auth/register", json={"name": "TEST_UserB", "phone": phone, "password": "senha123"})
    assert r.status_code == 200, r.text
    data = r.json()
    return {"token": data["token"], "user": data["user"], "password": "senha123", "phone": phone}



class TestAuth:
    def test_register_returns_token_and_user(self, user_a):
        assert user_a["token"]
        assert user_a["user"]["name"] == "TEST_UserA"
        assert len(user_a["user"]["phone"]) >= 8

    def test_login_with_correct_credentials(self, session, user_a):
        r = session.post(f"{API}/auth/login", json={"phone": user_a["phone"], "password": user_a["password"]})
        assert r.status_code == 200
        d = r.json()
        assert "token" in d and d["user"]["id"] == user_a["user"]["id"]

    def test_login_wrong_password_returns_401(self, session, user_a):
        r = session.post(f"{API}/auth/login", json={"phone": user_a["phone"], "password": "wrong"})
        assert r.status_code == 401

    def test_register_duplicate_phone_returns_400(self, session, user_a):
        r = session.post(f"{API}/auth/register", json={"name": "TEST_Dup", "phone": user_a["phone"], "password": "senha123"})
        assert r.status_code == 400

    def test_me_with_token(self, session, user_a):
        r = session.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {user_a['token']}"})
        assert r.status_code == 200
        assert r.json()["id"] == user_a["user"]["id"]

    def test_me_without_token_returns_401(self, session):
        r = session.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_protected_endpoint_requires_auth(self, session):
        for path in ["/stores", "/categories", "/products", "/orders"]:
            r = session.get(f"{API}{path}")
            assert r.status_code == 401, f"{path} should require auth"



class TestCatalog:
    def test_stores_returns_5_expected(self, session, user_a):
        r = session.get(f"{API}/stores", headers={"Authorization": f"Bearer {user_a['token']}"})
        assert r.status_code == 200
        ids = [s["id"] for s in r.json()]
        assert set(ids) == {"Castelo", "Mesc", "Delivery", "Baeta", "Producao"}

    def test_categories_returns_4(self, session, user_a):
        r = session.get(f"{API}/categories", headers={"Authorization": f"Bearer {user_a['token']}"})
        assert r.status_code == 200
        assert set(r.json()) == {"Secos", "Geladeira", "Limpeza", "Embalagens"}

    def test_products_filtered_by_category(self, session, user_a):
        r = session.get(f"{API}/products", params={"category": "Secos"},
                        headers={"Authorization": f"Bearer {user_a['token']}"})
        assert r.status_code == 200
        prods = r.json()
        assert len(prods) > 0
        assert all(p["category"] == "Secos" for p in prods)
        # Validate fields
        assert all("id" in p and "name" in p for p in prods)



class TestOrders:
    def test_full_order_flow(self, session, user_a, user_b):
        
        ph = {"Authorization": f"Bearer {user_a['token']}"}
        prods = session.get(f"{API}/products", params={"category": "Secos"}, headers=ph).json()
        assert len(prods) >= 2
        items = [
            {"product_id": prods[0]["id"], "name": prods[0]["name"], "quantity": 2},
            {"product_id": prods[1]["id"], "name": prods[1]["name"], "quantity": 1},
        ]
        
        r = session.post(f"{API}/orders", json={"store": "Castelo", "items": items}, headers=ph)
        assert r.status_code == 200, r.text
        order = r.json()
        assert order["status"] == "em_via"
        assert order["store"] == "Castelo"
        assert order["created_by_name"] == "TEST_UserA"
        order_id = order["id"]

        
        r = session.get(f"{API}/orders", params={"store": "Castelo", "status": "em_via"}, headers=ph)
        assert r.status_code == 200
        assert any(o["id"] == order_id for o in r.json())

        
        r = session.get(f"{API}/orders", params={"store": "Mesc", "status": "em_via"}, headers=ph)
        assert all(o["id"] != order_id for o in r.json())

        
        ph_b = {"Authorization": f"Bearer {user_b['token']}"}
        r = session.post(f"{API}/orders/{order_id}/receive", headers=ph_b)
        assert r.status_code == 200, r.text
        rec = r.json()
        assert rec["status"] == "recebido"
        assert rec["received_by_name"] == "TEST_UserB"
        assert rec["received_at"] is not None

        
        r = session.post(f"{API}/orders/{order_id}/receive", headers=ph_b)
        assert r.status_code == 400

        r = session.get(f"{API}/orders", params={"store": "Castelo", "status": "em_via"}, headers=ph)
        assert all(o["id"] != order_id for o in r.json())

    def test_create_order_requires_auth(self, session):
        r = session.post(f"{API}/orders", json={"store": "Castelo", "items": []})
        assert r.status_code == 401

    def test_create_order_invalid_store(self, session, user_a):
        ph = {"Authorization": f"Bearer {user_a['token']}"}
        r = session.post(f"{API}/orders", json={"store": "InvalidStore",
                                                "items": [{"product_id": "x", "name": "y", "quantity": 1}]},
                         headers=ph)
        assert r.status_code == 400

    def test_create_order_empty_cart(self, session, user_a):
        ph = {"Authorization": f"Bearer {user_a['token']}"}
        r = session.post(f"{API}/orders", json={"store": "Castelo", "items": []}, headers=ph)
        assert r.status_code == 400

    def test_receive_nonexistent_order(self, session, user_a):
        ph = {"Authorization": f"Bearer {user_a['token']}"}
        r = session.post(f"{API}/orders/{uuid.uuid4()}/receive", headers=ph)
        assert r.status_code == 404
