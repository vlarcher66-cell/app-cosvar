import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import contratoLoteService from '../../services/contratoLoteService';
import parcelaLoteService from '../../services/parcelaLoteService';
import documentoContratoService from '../../services/documentoContratoService';
import contaService from '../../services/contaService';
import formaPagamentoService from '../../services/formaPagamentoService';
import DateInput from '../../components/ui/DateInput';
import CurrencyInput from '../../components/ui/CurrencyInput';
import { useGlobalToast } from '../../components/layout/MainLayout';
import { formatCurrency, formatDate } from '../../utils/formatters';
import s from './ContratoDetalhePage.module.css';

const newParcela = () => ({ _id: Math.random(), conta_id: '', forma_id: '', valor: '' });

const STATUS_COLOR = { ativo: '#10b981', quitado: '#2563eb', rescindido: '#ef4444' };
const STATUS_LABEL = { ativo: 'Ativo', quitado: 'Quitado', rescindido: 'Rescindido' };
const PARC_COLOR  = { pendente: '#f59e0b', pago: '#10b981', vencido: '#ef4444' };
const PARC_LABEL  = { pendente: 'Pendente', pago: 'Pago', vencido: 'Vencido' };

const TIPO_DOC = ['Contrato', 'RG', 'CPF', 'Comprovante de Renda', 'Comprovante de Residência', 'Escritura', 'Outro'];

const IcoFile  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IcoTrash = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IcoDl   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;

export default function ContratoDetalhePage() {
  const { id }   = useParams();
  const toast    = useGlobalToast();
  const navigate = useNavigate();
  const fileRef  = useRef();

  const [aba,       setAba]       = useState('geral');
  const [contrato,  setContrato]  = useState(null);
  const [contas,    setContas]    = useState([]);
  const [formas,    setFormas]    = useState([]);
  const [docs,      setDocs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null);
  const [baixando,  setBaixando]  = useState(false);
  const [confirmRescindir, setConfirmRescindir] = useState(false);

  // Upload state
  const [uploading,   setUploading]   = useState(false);
  const [uploadForm,  setUploadForm]  = useState({ nome: '', tipo: '' });
  const [arquivo,     setArquivo]     = useState(null);
  const [cloudUsage,  setCloudUsage]  = useState(null);
  const [preview,     setPreview]     = useState(null); // doc sendo visualizado

  const [formBaixa, setFormBaixa] = useState({
    data_pagamento: new Date().toISOString().slice(0, 10),
    conta_id: '', forma_pagamento_id: '', observacao: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, d] = await Promise.all([
        contratoLoteService.getOne(id),
        documentoContratoService.getAll(id),
      ]);
      setContrato(c);
      setDocs(d);
    } catch { toast?.error('Contrato não encontrado'); navigate('/imoveis/contratos'); }
    finally { setLoading(false); }
  }, [id]);

  // Carrega uso do Cloudinary ao abrir aba documentos
  useEffect(() => {
    if (aba === 'documentos' && !cloudUsage) {
      documentoContratoService.usage(id).then(setCloudUsage).catch(() => {});
    }
  }, [aba]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    contaService.getAll().then(setContas);
    formaPagamentoService.getAll().then(setFormas);
  }, []);

  const [pagamentos, setPagamentos] = useState([newParcela()]);

  const abrirBaixa = (parcela) => {
    setFormBaixa({ data_pagamento: new Date().toISOString().slice(0, 10), observacao: '' });
    setPagamentos([{ ...newParcela(), valor: String(parcela.valor) }]);
    setModal(parcela);
  };

  const setPag = (_id, k, v) => setPagamentos(prev => prev.map(p => p._id === _id ? { ...p, [k]: v, ...(k === 'conta_id' ? { forma_id: '' } : {}) } : p));
  const addPag = () => {
    const jaUsado = pagamentos.reduce((acc, p) => acc + (parseFloat(String(p.valor).replace(/\./g,'').replace(',','.')) || 0), 0);
    const diferenca = Math.max(0, Number(modal?.valor || 0) - jaUsado);
    const valorRestante = diferenca > 0 ? diferenca.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '';
    setPagamentos(prev => [...prev, { ...newParcela(), valor: valorRestante }]);
  };
  const remPag = (_id) => setPagamentos(prev => prev.filter(p => p._id !== _id));

  const formasDaConta = (conta_id) => {
    const conta = contas.find(c => String(c.id) === String(conta_id));
    if (!conta || !conta.formas_ids?.length) return formas;
    return formas.filter(f => conta.formas_ids.includes(f.id));
  };

  const totalPagamentos = pagamentos.reduce((acc, p) => acc + (parseFloat(String(p.valor).replace(/\./g,'').replace(',','.')) || 0), 0);

  const handleBaixar = async (e) => {
    e.preventDefault();
    if (pagamentos.some(p => !p.conta_id)) return toast?.error('Selecione a conta em todos os pagamentos');
    if (pagamentos.some(p => !(parseFloat(String(p.valor).replace(/\./g,'').replace(',','.')) > 0))) return toast?.error('Informe o valor em todos os pagamentos');
    if (Math.abs(totalPagamentos - Number(modal.valor)) > 0.01) return toast?.error(`Total dos pagamentos (${formatCurrency(totalPagamentos)}) deve ser igual ao valor da parcela (${formatCurrency(modal.valor)})`);
    setBaixando(true);
    try {
      await parcelaLoteService.baixar(modal.id, {
        data_pagamento: formBaixa.data_pagamento,
        observacao: formBaixa.observacao,
        pagamentos: pagamentos.map(p => ({
          conta_id: p.conta_id,
          forma_pagamento_id: p.forma_id || null,
          valor: parseFloat(String(p.valor).replace(/\./g,'').replace(',','.')) || 0,
        })),
      });
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

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!arquivo) return toast?.error('Selecione um arquivo');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('arquivo', arquivo);
      fd.append('nome', uploadForm.nome || arquivo.name);
      fd.append('tipo', uploadForm.tipo || '');
      await documentoContratoService.upload(id, fd);
      toast?.success('Documento enviado!');
      setUploadForm({ nome: '', tipo: '' });
      setArquivo(null);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch { toast?.error('Erro ao enviar documento'); }
    finally { setUploading(false); }
  };

  const handleRemoveDoc = async (doc) => {
    if (!window.confirm(`Remover "${doc.nome}"?`)) return;
    try {
      await documentoContratoService.remove(id, doc.id);
      toast?.success('Documento removido');
      load();
    } catch { toast?.error('Erro ao remover'); }
  };

  const fmtBytes = (b) => {
    if (!b) return '';
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b/1024).toFixed(1)} KB`;
    return `${(b/1024/1024).toFixed(1)} MB`;
  };

  if (loading) return <div className={s.loading}>Carregando...</div>;
  if (!contrato) return null;

  const totalPago     = contrato.parcelas?.filter(p => p.status === 'pago').reduce((a, p) => a + Number(p.valor), 0) || 0;
  const totalPendente = contrato.parcelas?.filter(p => p.status !== 'pago').reduce((a, p) => a + Number(p.valor), 0) || 0;
  const pagas         = contrato.parcelas?.filter(p => p.status === 'pago').length || 0;
  const total         = contrato.parcelas?.length || 0;

  return (
    <div className={s.page}>
      {/* Header */}
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
        <div className={s.kpi}><span className={s.kpiLabel}>Cliente</span><strong className={s.kpiVal}>{contrato.comprador_nome || '—'}</strong></div>
        <div className={s.kpi}><span className={s.kpiLabel}>Valor Total</span><strong className={s.kpiVal}>{formatCurrency(contrato.valor_total)}</strong></div>
        <div className={s.kpi}><span className={s.kpiLabel}>Total Pago</span><strong className={s.kpiVal} style={{ color: '#10b981' }}>{formatCurrency(totalPago)}</strong></div>
        <div className={s.kpi}><span className={s.kpiLabel}>A Receber</span><strong className={s.kpiVal} style={{ color: '#f59e0b' }}>{formatCurrency(totalPendente)}</strong></div>
        <div className={s.kpi}><span className={s.kpiLabel}>Parcelas</span><strong className={s.kpiVal}>{pagas}/{total}</strong></div>
        <div className={s.kpi}><span className={s.kpiLabel}>Documentos</span><strong className={s.kpiVal}>{docs.length}</strong></div>
      </div>

      {contrato.entrada_valor > 0 && (
        <div className={s.entradaBox}>
          Entrada: <strong>{formatCurrency(contrato.entrada_valor)}</strong>
          {contrato.entrada_data && <span> — {formatDate(contrato.entrada_data)}</span>}
        </div>
      )}

      {/* Abas */}
      <div className={s.tabs}>
        <button className={`${s.tab} ${aba === 'geral' ? s.tabActive : ''}`} onClick={() => setAba('geral')}>Geral</button>
        <button className={`${s.tab} ${aba === 'parcelas' ? s.tabActive : ''}`} onClick={() => setAba('parcelas')}>Parcelas ({total})</button>
        <button className={`${s.tab} ${aba === 'documentos' ? s.tabActive : ''}`} onClick={() => setAba('documentos')}>Documentos ({docs.length})</button>
      </div>

      {/* Aba Geral */}
      {aba === 'geral' && (
        <motion.div className={s.geralGrid} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className={s.geralCard}>
            <div className={s.geralCardTitle}>Cliente</div>
            <div className={s.geralRow}><span>Nome</span><strong>{contrato.comprador_nome || '—'}</strong></div>
            <div className={s.geralRow}><span>CPF / CNPJ</span><strong>{contrato.cpf_cnpj || '—'}</strong></div>
            <div className={s.geralRow}><span>Telefone</span><strong>{contrato.telefone || '—'}</strong></div>
            <div className={s.geralRow}><span>E-mail</span><strong>{contrato.email || '—'}</strong></div>
          </div>

          <div className={s.geralCard}>
            <div className={s.geralCardTitle}>Imóvel</div>
            <div className={s.geralRow}><span>Empreendimento</span><strong>{contrato.empreendimento_nome}</strong></div>
            <div className={s.geralRow}><span>Quadra</span><strong>{contrato.quadra_nome}</strong></div>
            <div className={s.geralRow}><span>Lote</span><strong>{contrato.lote_numero}</strong></div>
            {contrato.lote_area && <div className={s.geralRow}><span>Área</span><strong>{contrato.lote_area} m²</strong></div>}
            {contrato.lote_dimensoes && <div className={s.geralRow}><span>Dimensões</span><strong>{contrato.lote_dimensoes}</strong></div>}
          </div>

          <div className={s.geralCard}>
            <div className={s.geralCardTitle}>Contrato</div>
            <div className={s.geralRow}><span>Data</span><strong>{formatDate(contrato.data_contrato)}</strong></div>
            <div className={s.geralRow}><span>Status</span>
              <span className={s.badge} style={{ background: STATUS_COLOR[contrato.status] + '22', color: STATUS_COLOR[contrato.status], border: `1px solid ${STATUS_COLOR[contrato.status]}44` }}>
                {STATUS_LABEL[contrato.status]}
              </span>
            </div>
            <div className={s.geralRow}><span>Valor Total</span><strong>{formatCurrency(contrato.valor_total)}</strong></div>
            <div className={s.geralRow}><span>Entrada</span><strong>{formatCurrency(contrato.entrada_valor || 0)}</strong></div>
            {contrato.entrada_data && <div className={s.geralRow}><span>Data da Entrada</span><strong>{formatDate(contrato.entrada_data)}</strong></div>}
            <div className={s.geralRow}><span>Nº de Parcelas</span><strong>{contrato.num_parcelas}</strong></div>
            <div className={s.geralRow}><span>Dia de Vencimento</span><strong>Todo dia {contrato.dia_vencimento}</strong></div>
            {contrato.observacao && <div className={s.geralRow}><span>Observação</span><strong>{contrato.observacao}</strong></div>}
          </div>
        </motion.div>
      )}

      {/* Aba Parcelas */}
      {aba === 'parcelas' && (
        <motion.div className={s.card} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>#</th><th>Vencimento</th><th>Valor</th><th>Status</th>
                <th>Pagamento</th><th>Conta</th><th></th>
              </tr>
            </thead>
            <tbody>
              {contrato.parcelas?.map(p => (
                <tr key={p.id} className={`${p.status === 'vencido' ? s.rowVencido : ''} ${p.numero === 0 ? s.rowEntrada : ''}`}>
                  <td className={s.mono}>
                    {p.numero === 0
                      ? <span className={s.badgeEntrada}>Entrada</span>
                      : p.numero}
                  </td>
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
                    {p.status !== 'pago'
                      ? <button className={s.btnBaixar} onClick={() => abrirBaixa(p)}>Baixar</button>
                      : <button className={s.btnEstornar} onClick={() => handleEstornar(p)}>Estornar</button>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Aba Documentos */}
      {aba === 'documentos' && (
        <motion.div className={s.docsArea} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {/* Form upload — linha única */}
          <form className={s.uploadBar} onSubmit={handleUpload}>
            <input type="file" ref={fileRef} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={e => setArquivo(e.target.files[0] || null)} style={{ display: 'none' }} />

            <div className={`${s.uploadFileBtn} ${arquivo ? s.uploadFileBtnOk : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); setArquivo(e.dataTransfer.files[0] || null); }}>
              <IcoFile />
              <span>{arquivo ? arquivo.name : 'Selecionar arquivo...'}</span>
            </div>

            <input className={s.uploadInput} type="text" value={uploadForm.nome}
              onChange={e => setUploadForm(p => ({ ...p, nome: e.target.value }))}
              placeholder={arquivo ? arquivo.name : 'Nome do documento'} />

            <select className={s.uploadSelect} value={uploadForm.tipo}
              onChange={e => setUploadForm(p => ({ ...p, tipo: e.target.value }))}>
              <option value="">Tipo...</option>
              {TIPO_DOC.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <button type="submit" className={s.btnUpload} disabled={uploading || !arquivo}>
              {uploading ? '...' : 'Enviar'}
            </button>
          </form>

          {/* Uso Cloudinary */}
          {cloudUsage && (
            <div className={s.cloudUsage}>
              <div className={s.cloudUsageTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
                Armazenamento Cloudinary
              </div>
              <div className={s.cloudUsageBar}>
                <div className={s.cloudUsageFill} style={{ width: `${Math.min(cloudUsage.storage_pct, 100)}%`, background: cloudUsage.storage_pct > 80 ? '#ef4444' : cloudUsage.storage_pct > 60 ? '#f59e0b' : '#10b981' }} />
              </div>
              <div className={s.cloudUsageInfo}>
                <span>{cloudUsage.storage_used_mb} MB usados de {cloudUsage.storage_limit_mb} MB ({cloudUsage.storage_pct}%)</span>
                <span>Banda: {cloudUsage.bandwidth_used_mb} MB</span>
              </div>
            </div>
          )}

          {/* Lista de documentos */}
          {docs.length === 0
            ? <div className={s.empty}>Nenhum documento cadastrado</div>
            : (
              <div className={s.docList}>
                {docs.map(doc => (
                  <div key={doc.id} className={s.docItem}>
                    <div className={s.docIcon}><IcoFile /></div>
                    <div className={s.docInfo}>
                      <div className={s.docNome}>{doc.nome}</div>
                      <div className={s.docMeta}>
                        {doc.tipo && <span className={s.docTipo}>{doc.tipo}</span>}
                        {doc.tamanho && <span>{fmtBytes(doc.tamanho)}</span>}
                        <span>{formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                    <div className={s.docActions}>
                      <button className={s.btnDl} title="Visualizar" onClick={() => setPreview(doc)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <a href={`${documentoContratoService.viewUrl(id, doc.id)}?token=${localStorage.getItem('cosvar_token')}&dl=1`} target="_blank" rel="noreferrer" className={s.btnDl} title="Download">
                        <IcoDl />
                      </a>
                      <button className={s.btnDelDoc} onClick={() => handleRemoveDoc(doc)} title="Remover">
                        <IcoTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </motion.div>
      )}

      {/* Modal preview documento */}
      {preview && (
        <div className={s.overlay} onClick={() => setPreview(null)}>
          <div className={s.previewModal} onClick={e => e.stopPropagation()}>
            <div className={s.previewHeader}>
              <span className={s.previewNome}>{preview.nome}</span>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <a href={`${documentoContratoService.viewUrl(id, preview.id)}?token=${localStorage.getItem('cosvar_token')}&dl=1`} target="_blank" rel="noreferrer" className={s.btnDl} title="Download">
                  <IcoDl />
                </a>
                <button className={s.btnDelDoc} style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }} onClick={() => setPreview(null)} title="Fechar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            {/\.(jpg|jpeg|png|gif|webp)$/i.test(preview.nome)
              ? <img src={`${documentoContratoService.viewUrl(id, preview.id)}?token=${localStorage.getItem('cosvar_token')}`} alt={preview.nome} className={s.previewImg} />
              : <iframe src={`${documentoContratoService.viewUrl(id, preview.id)}?token=${localStorage.getItem('cosvar_token')}`} className={s.previewFrame} title={preview.nome} />
            }
          </div>
        </div>
      )}

      {/* Modal baixa */}
      {modal && (
        <div className={s.overlay} onClick={() => setModal(null)}>
          <form className={s.modal} onClick={e => e.stopPropagation()} onSubmit={handleBaixar}>
            <div className={s.modalTitle}>Baixar {modal.numero === 0 ? 'Entrada' : `Parcela ${modal.numero}`}</div>
            <div className={s.modalSub}>{formatCurrency(modal.valor)} — venc. {formatDate(modal.data_vencimento)}</div>

            <div className={s.mField}>
              <label>Data de Pagamento</label>
              <DateInput className={s.mInput} value={formBaixa.data_pagamento} onChange={e => setFormBaixa(p => ({ ...p, data_pagamento: e.target.value }))} required />
            </div>

            <div className={s.mFormasLabel}>Formas de Recebimento</div>
            {pagamentos.map((p, idx) => (
              <div key={p._id} className={s.mPagRow}>
                <select className={s.mSelect} value={p.conta_id} onChange={e => setPag(p._id, 'conta_id', e.target.value)} required>
                  <option value="">Conta...</option>
                  {contas.map(c => <option key={c.id} value={c.id}>{c.banco_nome} — {c.numero}</option>)}
                </select>
                <select className={s.mSelect} value={p.forma_id} onChange={e => setPag(p._id, 'forma_id', e.target.value)}>
                  <option value="">Forma...</option>
                  {formasDaConta(p.conta_id).map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
                <CurrencyInput className={s.mInputValor} value={p.valor} onChange={e => setPag(p._id, 'valor', e.target.value)} placeholder="0,00" />
                {pagamentos.length > 1 && (
                  <button type="button" className={s.mRemBtn} onClick={() => remPag(p._id)}>✕</button>
                )}
              </div>
            ))}
            <div className={s.mPagFooter}>
              <button type="button" className={s.mAddBtn} onClick={addPag}>+ Adicionar forma</button>
              <span className={`${s.mTotal} ${Math.abs(totalPagamentos - Number(modal.valor)) > 0.01 ? s.mTotalErro : s.mTotalOk}`}>
                Total: {formatCurrency(totalPagamentos)}
              </span>
            </div>

            <div className={s.mField}>
              <label>Observação</label>
              <input className={s.mInput} type="text" value={formBaixa.observacao} onChange={e => setFormBaixa(p => ({ ...p, observacao: e.target.value }))} placeholder="Opcional" />
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
