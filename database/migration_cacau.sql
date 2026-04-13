-- ============================================================
-- MIGRAÇÃO: Módulos Cacau
-- Produção de Cacau + Cacau a Ordem
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- TABELA: producao_cacau
-- Controle de produção por fazenda/produtor/safra
-- QTD em arrobas (@) — 1 @ = 15kg
-- SC = sacas
-- cmv_kg = custo da mercadoria vendida por kg
-- lucro_kg = lucro por kg
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS producao_cacau (
  id            INT             NOT NULL AUTO_INCREMENT,
  data          DATE            NOT NULL,
  projeto_id    INT             NOT NULL,
  produtor_id   INT             NOT NULL,
  producao      VARCHAR(120)    NOT NULL COMMENT 'Descrição da produção/safra',
  qtd_arrobas   DECIMAL(10,3)   NOT NULL DEFAULT 0.000 COMMENT 'Quantidade em arrobas (@)',
  sacas         DECIMAL(10,3)   DEFAULT NULL COMMENT 'Quantidade em sacas (SC)',
  cmv_kg        DECIMAL(10,4)   DEFAULT NULL COMMENT 'Custo da mercadoria vendida por kg',
  lucro_kg      DECIMAL(10,4)   DEFAULT NULL COMMENT 'Lucro por kg',
  observacao    TEXT            DEFAULT NULL,
  usuario_id    INT             NOT NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_producao_cacau_projeto  (projeto_id),
  KEY idx_producao_cacau_produtor (produtor_id),
  KEY idx_producao_cacau_usuario  (usuario_id),
  KEY idx_producao_cacau_data     (data),
  CONSTRAINT fk_prod_cacau_projeto  FOREIGN KEY (projeto_id)  REFERENCES projeto  (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_prod_cacau_produtor FOREIGN KEY (produtor_id) REFERENCES produtor  (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_prod_cacau_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuario   (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- TABELA: cacau_ordem
-- Vendas de cacau com recebimento futuro ("a ordem")
-- Credora = empresa/pessoa que deve pagar
-- status: pendente | recebido | parcial | cancelado
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cacau_ordem (
  id            INT             NOT NULL AUTO_INCREMENT,
  data          DATE            NOT NULL,
  numero_ordem  VARCHAR(60)     DEFAULT NULL COMMENT 'Número/código da ordem',
  projeto_id    INT             NOT NULL,
  produtor_id   INT             NOT NULL,
  credora       VARCHAR(120)    NOT NULL COMMENT 'Empresa/pessoa que deve pagar',
  preco_arroba  DECIMAL(10,2)   NOT NULL COMMENT 'Preço por arroba (@)',
  kg            DECIMAL(10,3)   NOT NULL DEFAULT 0.000 COMMENT 'Total em kg',
  qtd_arrobas   DECIMAL(10,3)   NOT NULL DEFAULT 0.000 COMMENT 'Quantidade em arrobas (@)',
  lucro         DECIMAL(15,2)   DEFAULT NULL COMMENT 'Lucro calculado',
  status        ENUM('pendente','recebido','parcial','cancelado') NOT NULL DEFAULT 'pendente',
  data_prevista DATE            DEFAULT NULL COMMENT 'Data prevista para recebimento',
  observacao    TEXT            DEFAULT NULL,
  usuario_id    INT             NOT NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_cacau_ordem_projeto  (projeto_id),
  KEY idx_cacau_ordem_produtor (produtor_id),
  KEY idx_cacau_ordem_usuario  (usuario_id),
  KEY idx_cacau_ordem_data     (data),
  KEY idx_cacau_ordem_status   (status),
  CONSTRAINT fk_cacau_ordem_projeto  FOREIGN KEY (projeto_id)  REFERENCES projeto  (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_cacau_ordem_produtor FOREIGN KEY (produtor_id) REFERENCES produtor  (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_cacau_ordem_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuario   (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
