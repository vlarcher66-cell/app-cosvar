-- ============================================================
-- MIGRAÇÃO: Plano de Contas de Despesa
-- 3 Grupos | 14 Subgrupos | 100+ Itens
-- usuario_id = dinâmico — usa o primeiro admin encontrado
-- ============================================================

SET @uid = (SELECT id FROM usuario WHERE perfil = 'admin' ORDER BY id ASC LIMIT 1);

-- ============================================================
-- GRUPO 1 — CACAU
-- ============================================================
INSERT INTO grupo_despesa (nome, usuario_id) VALUES ('Cacau', @uid);
SET @g1 = LAST_INSERT_ID();

-- Subgrupo 1.1 — Produção Rural
INSERT INTO subgrupo_despesa (nome, grupo_id, usuario_id) VALUES ('Produção Rural', @g1, @uid);
SET @sg1 = LAST_INSERT_ID();
INSERT INTO item_despesa (nome, subgrupo_id, usuario_id) VALUES
  ('Mão de Obra Temporária',         @sg1, @uid),
  ('Mão de Obra Permanente',         @sg1, @uid),
  ('Encargos Trabalhistas Rurais',   @sg1, @uid),
  ('Mudas e Sementes',               @sg1, @uid),
  ('Fertilizantes e Corretivos',     @sg1, @uid),
  ('Defensivos Agrícolas',           @sg1, @uid),
  ('Irrigação e Bombeamento',        @sg1, @uid),
  ('Ferramentas e Equipamentos',     @sg1, @uid),
  ('Manutenção de Máquinas Agrícolas', @sg1, @uid),
  ('Combustível e Lubrificantes',    @sg1, @uid),
  ('Energia Elétrica Rural',         @sg1, @uid);

-- Subgrupo 1.2 — Pós-Colheita
INSERT INTO subgrupo_despesa (nome, grupo_id, usuario_id) VALUES ('Pós-Colheita', @g1, @uid);
SET @sg2 = LAST_INSERT_ID();
INSERT INTO item_despesa (nome, subgrupo_id, usuario_id) VALUES
  ('Colheita e Quebra do Cacau',         @sg2, @uid),
  ('Fermentação',                         @sg2, @uid),
  ('Secagem',                             @sg2, @uid),
  ('Classificação e Seleção',             @sg2, @uid),
  ('Embalagem e Ensacamento',             @sg2, @uid),
  ('Armazenagem',                         @sg2, @uid),
  ('Transporte Interno (Fazenda)',         @sg2, @uid),
  ('Frete para Entrega ao Comprador',     @sg2, @uid);

-- Subgrupo 1.3 — Compra de Cacau
INSERT INTO subgrupo_despesa (nome, grupo_id, usuario_id) VALUES ('Compra de Cacau', @g1, @uid);
SET @sg3 = LAST_INSERT_ID();
INSERT INTO item_despesa (nome, subgrupo_id, usuario_id) VALUES
  ('Compra Cacau Meieiro',                @sg3, @uid),
  ('Compra Cacau Produtor Externo',       @sg3, @uid),
  ('Compra Cacau a Ordem',               @sg3, @uid),
  ('Comissão de Intermediação',           @sg3, @uid),
  ('Taxas de Pesagem e Classificação',   @sg3, @uid),
  ('Frete de Aquisição',                 @sg3, @uid);

-- Subgrupo 1.4 — Fazenda / Infraestrutura
INSERT INTO subgrupo_despesa (nome, grupo_id, usuario_id) VALUES ('Fazenda / Infraestrutura', @g1, @uid);
SET @sg4 = LAST_INSERT_ID();
INSERT INTO item_despesa (nome, subgrupo_id, usuario_id) VALUES
  ('Manutenção de Cercas e Pastagens',   @sg4, @uid),
  ('Manutenção de Estradas Internas',    @sg4, @uid),
  ('Manutenção de Galpões e Secadores',  @sg4, @uid),
  ('Água e Energia da Fazenda',          @sg4, @uid),
  ('NIRF / ITR (Imposto Rural)',         @sg4, @uid),
  ('Seguros Rurais',                     @sg4, @uid),
  ('Licenças Ambientais',                @sg4, @uid);

-- ============================================================
-- GRUPO 2 — IMOBILIÁRIA
-- ============================================================
INSERT INTO grupo_despesa (nome, usuario_id) VALUES ('Imobiliária', @uid);
SET @g2 = LAST_INSERT_ID();

-- Subgrupo 2.1 — Aquisição de Imóveis
INSERT INTO subgrupo_despesa (nome, grupo_id, usuario_id) VALUES ('Aquisição de Imóveis', @g2, @uid);
SET @sg5 = LAST_INSERT_ID();
INSERT INTO item_despesa (nome, subgrupo_id, usuario_id) VALUES
  ('Compra de Terreno',                  @sg5, @uid),
  ('Compra de Imóvel Residencial',       @sg5, @uid),
  ('Compra de Imóvel Comercial',         @sg5, @uid),
  ('Compra de Imóvel Rural',             @sg5, @uid),
  ('ITBI (Imposto de Transmissão)',      @sg5, @uid),
  ('Escritura e Registro em Cartório',   @sg5, @uid),
  ('Due Diligence e Avaliação',          @sg5, @uid),
  ('Assessoria Jurídica na Compra',      @sg5, @uid);

-- Subgrupo 2.2 — Desenvolvimento e Obras
INSERT INTO subgrupo_despesa (nome, grupo_id, usuario_id) VALUES ('Desenvolvimento e Obras', @g2, @uid);
SET @sg6 = LAST_INSERT_ID();
INSERT INTO item_despesa (nome, subgrupo_id, usuario_id) VALUES
  ('Projetos Arquitetônicos',            @sg6, @uid),
  ('Projetos de Engenharia',             @sg6, @uid),
  ('Alvarás e Licenças de Construção',   @sg6, @uid),
  ('Material de Construção',             @sg6, @uid),
  ('Mão de Obra de Obra',               @sg6, @uid),
  ('Empreiteiras e Subcontratados',      @sg6, @uid),
  ('Acabamentos e Revestimentos',        @sg6, @uid),
  ('Instalações Elétricas e Hidráulicas',@sg6, @uid),
  ('Paisagismo',                         @sg6, @uid),
  ('Regularização e Habite-se',          @sg6, @uid);

-- Subgrupo 2.3 — Comercialização
INSERT INTO subgrupo_despesa (nome, grupo_id, usuario_id) VALUES ('Comercialização', @g2, @uid);
SET @sg7 = LAST_INSERT_ID();
INSERT INTO item_despesa (nome, subgrupo_id, usuario_id) VALUES
  ('Comissão de Corretores',             @sg7, @uid),
  ('Marketing Digital',                  @sg7, @uid),
  ('Mídia Impressa e Outdoor',           @sg7, @uid),
  ('Fotografia e Vídeo de Imóveis',      @sg7, @uid),
  ('Portais Imobiliários',               @sg7, @uid),
  ('Eventos e Plantão de Vendas',        @sg7, @uid),
  ('Brindes e Materiais Promocionais',   @sg7, @uid);

-- Subgrupo 2.4 — Gestão de Locação
INSERT INTO subgrupo_despesa (nome, grupo_id, usuario_id) VALUES ('Gestão de Locação', @g2, @uid);
SET @sg8 = LAST_INSERT_ID();
INSERT INTO item_despesa (nome, subgrupo_id, usuario_id) VALUES
  ('Taxa de Administração de Locação',   @sg8, @uid),
  ('Vistoria de Entrada e Saída',        @sg8, @uid),
  ('Reparos por Conta do Proprietário',  @sg8, @uid),
  ('Seguro Fiança / Garantia',           @sg8, @uid),
  ('IPTU Imóveis Locados',               @sg8, @uid),
  ('Condomínio Imóveis Locados',         @sg8, @uid),
  ('Inadimplência de Locatários',        @sg8, @uid),
  ('Despesas Jurídicas de Despejo',      @sg8, @uid);

-- Subgrupo 2.5 — Manutenção de Imóveis
INSERT INTO subgrupo_despesa (nome, grupo_id, usuario_id) VALUES ('Manutenção de Imóveis', @g2, @uid);
SET @sg9 = LAST_INSERT_ID();
INSERT INTO item_despesa (nome, subgrupo_id, usuario_id) VALUES
  ('Manutenção Preventiva',              @sg9, @uid),
  ('Manutenção Corretiva',               @sg9, @uid),
  ('Reformas e Benfeitorias',            @sg9, @uid),
  ('Pintura e Conservação',              @sg9, @uid),
  ('Seguro de Imóveis',                  @sg9, @uid),
  ('Dedetização e Limpeza',              @sg9, @uid);

-- ============================================================
-- GRUPO 3 — ADMINISTRATIVO & FINANCEIRO
-- ============================================================
INSERT INTO grupo_despesa (nome, usuario_id) VALUES ('Administrativo & Financeiro', @uid);
SET @g3 = LAST_INSERT_ID();

-- Subgrupo 3.1 — Pessoal
INSERT INTO subgrupo_despesa (nome, grupo_id, usuario_id) VALUES ('Pessoal', @g3, @uid);
SET @sg10 = LAST_INSERT_ID();
INSERT INTO item_despesa (nome, subgrupo_id, usuario_id) VALUES
  ('Salários CLT',                       @sg10, @uid),
  ('Pró-labore dos Sócios',              @sg10, @uid),
  ('Encargos Sociais (INSS/FGTS)',       @sg10, @uid),
  ('13º Salário',                        @sg10, @uid),
  ('Férias e 1/3 Constitucional',        @sg10, @uid),
  ('Vale Transporte',                    @sg10, @uid),
  ('Vale Alimentação / Refeição',        @sg10, @uid),
  ('Plano de Saúde',                     @sg10, @uid),
  ('Rescisões e Indenizações',           @sg10, @uid),
  ('Treinamento e Capacitação',          @sg10, @uid);

-- Subgrupo 3.2 — Estrutura Operacional
INSERT INTO subgrupo_despesa (nome, grupo_id, usuario_id) VALUES ('Estrutura Operacional', @g3, @uid);
SET @sg11 = LAST_INSERT_ID();
INSERT INTO item_despesa (nome, subgrupo_id, usuario_id) VALUES
  ('Aluguel do Escritório',              @sg11, @uid),
  ('Condomínio do Escritório',           @sg11, @uid),
  ('Energia Elétrica Escritório',        @sg11, @uid),
  ('Água e Esgoto Escritório',           @sg11, @uid),
  ('Internet e Telefonia',               @sg11, @uid),
  ('Material de Escritório',             @sg11, @uid),
  ('Equipamentos e Informática',         @sg11, @uid),
  ('Manutenção de Veículos',             @sg11, @uid),
  ('Combustível Veículos Administrativos',@sg11, @uid),
  ('Viagens e Hospedagem',               @sg11, @uid),
  ('Alimentação e Representação',        @sg11, @uid);

-- Subgrupo 3.3 — Serviços Profissionais
INSERT INTO subgrupo_despesa (nome, grupo_id, usuario_id) VALUES ('Serviços Profissionais', @g3, @uid);
SET @sg12 = LAST_INSERT_ID();
INSERT INTO item_despesa (nome, subgrupo_id, usuario_id) VALUES
  ('Contabilidade e Auditoria',          @sg12, @uid),
  ('Assessoria Jurídica',                @sg12, @uid),
  ('Consultoria Financeira',             @sg12, @uid),
  ('TI e Suporte de Sistemas',           @sg12, @uid),
  ('Serviços de Segurança',              @sg12, @uid),
  ('Serviços de Limpeza',                @sg12, @uid);

-- Subgrupo 3.4 — Impostos e Taxas
INSERT INTO subgrupo_despesa (nome, grupo_id, usuario_id) VALUES ('Impostos e Taxas', @g3, @uid);
SET @sg13 = LAST_INSERT_ID();
INSERT INTO item_despesa (nome, subgrupo_id, usuario_id) VALUES
  ('IRPJ',                               @sg13, @uid),
  ('CSLL',                               @sg13, @uid),
  ('PIS / COFINS',                       @sg13, @uid),
  ('ISS',                                @sg13, @uid),
  ('ICMS Rural',                         @sg13, @uid),
  ('Taxas Municipais e Estaduais',       @sg13, @uid),
  ('Multas Fiscais',                     @sg13, @uid),
  ('Parcelamentos Tributários',          @sg13, @uid);

-- Subgrupo 3.5 — Financeiro
INSERT INTO subgrupo_despesa (nome, grupo_id, usuario_id) VALUES ('Financeiro', @g3, @uid);
SET @sg14 = LAST_INSERT_ID();
INSERT INTO item_despesa (nome, subgrupo_id, usuario_id) VALUES
  ('Tarifas Bancárias',                  @sg14, @uid),
  ('IOF',                                @sg14, @uid),
  ('Juros de Empréstimos',               @sg14, @uid),
  ('Amortização de Financiamentos',      @sg14, @uid),
  ('Multas e Encargos por Atraso',       @sg14, @uid),
  ('Seguros Corporativos',               @sg14, @uid),
  ('Despesas com Cartão Corporativo',    @sg14, @uid);
