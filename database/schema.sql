-- ============================================================
-- SISTEMA FINANCEIRO COSVAR
-- Script SQL Completo - MySQL InnoDB
-- Padrão: snake_case | ENGINE=InnoDB | AUTO_INCREMENT | FK
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ------------------------------------------------------------
-- 1. USUÁRIOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuario (
  id          INT            NOT NULL AUTO_INCREMENT,
  nome        VARCHAR(120)   NOT NULL,
  email       VARCHAR(150)   NOT NULL,
  senha       VARCHAR(255)   NOT NULL,
  perfil      ENUM('admin','usuario') NOT NULL DEFAULT 'usuario',
  status      ENUM('ativo','inativo') NOT NULL DEFAULT 'ativo',
  created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuario_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. CADASTROS DE DESPESAS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grupo_despesa (
  id          INT           NOT NULL AUTO_INCREMENT,
  nome        VARCHAR(100)  NOT NULL,
  usuario_id  INT           NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_grupo_despesa_usuario (usuario_id),
  CONSTRAINT fk_grupo_despesa_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subgrupo_despesa (
  id          INT           NOT NULL AUTO_INCREMENT,
  nome        VARCHAR(100)  NOT NULL,
  grupo_id    INT           NOT NULL,
  usuario_id  INT           NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_subgrupo_despesa_grupo (grupo_id),
  KEY idx_subgrupo_despesa_usuario (usuario_id),
  CONSTRAINT fk_subgrupo_despesa_grupo   FOREIGN KEY (grupo_id)   REFERENCES grupo_despesa (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_subgrupo_despesa_usuario FOREIGN KEY (usuario_id) REFERENCES usuario       (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS item_despesa (
  id           INT           NOT NULL AUTO_INCREMENT,
  nome         VARCHAR(100)  NOT NULL,
  subgrupo_id  INT           NOT NULL,
  usuario_id   INT           NOT NULL,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_item_despesa_subgrupo (subgrupo_id),
  KEY idx_item_despesa_usuario  (usuario_id),
  CONSTRAINT fk_item_despesa_subgrupo FOREIGN KEY (subgrupo_id) REFERENCES subgrupo_despesa (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_item_despesa_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuario           (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. CADASTROS DE RECEITAS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categoria_receita (
  id          INT           NOT NULL AUTO_INCREMENT,
  nome        VARCHAR(100)  NOT NULL,
  tipo        VARCHAR(80)   NOT NULL,
  usuario_id  INT           NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_categoria_receita_usuario (usuario_id),
  CONSTRAINT fk_categoria_receita_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS descricao_receita (
  id            INT           NOT NULL AUTO_INCREMENT,
  nome          VARCHAR(100)  NOT NULL,
  categoria_id  INT           NOT NULL,
  usuario_id    INT           NOT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_descricao_receita_categoria (categoria_id),
  KEY idx_descricao_receita_usuario   (usuario_id),
  CONSTRAINT fk_descricao_receita_categoria FOREIGN KEY (categoria_id) REFERENCES categoria_receita (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_descricao_receita_usuario   FOREIGN KEY (usuario_id)   REFERENCES usuario            (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. CADASTROS GERAIS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS produtor (
  id          INT           NOT NULL AUTO_INCREMENT,
  nome        VARCHAR(120)  NOT NULL,
  documento   VARCHAR(20)   DEFAULT NULL,
  contato     VARCHAR(80)   DEFAULT NULL,
  endereco    VARCHAR(255)  DEFAULT NULL,
  usuario_id  INT           NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_produtor_usuario (usuario_id),
  CONSTRAINT fk_produtor_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fornecedor (
  id          INT           NOT NULL AUTO_INCREMENT,
  nome        VARCHAR(120)  NOT NULL,
  documento   VARCHAR(20)   DEFAULT NULL,
  contato     VARCHAR(80)   DEFAULT NULL,
  endereco    VARCHAR(255)  DEFAULT NULL,
  usuario_id  INT           NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_fornecedor_usuario (usuario_id),
  CONSTRAINT fk_fornecedor_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comprador (
  id          INT           NOT NULL AUTO_INCREMENT,
  nome        VARCHAR(120)  NOT NULL,
  documento   VARCHAR(20)   DEFAULT NULL,
  contato     VARCHAR(80)   DEFAULT NULL,
  usuario_id  INT           NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_comprador_usuario (usuario_id),
  CONSTRAINT fk_comprador_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projeto (
  id           INT           NOT NULL AUTO_INCREMENT,
  nome         VARCHAR(120)  NOT NULL,
  descricao    TEXT          DEFAULT NULL,
  data_inicio  DATE          DEFAULT NULL,
  data_fim     DATE          DEFAULT NULL,
  status       ENUM('ativo','concluido','cancelado') NOT NULL DEFAULT 'ativo',
  usuario_id   INT           NOT NULL,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_projeto_usuario (usuario_id),
  CONSTRAINT fk_projeto_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS centro_custo (
  id          INT           NOT NULL AUTO_INCREMENT,
  nome        VARCHAR(120)  NOT NULL,
  codigo      VARCHAR(30)   NOT NULL,
  descricao   TEXT          DEFAULT NULL,
  usuario_id  INT           NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_centro_custo_usuario (usuario_id),
  CONSTRAINT fk_centro_custo_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS banco (
  id          INT           NOT NULL AUTO_INCREMENT,
  nome        VARCHAR(100)  NOT NULL,
  codigo      VARCHAR(10)   DEFAULT NULL,
  usuario_id  INT           NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_banco_usuario (usuario_id),
  CONSTRAINT fk_banco_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conta (
  id            INT               NOT NULL AUTO_INCREMENT,
  banco_id      INT               NOT NULL,
  agencia       VARCHAR(20)       DEFAULT NULL,
  numero        VARCHAR(30)       NOT NULL,
  tipo          ENUM('corrente','poupanca','investimento','caixa') NOT NULL DEFAULT 'corrente',
  saldo_inicial DECIMAL(15,2)     NOT NULL DEFAULT 0.00,
  usuario_id    INT               NOT NULL,
  created_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_conta_banco    (banco_id),
  KEY idx_conta_usuario  (usuario_id),
  CONSTRAINT fk_conta_banco    FOREIGN KEY (banco_id)   REFERENCES banco   (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_conta_usuario  FOREIGN KEY (usuario_id) REFERENCES usuario  (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. LANÇAMENTOS FINANCEIROS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS despesa (
  id              INT            NOT NULL AUTO_INCREMENT,
  grupo_id        INT            NOT NULL,
  subgrupo_id     INT            NOT NULL,
  item_id         INT            NOT NULL,
  fornecedor_id   INT            DEFAULT NULL,
  comprador_id    INT            DEFAULT NULL,
  centro_custo_id INT            DEFAULT NULL,
  projeto_id      INT            DEFAULT NULL,
  conta_id        INT            DEFAULT NULL,
  valor           DECIMAL(15,2)  NOT NULL,
  data            DATE           NOT NULL,
  descricao            TEXT           DEFAULT NULL,
  status               ENUM('pago','pendente') NOT NULL DEFAULT 'pendente',
  valor_pago           DECIMAL(15,2)  DEFAULT NULL,
  data_pagamento       DATE           DEFAULT NULL,
  acrescimo            DECIMAL(15,2)  DEFAULT 0.00,
  desconto_pagamento   DECIMAL(15,2)  DEFAULT 0.00,
  usuario_id           INT            NOT NULL,
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_despesa_grupo        (grupo_id),
  KEY idx_despesa_subgrupo     (subgrupo_id),
  KEY idx_despesa_item         (item_id),
  KEY idx_despesa_fornecedor   (fornecedor_id),
  KEY idx_despesa_comprador    (comprador_id),
  KEY idx_despesa_centro_custo (centro_custo_id),
  KEY idx_despesa_projeto      (projeto_id),
  KEY idx_despesa_conta        (conta_id),
  KEY idx_despesa_usuario      (usuario_id),
  KEY idx_despesa_data         (data),
  KEY idx_despesa_status       (status),
  CONSTRAINT fk_despesa_grupo        FOREIGN KEY (grupo_id)        REFERENCES grupo_despesa    (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_despesa_subgrupo     FOREIGN KEY (subgrupo_id)     REFERENCES subgrupo_despesa (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_despesa_item         FOREIGN KEY (item_id)         REFERENCES item_despesa     (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_despesa_fornecedor   FOREIGN KEY (fornecedor_id)   REFERENCES fornecedor       (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_despesa_comprador    FOREIGN KEY (comprador_id)    REFERENCES comprador        (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_despesa_centro_custo FOREIGN KEY (centro_custo_id) REFERENCES centro_custo     (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_despesa_projeto      FOREIGN KEY (projeto_id)      REFERENCES projeto          (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_despesa_conta        FOREIGN KEY (conta_id)        REFERENCES conta            (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_despesa_usuario      FOREIGN KEY (usuario_id)      REFERENCES usuario          (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS receita (
  id            INT            NOT NULL AUTO_INCREMENT,
  categoria_id  INT            NOT NULL,
  descricao_id  INT            NOT NULL,
  projeto_id    INT            DEFAULT NULL,
  conta_id      INT            NOT NULL,
  valor         DECIMAL(15,2)  NOT NULL,
  data          DATE           NOT NULL,
  descricao     TEXT           DEFAULT NULL,
  status        ENUM('recebido','pendente') NOT NULL DEFAULT 'pendente',
  usuario_id    INT            NOT NULL,
  created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_receita_categoria  (categoria_id),
  KEY idx_receita_descricao  (descricao_id),
  KEY idx_receita_projeto    (projeto_id),
  KEY idx_receita_conta      (conta_id),
  KEY idx_receita_usuario    (usuario_id),
  KEY idx_receita_data       (data),
  KEY idx_receita_status     (status),
  CONSTRAINT fk_receita_categoria  FOREIGN KEY (categoria_id) REFERENCES categoria_receita (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_receita_descricao  FOREIGN KEY (descricao_id) REFERENCES descricao_receita (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_receita_projeto    FOREIGN KEY (projeto_id)   REFERENCES projeto           (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_receita_conta      FOREIGN KEY (conta_id)     REFERENCES conta             (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_receita_usuario    FOREIGN KEY (usuario_id)   REFERENCES usuario           (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- SEED: Usuário admin padrão (senha: Admin@123)
-- ------------------------------------------------------------
INSERT INTO usuario (nome, email, senha, perfil, status)
VALUES (
  'Administrador',
  'admin@cosvar.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCkCk.wFJiGXZ9Ej9UzAUCa',
  'admin',
  'ativo'
);

-- ------------------------------------------------------------
-- SEED: Categoria e Descrição de Receita padrão para Cacau
-- Estes registros são obrigatórios para o lançamento automático
-- de receita ao registrar uma Ordem de Venda de Cacau.
-- NÃO EXCLUIR — o sistema depende destes IDs.
-- ------------------------------------------------------------
INSERT INTO categoria_receita (id, nome, tipo, usuario_id)
VALUES (1, 'Cacau', 'Venda', 1)
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

INSERT INTO descricao_receita (id, nome, categoria_id, usuario_id)
VALUES (1, 'Venda de Cacau', 1, 1)
ON DUPLICATE KEY UPDATE nome = VALUES(nome);
