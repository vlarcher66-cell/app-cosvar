import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import conciliacaoService from '../../services/conciliacaoService';
import contaService from '../../services/contaService';
import { useGlobalToast } from '../../components/layout/MainLayout';
import { formatCurrency, formatDate } from '../../utils/formatters';
import s from './ConciliacaoPage.module.css';

/* ── Ícones ── */
const IcoBank    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>;
const IcoCheck   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoMinus   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoTotal   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IcoIn      = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const IcoOut     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>;
const IcoPending = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

const cardVariants = {
  hidden:  { opacity: 0, y: 18 },
  visible: i => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.28, ease: [0.22, 1, 0.36, 1] } }),
};

export default function ConciliacaoPage() {
  const toast = useGlobalToast();
  const now   = new Date();

  const [contas,     setContas]     = useState([]);
  const [contaId,    setContaId]    = useState('');
  const [mes,        setMes]        = useState(now.getMonth() + 1);
  const [ano,        setAno]        = useState(now.getFullYear());
  const [loading,    setLoading]    = useState(false);
  const [resultado,  setResultado]  = useState(null); // { saldo_inicial, movimentos }
  const [toggling,   setToggling]   = useState({}); // { [tipo-id]: true }

  useEffect(() => {
    contaService.getAll().then(setContas).catch(() => toast?.error('Erro ao carregar contas'));
  }, []);

  const load = useCallback(async () => {
    if (!contaId) return;
    setLoading(true);
    try {
      const data = await conciliacaoService.getMovimentos(contaId, mes, ano);
      setResultado(data);
    } catch { toast?.error('Erro ao carregar movimentos'); }
    finally { setLoading(false); }
  }, [contaId, mes, ano]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (tipo, id, atual) => {
    const key = `${tipo}-${id}`;
    if (toggling[key]) return;
    setToggling(p => ({ ...p, [key]: true }));
    // Otimista
    setResultado(prev => ({
      ...prev,
      movimentos: prev.movimentos.map(m =>
        m.tipo === tipo && m.id === id ? { ...m, conciliado: atual ? 0 : 1 } : m
      ),
    }));
    try {
      await conciliacaoService.setConciliado(tipo, id, !atual);
    } catch {
      toast?.error('Erro ao atualizar conciliação');
      // Reverte
      setResultado(prev => ({
        ...prev,
        movimentos: prev.movimentos.map(m =>
          m.tipo === tipo && m.id === id ? { ...m, conciliado: atual } : m
        ),
      }));
    } finally {
      setToggling(p => { const n = { ...p }; delete n[key]; return n; });
    }
  };

  // KPIs calculados
  const movimentos      = resultado?.movimentos || [];
  const saldoInicial    = Number(resultado?.saldo_inicial || 0);

  const totalEntradas   = movimentos.filter(m => m.tipo === 'receita').reduce((a, m) => a + Number(m.valor), 0);
  const totalSaidas     = movimentos.filter(m => m.tipo === 'despesa').reduce((a, m) => a + Number(m.valor), 0);
  const saldoFinal      = saldoInicial + totalEntradas - totalSaidas;

  const conciliados     = movimentos.filter(m => m.conciliado);
  const pendentes       = movimentos.filter(m => !m.conciliado);
  const saldoConciliado = saldoInicial
    + conciliados.filter(m => m.tipo === 'receita').reduce((a, m) => a + Number(m.valor), 0)
    - conciliados.filter(m => m.tipo === 'despesa').reduce((a, m) => a + Number(m.valor), 0);

  const contaSelecionada = contas.find(c => String(c.id) === String(contaId));
  const labelConta = contaSelecionada
    ? (contaSelecionada.tipo === 'caixa' ? 'Caixa' : `${contaSelecionada.banco_nome || ''} — ${contaSelecionada.numero}`)
    : '';

  const anos = [];
  for (let y = now.getFullYear() + 1; y >= 2020; y--) anos.push(y);

  return (
    <div className={s.page}>

      {/* ── Header ── */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <div className={s.headerIcon}><IcoBank /></div>
          <div>
            <h1 className={s.pageTitle}>Conciliação Bancária</h1>
            <p className={s.pageSub}>Confira os lançamentos do sistema com o extrato bancário</p>
          </div>
        </div>
      </div>

      {/* ── Filtros ── */}
      <motion.div
        className={s.filterBar}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.22 }}
      >
        <select
          className={s.filterSelect}
          value={contaId}
          onChange={e => setContaId(e.target.value)}
        >
          <option value="">Selecione a conta...</option>
          {contas.map(c => (
            <option key={c.id} value={c.id}>
              {c.tipo === 'caixa' ? 'Caixa' : `${c.banco_nome || ''} — ${c.numero}`}
            </option>
          ))}
        </select>

        <select className={s.filterSelect} value={mes} onChange={e => setMes(Number(e.target.value))}>
          {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>

        <select className={s.filterSelect} value={ano} onChange={e => setAno(Number(e.target.value))}>
          {anos.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </motion.div>

      {/* ── KPIs ── */}
      <AnimatePresence mode="wait">
        {resultado && (
          <div className={s.kpis}>
            {[
              { label: 'Saldo Inicial',     value: formatCurrency(saldoInicial),    icon: <IcoBank />,    variant: 'neutro'   },
              { label: 'Entradas',          value: formatCurrency(totalEntradas),   icon: <IcoIn />,      variant: 'entrada'  },
              { label: 'Saídas',            value: formatCurrency(totalSaidas),     icon: <IcoOut />,     variant: 'saida'    },
              { label: 'Saldo do Período',  value: formatCurrency(saldoFinal),      icon: <IcoTotal />,   variant: saldoFinal >= 0 ? 'entrada' : 'saida' },
              { label: 'Saldo Conciliado',  value: formatCurrency(saldoConciliado), icon: <IcoCheck />,   variant: 'conciliado' },
              { label: 'Pendentes',         value: pendentes.length,               icon: <IcoPending />, variant: 'pendente' },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                className={`${s.kpi} ${s[`kpi_${card.variant}`]}`}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <div className={s.kpiBar} />
                <div className={s.kpiIcon}>{card.icon}</div>
                <div className={s.kpiBody}>
                  <div className={s.kpiValue}>{card.value}</div>
                  <div className={s.kpiLabel}>{card.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* ── Tabela de movimentos ── */}
      {!contaId ? (
        <div className={s.empty}>Selecione uma conta para iniciar a conciliação</div>
      ) : loading ? (
        <div className={s.empty}>Carregando movimentos...</div>
      ) : movimentos.length === 0 ? (
        <div className={s.empty}>Nenhum lançamento encontrado para {MESES[mes-1]} / {ano}</div>
      ) : (
        <motion.div
          className={s.tableWrap}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.25 }}
        >
          {/* Legenda de saldo */}
          <div className={s.saldoBar}>
            <span className={s.saldoItem}>
              <span className={s.saldoLabel}>Conta:</span>
              <span className={s.saldoVal}>{labelConta}</span>
            </span>
            <span className={s.saldoDivider} />
            <span className={s.saldoItem}>
              <span className={s.saldoLabel}>Saldo inicial:</span>
              <span className={s.saldoVal}>{formatCurrency(saldoInicial)}</span>
            </span>
            <span className={s.saldoDivider} />
            <span className={s.saldoItem}>
              <span className={s.saldoLabel}>Saldo final:</span>
              <span className={`${s.saldoVal} ${saldoFinal >= 0 ? s.saldoPos : s.saldoNeg}`}>{formatCurrency(saldoFinal)}</span>
            </span>
            <span className={s.saldoDivider} />
            <span className={s.saldoItem}>
              <span className={s.saldoLabel}>Conciliados:</span>
              <span className={s.saldoVal}>{conciliados.length} / {movimentos.length}</span>
            </span>
          </div>

          <table className={s.table}>
            <thead>
              <tr>
                <th className={s.thCheck}></th>
                <th className={s.th}>Data</th>
                <th className={s.th}>Descrição</th>
                <th className={s.th}>Forma</th>
                <th className={`${s.th} ${s.thRight}`}>Entradas</th>
                <th className={`${s.th} ${s.thRight}`}>Saídas</th>
                <th className={`${s.th} ${s.thRight}`}>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                let saldoAcc = saldoInicial;
                return movimentos.map((m, i) => {
                  if (m.tipo === 'receita') saldoAcc += Number(m.valor);
                  else saldoAcc -= Number(m.valor);
                  const key = `${m.tipo}-${m.id}`;
                  const isToggling = !!toggling[key];
                  return (
                    <tr
                      key={key}
                      className={`${s.tr} ${m.conciliado ? s.trConciliado : ''} ${m.tipo === 'receita' ? s.trReceita : s.trDespesa}`}
                    >
                      <td className={s.tdCheck}>
                        <button
                          className={`${s.checkBtn} ${m.conciliado ? s.checkBtnOn : ''}`}
                          onClick={() => handleToggle(m.tipo, m.id, m.conciliado)}
                          disabled={isToggling}
                          title={m.conciliado ? 'Desmarcar conciliação' : 'Marcar como conciliado'}
                        >
                          {m.conciliado ? <IcoCheck /> : <IcoMinus />}
                        </button>
                      </td>
                      <td className={s.td}><span className={s.cellDate}>{formatDate(m.data)}</span></td>
                      <td className={s.td}>
                        <span className={s.cellDesc}>{m.descricao || '—'}</span>
                        <span className={`${s.cellTipoBadge} ${m.tipo === 'receita' ? s.badgeReceita : s.badgeDespesa}`}>
                          {m.tipo === 'receita' ? 'Receita' : 'Despesa'}
                        </span>
                      </td>
                      <td className={s.td}>
                        <span className={s.cellForma}>{m.forma_pagamento_nome || '—'}</span>
                      </td>
                      <td className={`${s.td} ${s.tdRight}`}>
                        {m.tipo === 'receita'
                          ? <span className={s.cellEntrada}>{formatCurrency(m.valor)}</span>
                          : <span className={s.cellVazio}>—</span>}
                      </td>
                      <td className={`${s.td} ${s.tdRight}`}>
                        {m.tipo === 'despesa'
                          ? <span className={s.cellSaida}>{formatCurrency(m.valor)}</span>
                          : <span className={s.cellVazio}>—</span>}
                      </td>
                      <td className={`${s.td} ${s.tdRight}`}>
                        <span className={saldoAcc >= 0 ? s.cellSaldoPos : s.cellSaldoNeg}>
                          {formatCurrency(saldoAcc)}
                        </span>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
