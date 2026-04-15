-- Forma de pagamento (PIX, Dinheiro, TED, Cheque, etc.)
CREATE TABLE IF NOT EXISTS forma_pagamento (
  id          INT          NOT NULL AUTO_INCREMENT,
  nome        VARCHAR(80)  NOT NULL,
  usuario_id  INT          NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_forma_pagamento_usuario (usuario_id),
  CONSTRAINT fk_forma_pagamento_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
