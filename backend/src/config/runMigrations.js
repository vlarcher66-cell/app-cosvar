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
    sql: `
      ALTER TABLE receita
        ADD COLUMN IF NOT EXISTS forma_pagamento_id INT DEFAULT NULL AFTER conta_id
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
      if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log(`⏭️  Migration já aplicada: ${migration.name}`);
      } else {
        console.error(`❌ Migration falhou: ${migration.name} —`, err.message);
      }
    }
  }
};

module.exports = runMigrations;
