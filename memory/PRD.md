# PRD - Estoque (App de Estoque)

## Visão
App mobile Expo simples e objetivo para fluxo de pedidos e recebimento de produtos entre lojas, em Português (Brasil). Múltiplos usuários conectados online via backend FastAPI + MongoDB.

## Personas
- **Solicitante**: usa "PEDIR" para montar carrinho de produtos a serem solicitados a uma loja.
- **Recebedor**: usa "RECEBER" para confirmar entrega dos pedidos "em via" da sua loja.

## Fluxo principal
1. Login/Cadastro com telefone + senha (JWT).
2. Home: cards "PEDIR" (azul) e "RECEBER" (verde).
3. PEDIR → Lojas → Categorias → Produtos (qtd +/-) → Carrinho → Confirmar (status `em_via`).
4. RECEBER → Lojas (com badge de pendentes) → Pedidos em via → Confirmar Recebimento (status `recebido`).

## Lojas (fixas)
Castelo, Mesc, Delivery, Baeta, Produção.

## Categorias / Setores (fixos)
Secos, Geladeira, Limpeza, Embalagens — com 25 produtos pré-cadastrados (seed).

## Backend (FastAPI + MongoDB)
- POST /api/auth/register, /api/auth/login, GET /api/auth/me
- GET /api/stores, /api/categories, /api/products?category=
- POST /api/orders, GET /api/orders?store=&status=&mine=, POST /api/orders/{id}/receive
- Indexes: users.phone(unique), products(category,name), orders(store/status/created_at)

## Frontend (Expo Router)
- /, /login, /register, /home
- /pedir/lojas, /pedir/categorias, /pedir/produtos, /pedir/carrinho
- /receber/lojas, /receber/pedidos
- AsyncStorage para token JWT, axios com interceptor.

## Status
MVP funcional. Backend 15/15 testes passando. E2E PEDIR e RECEBER validados.
