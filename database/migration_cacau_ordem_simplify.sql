-- ============================================================
-- MIGRAÇÃO: Simplificar cacau_ordem
-- Remove obrigatoriedade de campos que não são mais usados no form
-- Adiciona auto-geração de numero_ordem via trigger
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Tornar campos opcionais
ALTER TABLE cacau_ordem
  MODIFY COLUMN projeto_id    INT             NULL DEFAULT NULL,
  MODIFY COLUMN produtor_id   INT             NULL DEFAULT NULL,
  MODIFY COLUMN credora       VARCHAR(120)    NULL DEFAULT NULL,
  MODIFY COLUMN preco_arroba  DECIMAL(10,2)   NULL DEFAULT NULL;

-- Remover FK constraints para projeto e produtor (agora opcionais)
ALTER TABLE cacau_ordem
  DROP FOREIGN KEY fk_cacau_ordem_projeto,
  DROP FOREIGN KEY fk_cacau_ordem_produtor;

-- Recriar como opcionais (permite NULL)
ALTER TABLE cacau_ordem
  ADD CONSTRAINT fk_cacau_ordem_projeto  FOREIGN KEY (projeto_id)  REFERENCES projeto  (id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_cacau_ordem_produtor FOREIGN KEY (produtor_id) REFERENCES produtor (id) ON DELETE SET NULL ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;
