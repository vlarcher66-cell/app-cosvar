const db = require('./database');

// Helper: adiciona coluna só se não existir (compatível com MySQL 5.7+)
async function addColumnIfNotExists(table, column, definition) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (rows[0].cnt > 0) {
    console.log(`⏭️  Coluna já existe: ${table}.${column}`);
    return;
  }
  await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  console.log(`✅ Coluna adicionada: ${table}.${column}`);
}

// Helper: adiciona FK só se não existir
async function addFkIfNotExists(table, constraintName, fkSql) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?`,
    [table, constraintName]
  );
  if (rows[0].cnt > 0) {
    console.log(`⏭️  FK já existe: ${constraintName}`);
    return;
  }
  await db.query(`ALTER TABLE ${table} ADD CONSTRAINT ${constraintName} ${fkSql}`);
  console.log(`✅ FK adicionada: ${constraintName}`);
}

const runMigrations = async () => {
  try {
    // 1. forma_pagamento — cria sem FK inline para evitar ER_FK_DUP_NAME mascarando a criação
    await db.query(`
      CREATE TABLE IF NOT EXISTS forma_pagamento (
        id          INT          NOT NULL AUTO_INCREMENT,
        nome        VARCHAR(80)  NOT NULL,
        usuario_id  INT          NOT NULL,
        created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_forma_pagamento_usuario (usuario_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `).catch(e => { if (e.code !== 'ER_TABLE_EXISTS_ERROR') throw e; });
    console.log('✅ Migration OK: create_forma_pagamento');
    // FK separada para não bloquear criação da tabela
    await addFkIfNotExists('forma_pagamento', 'fk_forma_pagamento_usuario',
      `FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE RESTRICT ON UPDATE CASCADE`
    );

    // 2. receita — forma_pagamento_id
    await addColumnIfNotExists('receita', 'forma_pagamento_id', 'INT DEFAULT NULL AFTER conta_id');

    // 3. receita — cacau_baixa_id
    await addColumnIfNotExists('receita', 'cacau_baixa_id', 'INT DEFAULT NULL');

    // 4. FK receita → cacau_baixa
    await addFkIfNotExists('receita', 'fk_receita_cacau_baixa',
      `FOREIGN KEY (cacau_baixa_id) REFERENCES cacau_baixa (id) ON DELETE CASCADE ON UPDATE CASCADE`
    );

    // 5. cacau_ordem — comprador_id
    await addColumnIfNotExists('cacau_ordem', 'comprador_id', 'INT DEFAULT NULL');

    // 6. FK cacau_ordem → comprador
    await addFkIfNotExists('cacau_ordem', 'fk_cacau_ordem_comprador',
      `FOREIGN KEY (comprador_id) REFERENCES comprador (id) ON DELETE RESTRICT ON UPDATE CASCADE`
    );

    // 7. cacau_baixa — comprador_id
    await addColumnIfNotExists('cacau_baixa', 'comprador_id', 'INT DEFAULT NULL');

    // 8. FK cacau_baixa → comprador
    await addFkIfNotExists('cacau_baixa', 'fk_cacau_baixa_comprador',
      `FOREIGN KEY (comprador_id) REFERENCES comprador (id) ON DELETE RESTRICT ON UPDATE CASCADE`
    );

    // 9. producao_cacau — produtor_id
    await addColumnIfNotExists('producao_cacau', 'produtor_id', 'INT DEFAULT NULL');

    // 10. producao_cacau — projeto_id
    await addColumnIfNotExists('producao_cacau', 'projeto_id', 'INT DEFAULT NULL');

    // 11. FK producao_cacau → produtor
    await addFkIfNotExists('producao_cacau', 'fk_prod_cacau_produtor',
      `FOREIGN KEY (produtor_id) REFERENCES produtor (id) ON DELETE RESTRICT ON UPDATE CASCADE`
    );

    // 12. FK producao_cacau → projeto
    await addFkIfNotExists('producao_cacau', 'fk_prod_cacau_projeto',
      `FOREIGN KEY (projeto_id) REFERENCES projeto (id) ON DELETE RESTRICT ON UPDATE CASCADE`
    );

    console.log('🎉 Todas as migrations concluídas');
  } catch (err) {
    console.error('❌ Erro fatal nas migrations:', err.message);
  }
};

module.exports = runMigrations;
