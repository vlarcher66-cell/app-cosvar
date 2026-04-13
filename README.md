# Cosvar — Sistema Financeiro

Sistema financeiro completo com Node.js, React e MySQL.

## Estrutura

```
app_cosvar/
├── database/
│   └── schema.sql          # Script SQL completo
├── backend/                # API Node.js + Express
│   ├── .env.example
│   ├── server.js
│   └── src/
│       ├── config/         # database.js
│       ├── middlewares/    # auth, error, validation
│       ├── utils/          # apiResponse, jwt, bcrypt
│       ├── repositories/   # acesso ao banco (mysql2)
│       ├── services/       # regras de negócio
│       ├── controllers/    # handlers HTTP
│       └── routes/         # roteamento Express
└── frontend/               # React + Vite
    └── src/
        ├── pages/          # Login, Dashboard, Financeiro, Cadastros
        ├── components/     # Layout, UI, Shared
        ├── services/       # Axios calls
        ├── contexts/       # AuthContext
        └── utils/          # formatters
```

## Como rodar

### 1. Banco de dados MySQL

```sql
CREATE DATABASE cosvar_financeiro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cosvar_financeiro;
-- Execute o script:
SOURCE database/schema.sql;
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edite o .env com suas credenciais MySQL
npm install
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse: **http://localhost:5173**

## Credenciais padrão

| Campo  | Valor             |
|--------|-------------------|
| Email  | admin@cosvar.com  |
| Senha  | Admin@123         |

## API Endpoints

| Método | Rota                          | Descrição             |
|--------|-------------------------------|-----------------------|
| POST   | /api/auth/login               | Login                 |
| GET    | /api/auth/me                  | Usuário atual         |
| GET    | /api/dashboard/resumo         | KPIs do dashboard     |
| GET    | /api/despesas                 | Lista despesas        |
| POST   | /api/despesas                 | Criar despesa         |
| PUT    | /api/despesas/:id             | Editar despesa        |
| DELETE | /api/despesas/:id             | Excluir despesa       |
| GET    | /api/receitas                 | Lista receitas        |
| ...    | (padrão CRUD para todos)      |                       |
| GET    | /api/subgrupos-despesa/por-grupo/:id | Subgrupos por grupo |
| GET    | /api/itens-despesa/por-subgrupo/:id  | Itens por subgrupo  |
