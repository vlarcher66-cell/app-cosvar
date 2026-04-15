const db = require('./database');

const migrations = [
  {
    name: 'create_forma_pagamento',
    sql: `
      CREATE TABLE IF NOT EXISTS forma_pagamento (
        id          INT          NOT NULL AUTO_INCREMENT,
        nome        VARCHAR(80)  NOT NULL,
        usuario_id  INT          NOT NULL,
        created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_forma_pagamento_usuario (usuario_id),
        CONSTRAINT fk_forma_pagamento_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
  },
  {
    name: 'add_forma_pagamento_id_to_receita',
    sql: `ALTER TABLE receita ADD COLUMN IF NOT EXISTS forma_pagamento_id INT DEFAULT NULL AFTER conta_id`,
  },
  {
    name: 'add_cacau_baixa_id_to_receita',
    sql: `ALTER TABLE receita ADD COLUMN IF NOT EXISTS cacau_baixa_id INT DEFAULT NULL AFTER forma_pagamento_id`,
  },
  {
    name: 'add_fk_receita_cacau_baixa',
    sql: `
      ALTER TABLE receita
        ADD CONSTRAINT fk_receita_cacau_baixa
        FOREIGN KEY (cacau_baixa_id) REFERENCES cacau_baixa (id)
        ON DELETE CASCADE ON UPDATE CASCADE
    `,
  },
  {
    name: 'add_comprador_id_to_cacau_ordem',
    sql: `ALTER TABLE cacau_ordem ADD COLUMN IF NOT EXISTS comprador_id INT DEFAULT NULL AFTER credora`,
  },
  {
    name: 'add_fk_cacau_ordem_comprador',
    sql: `
      ALTER TABLE cacau_ordem
        ADD CONSTRAINT fk_cacau_ordem_comprador
        FOREIGN KEY (comprador_id) REFERENCES comprador (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
    `,
  },
  {
    name: 'add_comprador_id_to_cacau_baixa',
    sql: `ALTER TABLE cacau_baixa ADD COLUMN IF NOT EXISTS comprador_id INT DEFAULT NULL AFTER credora`,
  },
  {
    name: 'add_fk_cacau_baixa_comprador',
    sql: `
      ALTER TABLE cacau_baixa
        ADD CONSTRAINT fk_cacau_baixa_comprador
        FOREIGN KEY (comprador_id) REFERENCES comprador (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
    `,
  },
];

const runMigrations = async () => {
  for (const migration of migrations) {
    try {
      await db.query(migration.sql);
      console.log(`✅ Migration OK: ${migration.name}`);
    } catch (err) {
      // Ignora erro de coluna/tabela já existente
      if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_FK_DUP_NAME' || err.code === 'ER_DUP_KEY') {
        console.log(`⏭️  Migration já aplicada: ${migration.name}`);
      } else {
        console.error(`❌ Migration falhou: ${migration.name} —`, err.message);
      }
    }
  }
};

module.exports = runMigrations;
