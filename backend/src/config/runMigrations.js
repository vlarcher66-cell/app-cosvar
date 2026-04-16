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

// Helper: modifica coluna para nullable (MODIFY COLUMN é idempotente no MySQL)
async function makeColumnNullable(table, column, columnDef) {
  await db.query(`ALTER TABLE ${table} MODIFY COLUMN ${column} ${columnDef} DEFAULT NULL`);
  console.log(`✅ Coluna tornada nullable: ${table}.${column}`);
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

    // 13. credora nullable em cacau_ordem (campo legado, substituído por comprador_id)
    await makeColumnNullable('cacau_ordem', 'credora', 'VARCHAR(120)');

    // 14. credora nullable em cacau_baixa (campo legado, substituído por comprador_id)
    await makeColumnNullable('cacau_baixa', 'credora', 'VARCHAR(120)');

    // 15. Remove categorias_receita duplicadas sem vínculo com receitas
    // Primeiro remove descrições filhas das categorias sem uso, depois a categoria
    await db.query(`
      DELETE dr FROM descricao_receita dr
      INNER JOIN categoria_receita cr ON cr.id = dr.categoria_id
      WHERE cr.nome = 'Cacau' AND cr.tipo = 'Venda'
        AND cr.id NOT IN (
          SELECT DISTINCT categoria_id FROM receita WHERE categoria_id IS NOT NULL
        )
    `).catch(e => console.log('⏭️  Limpeza descrições órfãs:', e.message));

    await db.query(`
      DELETE cr FROM categoria_receita cr
      WHERE cr.nome = 'Cacau' AND cr.tipo = 'Venda'
        AND cr.id NOT IN (
          SELECT DISTINCT categoria_id FROM receita WHERE categoria_id IS NOT NULL
        )
    `).catch(e => console.log('⏭️  Limpeza duplicatas categoria:', e.message));

    // 16. Remove receitas de venda de cacau órfãs:
    //   (a) cacau_baixa_id NULL com descrição automática de venda
    //   (b) cacau_baixa_id preenchido mas a baixa não existe mais (CASCADE não pegou)
    await db.query(`
      DELETE FROM receita
      WHERE descricao LIKE 'Venda de cacau%'
        AND (
          cacau_baixa_id IS NULL
          OR cacau_baixa_id NOT IN (SELECT id FROM cacau_baixa)
        )
    `).catch(e => console.log('⏭️  Limpeza receitas órfãs de cacau:', e.message));
    console.log('✅ Migration 16: receitas órfãs de cacau removidas');

    console.log('🎉 Todas as migrations concluídas');
  } catch (err) {
    console.error('❌ Erro fatal nas migrations:', err.message);
  }
};

module.exports = runMigrations;
