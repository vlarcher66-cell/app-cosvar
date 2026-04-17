import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import contratoLoteService from '../../services/contratoLoteService';
import parcelaLoteService from '../../services/parcelaLoteService';
import contaService from '../../services/contaService';
import formaPagamentoService from '../../services/formaPagamentoService';
import { useGlobalToast } from '../../components/layout/MainLayout';
import { formatCurrency, formatDate } from '../../utils/formatters';
import s from './ContratoDetalhePage.module.css';

const STATUS_COLOR = { ativo: '#10b981', quitado: '#2563eb', rescindido: '#ef4444' };
const STATUS_LABEL = { ativo: 'Ativo', quitado: 'Quitado', rescindido: 'Rescindido' };
const PARC_COLOR  = { pendente: '#f59e0b', pago: '#10b981', vencido: '#ef4444' };
const PARC_LABEL  = { pendente: 'Pendente', pago: 'Pago', vencido: 'Vencido' };

export default function ContratoDetalhePage() {
  const { id }   = useParams();
  const toast    = useGlobalToast();
  const navigate = useNavigate();

  const [contrato,  setContrato]  = useState(null);
  const [contas,    setContas]    = useState([]);
  const [formas,    setFormas]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null); // parcela a baixar
  const [baixando,  setBaixando]  = useState(false);
  const [confirmRescindir, setConfirmRescindir] = useState(false);

  const [formBaixa, setFormBaixa] = useState({
    data_pagamento: new Date().toISOString().slice(0, 10),
    conta_id: '',
    forma_pagamento_id: '',
    observacao: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setContrato(await contratoLoteService.getOne(id));
    } catch { toast?.error('Contrato não encontrado'); navigate('/imoveis/contratos'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    contaService.getAll().then(setContas);
    formaPagamentoService.getAll().then(setFormas);
  }, []);

  const abrirBaixa = (parcela) => {
    setFormBaixa({ data_pagamento: new Date().toISOString().slice(0, 10), conta_id: '', forma_pagamento_id: '', observacao: '' });
    setModal(parcela);
  };

  const handleBaixar = async (e) => {
    e.preventDefault();
    if (!formBaixa.conta_id) return toast?.error('Selecione a conta');
    setBaixando(true);
    try {
      await parcelaLoteService.baixar(modal.id, formBaixa);
      toast?.success('Parcela baixada!');
      setModal(null);
      load();
    } catch (err) {
      toast?.error(err?.response?.data?.message || 'Erro ao baixar parcela');
    } finally { setBaixando(false); }
  };

  const handleEstornar = async (parcela) => {
    if (!window.confirm(`Estornar parcela ${parcela.numero}?`)) return;
    try {
      await parcelaLoteService.estornar(parcela.id);
      toast?.success('Parcela estornada');
      load();
    } catch { toast?.error('Erro ao estornar'); }
  };

  const handleRescindir = async () => {
    try {
      await contratoLoteService.rescindir(id);
      toast?.success('Contrato rescindido');
      setConfirmRescindir(false);
      load();
    } catch { toast?.error('Erro ao rescindir'); }
  };

  if (loading) return <div className={s.loading}>Carregando...</div>;
  if (!contrato) return null;

  const totalPago    = contrato.parcelas?.filter(p => p.status === 'pago').reduce((a, p) => a + Number(p.valor), 0) || 0;
  const totalPendente = contrato.parcelas?.filter(p => p.status !== 'pago').reduce((a, p) => a + Number(p.valor), 0) || 0;
  const pagas        = contrato.parcelas?.filter(p => p.status === 'pago').length || 0;
  const total        = contrato.parcelas?.length || 0;

  return (
    <div className={s.page}>
      <div className={s.header}>
        <button className={s.btnBack} onClick={() => navigate('/imoveis/contratos')}>← Contratos</button>
        <div className={s.headerInfo}>
          <h1 className={s.title}>
            {contrato.empreendimento_nome} — Qd. {contrato.quadra_nome} Lote {contrato.lote_numero}
          </h1>
          <span className={s.badge} style={{ background: STATUS_COLOR[contrato.status] + '22', color: STATUS_COLOR[contrato.status], border: `1px solid ${STATUS_COLOR[contrato.status]}44` }}>
            {STATUS_LABEL[contrato.status]}
          </span>
        </div>
        {contrato.status === 'ativo' && (
          <button className={s.btnRescindir} onClick={() => setConfirmRescindir(true)}>Rescindir</button>
        )}
      </div>

      {/* KPIs */}
      <div className={s.kpiRow}>
        <div className={s.kpi}>
          <span className={s.kpiLabel}>Comprador</span>
          <strong className={s.kpiVal}>{contrato.comprador_nome}</strong>
        </div>
        <div className={s.kpi}>
          <span className={s.kpiLabel}>Valor Total</span>
          <strong className={s.kpiVal}>{formatCurrency(contrato.valor_total)}</strong>
        </div>
        <div className={s.kpi}>
          <span className={s.kpiLabel}>Total Pago</span>
          <strong className={s.kpiVal} style={{ color: '#10b981' }}>{formatCurrency(totalPago)}</strong>
        </div>
        <div className={s.kpi}>
          <span className={s.kpiLabel}>A Receber</span>
          <strong className={s.kpiVal} style={{ color: '#f59e0b' }}>{formatCurrency(totalPendente)}</strong>
        </div>
        <div className={s.kpi}>
          <span className={s.kpiLabel}>Parcelas</span>
          <strong className={s.kpiVal}>{pagas}/{total}</strong>
        </div>
      </div>

      {contrato.entrada_valor > 0 && (
        <div className={s.entradaBox}>
          <span>Entrada: <strong>{formatCurrency(contrato.entrada_valor)}</strong></span>
          {contrato.entrada_data && <span> — {formatDate(contrato.entrada_data)}</span>}
        </div>
      )}

      {/* Tabela de parcelas */}
      <motion.div className={s.card} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className={s.cardTitle}>Parcelas</div>
        <table className={s.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Vencimento</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Pagamento</th>
              <th>Conta</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {contrato.parcelas?.map(p => (
              <tr key={p.id} className={p.status === 'vencido' ? s.rowVencido : ''}>
                <td className={s.mono}>{p.numero}</td>
                <td className={s.mono}>{formatDate(p.data_vencimento)}</td>
                <td className={s.mono} style={{ fontWeight: 700 }}>{formatCurrency(p.valor)}</td>
                <td>
                  <span className={s.badge} style={{ background: PARC_COLOR[p.status] + '22', color: PARC_COLOR[p.status], border: `1px solid ${PARC_COLOR[p.status]}44` }}>
                    {PARC_LABEL[p.status]}
                  </span>
                </td>
                <td className={s.mono}>{p.data_pagamento ? formatDate(p.data_pagamento) : '—'}</td>
                <td>{p.conta_numero || '—'}</td>
                <td className={s.actions}>
                  {p.status !== 'pago' && (
                    <button className={s.btnBaixar} onClick={() => abrirBaixa(p)}>Baixar</button>
                  )}
                  {p.status === 'pago' && (
                    <button className={s.btnEstornar} onClick={() => handleEstornar(p)}>Estornar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Modal de baixa */}
      {modal && (
        <div className={s.overlay} onClick={() => setModal(null)}>
          <form className={s.modal} onClick={e => e.stopPropagation()} onSubmit={handleBaixar}>
            <div className={s.modalTitle}>Baixar Parcela {modal.numero}</div>
            <div className={s.modalSub}>{formatCurrency(modal.valor)} — venc. {formatDate(modal.data_vencimento)}</div>

            <div className={s.mField}>
              <label>Data de Pagamento</label>
              <input type="date" value={formBaixa.data_pagamento} onChange={e => setFormBaixa(p => ({ ...p, data_pagamento: e.target.value }))} required />
            </div>
            <div className={s.mField}>
              <label>Conta *</label>
              <select value={formBaixa.conta_id} onChange={e => setFormBaixa(p => ({ ...p, conta_id: e.target.value }))} required>
                <option value="">Selecione...</option>
                {contas.map(c => <option key={c.id} value={c.id}>{c.banco_nome} — {c.numero}</option>)}
              </select>
            </div>
            <div className={s.mField}>
              <label>Forma de Pagamento</label>
              <select value={formBaixa.forma_pagamento_id} onChange={e => setFormBaixa(p => ({ ...p, forma_pagamento_id: e.target.value }))}>
                <option value="">Selecione...</option>
                {formas.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
            <div className={s.mField}>
              <label>Observação</label>
              <input type="text" value={formBaixa.observacao} onChange={e => setFormBaixa(p => ({ ...p, observacao: e.target.value }))} placeholder="Opcional" />
            </div>

            <div className={s.mFooter}>
              <button type="button" className={s.btnCancel} onClick={() => setModal(null)}>Cancelar</button>
              <button type="submit" className={s.btnSave} disabled={baixando}>{baixando ? 'Salvando...' : 'Confirmar Baixa'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm rescindir */}
      {confirmRescindir && (
        <div className={s.overlay} onClick={() => setConfirmRescindir(false)}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <div className={s.modalTitle}>Rescindir Contrato?</div>
            <div className={s.modalSub}>Esta ação marcará o contrato como rescindido e liberará o lote.</div>
            <div className={s.mFooter}>
              <button className={s.btnCancel} onClick={() => setConfirmRescindir(false)}>Cancelar</button>
              <button className={s.btnRescindir} onClick={handleRescindir}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
