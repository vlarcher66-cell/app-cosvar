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
    //   (a) sem cacau_baixa_id vinculado a uma baixa existente
    //   (b) categoria é Cacau/Venda (geradas automaticamente)
    const [catCacau] = await db.query(
      `SELECT id FROM categoria_receita WHERE nome = 'Cacau' AND tipo = 'Venda' LIMIT 1`
    );
    if (catCacau.length > 0) {
      const catId = catCacau[0].id;
      // Debug: mostra o que existe
      const [debug] = await db.query(
        `SELECT r.id, r.cacau_baixa_id, r.descricao,
           (SELECT COUNT(*) FROM cacau_baixa WHERE id = r.cacau_baixa_id) AS baixa_existe
         FROM receita r WHERE r.categoria_id = ?`, [catId]
      );
      console.log('[Migration 16 debug]', JSON.stringify(debug));
      const [del] = await db.query(`
        DELETE FROM receita
        WHERE categoria_id = ?
          AND (
            cacau_baixa_id IS NULL
            OR cacau_baixa_id NOT IN (SELECT id FROM cacau_baixa)
          )
      `, [catId]);
      console.log(`✅ Migration 16: ${del.affectedRows} receitas órfãs de cacau removidas`);
    }

    // 17. Cria tabela despesa_pagamento (parcelas de pagamento por despesa)
    await db.query(`
      CREATE TABLE IF NOT EXISTS despesa_pagamento (
        id               INT          NOT NULL AUTO_INCREMENT,
        despesa_id       INT          NOT NULL,
        conta_id         INT          DEFAULT NULL,
        forma_pagamento_id INT        DEFAULT NULL,
        valor            DECIMAL(12,2) NOT NULL,
        data_pagamento   DATE         NOT NULL,
        acrescimo        DECIMAL(12,2) NOT NULL DEFAULT 0,
        desconto         DECIMAL(12,2) NOT NULL DEFAULT 0,
        observacao       TEXT         DEFAULT NULL,
        created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_dp_despesa (despesa_id),
        KEY idx_dp_conta (conta_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `).catch(e => { if (e.code !== 'ER_TABLE_EXISTS_ERROR') throw e; });
    console.log('✅ Migration 17: tabela despesa_pagamento criada');

    await addFkIfNotExists('despesa_pagamento', 'fk_dp_despesa',
      `FOREIGN KEY (despesa_id) REFERENCES despesa (id) ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await addFkIfNotExists('despesa_pagamento', 'fk_dp_conta',
      `FOREIGN KEY (conta_id) REFERENCES conta (id) ON DELETE SET NULL ON UPDATE CASCADE`
    );
    await addFkIfNotExists('despesa_pagamento', 'fk_dp_forma',
      `FOREIGN KEY (forma_pagamento_id) REFERENCES forma_pagamento (id) ON DELETE SET NULL ON UPDATE CASCADE`
    );

    // 18. Cria tabela receita_pagamento (formas de recebimento por receita)
    await db.query(`
      CREATE TABLE IF NOT EXISTS receita_pagamento (
        id                 INT          NOT NULL AUTO_INCREMENT,
        receita_id         INT          NOT NULL,
        conta_id           INT          DEFAULT NULL,
        forma_pagamento_id INT          DEFAULT NULL,
        valor              DECIMAL(12,2) NOT NULL,
        created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_rp_receita (receita_id),
        KEY idx_rp_conta (conta_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `).catch(e => { if (e.code !== 'ER_TABLE_EXISTS_ERROR') throw e; });
    console.log('✅ Migration 18: tabela receita_pagamento criada');

    await addFkIfNotExists('receita_pagamento', 'fk_rp_receita',
      `FOREIGN KEY (receita_id) REFERENCES receita (id) ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await addFkIfNotExists('receita_pagamento', 'fk_rp_conta',
      `FOREIGN KEY (conta_id) REFERENCES conta (id) ON DELETE SET NULL ON UPDATE CASCADE`
    );
    await addFkIfNotExists('receita_pagamento', 'fk_rp_forma',
      `FOREIGN KEY (forma_pagamento_id) REFERENCES forma_pagamento (id) ON DELETE SET NULL ON UPDATE CASCADE`
    );

    // 19. Campo conciliado em receita e despesa_pagamento
    await addColumnIfNotExists('receita',           'conciliado', "TINYINT(1) NOT NULL DEFAULT 0");
    await addColumnIfNotExists('despesa_pagamento', 'conciliado', "TINYINT(1) NOT NULL DEFAULT 0");

    // 20. Limpa receitas de cacau órfãs (cacau_baixa_id não existe mais na tabela)
    const [lixo] = await db.query(`
      DELETE FROM receita
      WHERE cacau_baixa_id IS NOT NULL
        AND cacau_baixa_id NOT IN (SELECT id FROM cacau_baixa)
    `);
    console.log(`✅ Migration 20: ${lixo.affectedRows} receitas órfãs removidas`);

    // 21. Garante CASCADE na FK receita → cacau_baixa (dropa e recria)
    await db.query(`ALTER TABLE receita DROP FOREIGN KEY fk_receita_baixa`).catch(() => {});
    await db.query(`
      ALTER TABLE receita ADD CONSTRAINT fk_receita_baixa
        FOREIGN KEY (cacau_baixa_id) REFERENCES cacau_baixa (id)
        ON DELETE CASCADE ON UPDATE CASCADE
    `).catch(e => console.log('fk_receita_baixa:', e.message));
    console.log('✅ Migration 21: FK receita→cacau_baixa com CASCADE garantido');

    console.log('🎉 Todas as migrations concluídas');
  } catch (err) {
    console.error('❌ Erro fatal nas migrations:', err.message);
  }
};

module.exports = runMigrations;
