import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import contratoLoteService from '../../services/contratoLoteService';
import empreendimentoService from '../../services/empreendimentoService';
import DataTable from '../../components/shared/DataTable';
import { useGlobalToast } from '../../components/layout/MainLayout';
import { formatCurrency, formatDate } from '../../utils/formatters';
import s from './ContratosPage.module.css';

const IcoContract = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;

const STATUS_COLOR = { ativo: '#10b981', quitado: '#2563eb', rescindido: '#ef4444' };
const STATUS_LABEL = { ativo: 'Ativo', quitado: 'Quitado', rescindido: 'Rescindido' };

export default function ContratosPage() {
  const toast    = useGlobalToast();
  const navigate = useNavigate();
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [empreendimentos, setEmpreendimentos] = useState([]);
  const [filtros, setFiltros] = useState({ status: '', empreendimento_id: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));
      setRows(await contratoLoteService.getAll(params));
    } catch { toast?.error('Erro ao carregar contratos'); }
    finally { setLoading(false); }
  }, [filtros]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { empreendimentoService.getAll().then(setEmpreendimentos); }, []);

  const setF = (k, v) => setFiltros(p => ({ ...p, [k]: v }));

  const totalRecebido = rows.reduce((a, r) => a + Number(r.total_recebido || 0), 0);
  const totalContrato = rows.reduce((a, r) => a + Number(r.valor_total || 0), 0);

  const columns = [
    { key: 'empreendimento_nome', label: 'Empreendimento', render: v => <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span> },
    { key: 'quadra_nome', label: 'Qd.', width: 60, render: v => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{v}</span> },
    { key: 'lote_numero', label: 'Lote', width: 70, render: v => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{v}</span> },
    { key: 'comprador_nome', label: 'Comprador' },
    { key: 'data_contrato', label: 'Contrato', width: 110, render: v => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDate(v)}</span> },
    { key: 'valor_total', label: 'Valor Total', width: 130, align: 'right', render: v => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{formatCurrency(v)}</span> },
    { key: '_parcelas', label: 'Parcelas', width: 100, align: 'center', render: (_, row) => (
      <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
        {row.parcelas_pagas}/{row.total_parcelas}
        {row.parcelas_vencidas > 0 && <span style={{ color: '#ef4444', marginLeft: 4 }}>⚠️{row.parcelas_vencidas}</span>}
      </span>
    )},
    { key: 'status', label: 'Status', width: 100, render: v => (
      <span style={{ background: STATUS_COLOR[v] + '22', color: STATUS_COLOR[v], border: `1px solid ${STATUS_COLOR[v]}44`, borderRadius: 99, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {STATUS_LABEL[v]}
      </span>
    )},
    { key: '_actions', label: '', width: 60, align: 'center', render: (_, row) => (
      <button className={s.btnVer} onClick={() => navigate(`/imoveis/contratos/${row.id}`)}>Ver</button>
    )},
  ];

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <div className={s.headerIcon}><IcoContract /></div>
          <div>
            <h1 className={s.pageTitle}>Contratos</h1>
            <p className={s.pageSub}>Contratos de venda de lotes</p>
          </div>
        </div>
        <button className={s.btnNovo} onClick={() => navigate('/imoveis/contratos/novo')}>+ Novo Contrato</button>
      </div>

      <div className={s.kpiRow}>
        <div className={s.kpi}>
          <div className={s.kpiBar} style={{ background: '#10b981' }} />
          <div className={s.kpiBody}>
            <div className={s.kpiVal}>{rows.filter(r => r.status === 'ativo').length}</div>
            <div className={s.kpiLabel}>Contratos Ativos</div>
          </div>
        </div>
        <div className={s.kpi}>
          <div className={s.kpiBar} style={{ background: '#ef4444' }} />
          <div className={s.kpiBody}>
            <div className={s.kpiVal}>{rows.reduce((a, r) => a + Number(r.parcelas_vencidas || 0), 0)}</div>
            <div className={s.kpiLabel}>Parcelas Vencidas</div>
          </div>
        </div>
        <div className={s.kpi}>
          <div className={s.kpiBar} style={{ background: '#6366f1' }} />
          <div className={s.kpiBody}>
            <div className={s.kpiVal}>{formatCurrency(totalRecebido)}</div>
            <div className={s.kpiLabel}>Total Recebido</div>
          </div>
        </div>
        <div className={s.kpi}>
          <div className={s.kpiBar} style={{ background: '#f59e0b' }} />
          <div className={s.kpiBody}>
            <div className={s.kpiVal}>{formatCurrency(totalContrato - totalRecebido)}</div>
            <div className={s.kpiLabel}>A Receber</div>
          </div>
        </div>
      </div>

      <div className={s.filterBar}>
        <select className={s.filterSelect} value={filtros.status} onChange={e => setF('status', e.target.value)}>
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="quitado">Quitado</option>
          <option value="rescindido">Rescindido</option>
        </select>
        <select className={s.filterSelect} value={filtros.empreendimento_id} onChange={e => setF('empreendimento_id', e.target.value)}>
          <option value="">Todos os empreendimentos</option>
          {empreendimentos.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <DataTable columns={columns} data={rows} loading={loading} emptyMessage="Nenhum contrato encontrado" />
      </motion.div>
    </div>
  );
}
