-- Adiciona forma_pagamento_id na tabela receita
ALTER TABLE receita
  ADD COLUMN forma_pagamento_id INT DEFAULT NULL AFTER conta_id,
  ADD CONSTRAINT fk_receita_forma_pagamento
    FOREIGN KEY (forma_pagamento_id) REFERENCES forma_pagamento (id)
    ON DELETE SET NULL ON UPDATE CASCADE;
