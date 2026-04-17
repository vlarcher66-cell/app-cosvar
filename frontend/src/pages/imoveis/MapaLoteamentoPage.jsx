import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import empreendimentoService from '../../services/empreendimentoService';
import loteService from '../../services/loteService';
import contratoLoteService from '../../services/contratoLoteService';
import compradorService from '../../services/compradorService';
import contaService from '../../services/contaService';
import formaPagamentoService from '../../services/formaPagamentoService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DateInput from '../../components/ui/DateInput';
import CurrencyInput from '../../components/ui/CurrencyInput';
import ModalProposta from '../../components/imoveis/ModalProposta';
import { useGlobalToast } from '../../components/layout/MainLayout';
import { formatCurrency, formatDate, formatDateInput } from '../../utils/formatters';
import s from './MapaLoteamentoPage.module.css';

const IcoBack    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IcoPlus    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoEdit    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;

const STATUS_COLOR  = { disponivel: '#10b981', reservado: '#f59e0b', vendido: '#ef4444', rescindido: '#6b7280' };
const SEM_PRECO_COLOR = '#f59e0b'; // disponível mas sem preço → amarelo (atenção)

const loteColor = (lote) => {
  if (lote.status === 'disponivel' && !lote.valor) return SEM_PRECO_COLOR;
  return STATUS_COLOR[lote.status];
};
const STATUS_LABEL  = { disponivel: 'Disponível', reservado: 'Reservado', vendido: 'Vendido', rescindido: 'Rescindido' };
const STATUS_LIST   = ['disponivel', 'reservado', 'vendido', 'rescindido'];

const EMPTY_LOTE = { quadra_id: '', numero: '', frente: '', fundo: '', area: '', dimensoes: '', preco_m2: '', valor: '', status: 'disponivel', observacao: '' };

// Parseia "12x30" ou "12 x 30" → { frente: 12, fundo: 30 }
const parseDim = (str) => {
  const m = String(str || '').replace(/\s/g, '').toLowerCase().match(/^([0-9.,]+)[xX*]([0-9.,]+)/);
  if (!m) return null;
  return { frente: parseFloat(m[1].replace(',', '.')), fundo: parseFloat(m[2].replace(',', '.')) };
};
const EMPTY_CONTRATO = { comprador_id: '', data_contrato: '', valor_total: '', entrada_valor: '', entrada_data: '', num_parcelas: '12', dia_vencimento: '10', observacao: '' };

export default function MapaLoteamentoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useGlobalToast();

  const [emp,     setEmp]     = useState(null);
  const [lotes,   setLotes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroQuadra, setFiltroQuadra] = useState('todas');

  // Lote selecionado (tooltip/modal)
  const [selected, setSelected] = useState(null);
  const [modalLote, setModalLote] = useState(false);
  const [modalContrato, setModalContrato] = useState(false);
  const [modalDetalhe, setModalDetalhe] = useState(false);

  // Auxiliares
  const [compradores, setCompradores] = useState([]);
  const [contas,      setContas]      = useState([]);
  const [formas,      setFormas]      = useState([]);
  const [contratoDetalhe, setContratoDetalhe] = useState(null);

  const [aba, setAba] = useState('mapa');

  const [formLote,     setFormLote]     = useState(EMPTY_LOTE);
  const [formContrato, setFormContrato] = useState(EMPTY_CONTRATO);
  const [saving, setSaving] = useState(false);
  const [editingLote, setEditingLote] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [modalProposta, setModalProposta] = useState(false);
  const [loteParaProposta, setLoteParaProposta] = useState(null);

  // Gestão de quadras
  const [quadrasGestao, setQuadrasGestao]     = useState([]);
  const [loadingQ,      setLoadingQ]          = useState(false);
  const [novaQuadra,    setNovaQuadra]        = useState('');
  const [savingQ,       setSavingQ]           = useState(false);
  const [gerandoQ,      setGerandoQ]          = useState(null); // quadra_id sendo gerado
  const [formGerar,     setFormGerar]         = useState({ qtd: '', frente: '', fundo: '', preco_m2: '' });
  const [abrirGerar,    setAbrirGerar]        = useState(null); // quadra_id com form aberto

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const empData = await empreendimentoService.getOne(id);
      setEmp(empData);
      try {
        const lotesData = await empreendimentoService.getLotes(id);
        setLotes(lotesData || []);
      } catch {
        setLotes([]);
      }
    } catch {
      toast?.error('Erro ao carregar mapa');
    }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    compradorService.getAll().then(setCompradores);
    contaService.getAll().then(setContas);
    formaPagamentoService.getAll().then(setFormas);
  }, []);

  const loadQuadras = useCallback(async () => {
    setLoadingQ(true);
    try { setQuadrasGestao(await empreendimentoService.getQuadras(id)); }
    catch { toast?.error('Erro ao carregar quadras'); }
    finally { setLoadingQ(false); }
  }, [id]);

  useEffect(() => { if (aba === 'quadras') loadQuadras(); }, [aba, loadQuadras]);

  const handleCreateQuadra = async (e) => {
    e.preventDefault();
    if (!novaQuadra.trim()) return;
    setSavingQ(true);
    try {
      await empreendimentoService.createQuadra(id, { nome: novaQuadra.trim().toUpperCase() });
      toast?.success(`Quadra ${novaQuadra.toUpperCase()} criada`);
      setNovaQuadra('');
      loadQuadras();
    } catch (err) {
      toast?.error(err?.response?.data?.message || 'Erro ao criar quadra');
    } finally { setSavingQ(false); }
  };

  const handleRemoveQuadra = async (q) => {
    if (!window.confirm(`Remover Quadra ${q.nome} e todos os seus lotes?`)) return;
    try {
      await empreendimentoService.removeQuadra(id, q.id);
      toast?.success(`Quadra ${q.nome} removida`);
      loadQuadras(); load();
    } catch (err) {
      toast?.error(err?.response?.data?.message || 'Erro ao remover quadra');
    }
  };

  const handleGerarLotes = async (quadra_id) => {
    if (!formGerar.qtd) return toast?.error('Informe a quantidade de lotes');
    setGerandoQ(quadra_id);
    try {
      const r = await empreendimentoService.gerarLotes(id, quadra_id, {
        qtd:      parseInt(formGerar.qtd),
        frente:   formGerar.frente   || null,
        fundo:    formGerar.fundo    || null,
        preco_m2: formGerar.preco_m2 || null,
      });
      toast?.success(r.message || 'Lotes criados!');
      setAbrirGerar(null);
      setFormGerar({ qtd: '', frente: '', fundo: '', preco_m2: '' });
      loadQuadras(); load();
    } catch (err) {
      toast?.error(err?.response?.data?.message || 'Erro ao gerar lotes');
    } finally { setGerandoQ(null); }
  };

  const quadras = emp?.quadras || [];
  const quadrasUnicas = [...new Set(lotes.map(l => l.quadra_nome))].sort();

  const lotesFiltrados = lotes.filter(l => {
    if (filtroStatus !== 'todos' && l.status !== filtroStatus) return false;
    if (filtroQuadra !== 'todas' && l.quadra_nome !== filtroQuadra) return false;
    return true;
  });

  const totais = STATUS_LIST.reduce((acc, st) => {
    acc[st] = lotes.filter(l => l.status === st).length;
    return acc;
  }, {});

  // Abre modal de detalhe do lote
  const abrirDetalhe = async (lote) => {
    setSelected(lote);
    if (lote.contrato_id) {
      try {
        const c = await contratoLoteService.getOne(lote.contrato_id);
        setContratoDetalhe(c);
      } catch { setContratoDetalhe(null); }
    } else {
      setContratoDetalhe(null);
    }
    setModalDetalhe(true);
  };

  // Abre modal de edição de lote
  const abrirEditLote = (lote) => {
    setEditingLote(lote);
    const dim = parseDim(lote.dimensoes);
    const precoM2 = (lote.area && lote.valor)
      ? String((parseFloat(lote.valor) / parseFloat(lote.area)).toFixed(2))
      : '';
    setFormLote({
      quadra_id:  String(lote.quadra_id),
      numero:     lote.numero,
      frente:     dim ? String(dim.frente) : '',
      fundo:      dim ? String(dim.fundo)  : '',
      area:       lote.area    || '',
      dimensoes:  lote.dimensoes || '',
      preco_m2:   precoM2,
      valor:      lote.valor   || '',
      status:     lote.status,
      observacao: lote.observacao || '',
    });
    setModalDetalhe(false);
    setModalLote(true);
  };

  // Abre modal novo lote
  const abrirNovoLote = () => {
    setEditingLote(null);
    setFormLote(EMPTY_LOTE);
    setModalLote(true);
  };

  const handleSaveLote = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingLote) {
        await loteService.update(editingLote.id, formLote);
        toast?.success('Lote atualizado');
      } else {
        await loteService.create(formLote);
        toast?.success('Lote criado');
      }
      setModalLote(false); load();
    } catch { toast?.error('Erro ao salvar lote'); }
    finally { setSaving(false); }
  };

  const handleSaveContrato = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await contratoLoteService.create({ ...formContrato, lote_id: selected.id });
      toast?.success('Contrato registrado — parcelas geradas automaticamente');
      setModalContrato(false); load();
    } catch (err) { toast?.error(err.response?.data?.message || 'Erro ao salvar contrato'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await loteService.remove(deleteTarget.id);
      toast?.success('Lote excluído');
      setDeleteTarget(null); setModalDetalhe(false); load();
    } catch { toast?.error('Erro ao excluir'); }
    finally { setDeleting(false); }
  };

  const setL = (k, v) => setFormLote(p => ({ ...p, [k]: v }));
  const setC = (k, v) => setFormContrato(p => ({ ...p, [k]: v }));

  // Agrupa lotes por quadra para a tabela
  const lotesPorQuadra = quadrasUnicas.map(q => ({
    quadra: q,
    lotes: lotesFiltrados.filter(l => l.quadra_nome === q),
  })).filter(g => g.lotes.length > 0);

  if (loading) return <div className={s.loading}>Carregando mapa...</div>;
  if (!emp)    return <div className={s.loading}>Empreendimento não encontrado</div>;

  return (
    <div className={s.page}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <button className={s.backBtn} onClick={() => navigate('/imoveis/loteamentos')}><IcoBack /></button>
          <div>
            <h1 className={s.pageTitle}>{emp.nome}</h1>
            <p className={s.pageSub}>{emp.cidade}{emp.bairro ? ` — ${emp.bairro}` : ''}</p>
          </div>
        </div>
        {aba === 'mapa' && (
          <button className={s.newBtn} onClick={abrirNovoLote}><IcoPlus /> Novo Lote</button>
        )}
      </div>

      {/* Abas */}
      <div className={s.abas}>
        <button className={`${s.abaBtn} ${aba === 'mapa' ? s.abaActive : ''}`} onClick={() => setAba('mapa')}>Mapa de Vendas</button>
        <button className={`${s.abaBtn} ${aba === 'quadras' ? s.abaActive : ''}`} onClick={() => setAba('quadras')}>Gestão de Quadras</button>
      </div>

      {/* KPIs — só no mapa */}
      {aba === 'mapa' && <></> /* bloco abaixo é o mapa */}
      {aba === 'quadras' && (
        <div className={s.quadrasGestao}>
          {/* Form nova quadra */}
          <form className={s.novaQuadraForm} onSubmit={handleCreateQuadra}>
            <div className={s.novaQuadraTitle}>Nova Quadra</div>
            <div className={s.novaQuadraRow}>
              <input className={s.input} value={novaQuadra}
                onChange={e => setNovaQuadra(e.target.value)}
                placeholder="Nome da quadra (ex: A, B, 1, 2...)"
                maxLength={10} />
              <button type="submit" className={s.newBtn} disabled={savingQ || !novaQuadra.trim()}>
                <IcoPlus /> {savingQ ? 'Criando...' : 'Criar Quadra'}
              </button>
            </div>
          </form>

          {/* Lista de quadras */}
          {loadingQ
            ? <div className={s.loading}>Carregando quadras...</div>
            : quadrasGestao.length === 0
              ? <div className={s.empty}>Nenhuma quadra cadastrada. Crie a primeira acima.</div>
              : quadrasGestao.map(q => (
                <div key={q.id} className={s.quadraCard}>
                  <div className={s.quadraCardHeader}>
                    <div className={s.quadraCardTitle}>Quadra {q.nome}</div>
                    <div className={s.quadraCardStats}>
                      <span className={s.statDisp}>{q.disponiveis} disp.</span>
                      <span className={s.statRes}>{q.reservados} res.</span>
                      <span className={s.statVend}>{q.vendidos} vend.</span>
                      <span className={s.statTotal}>{q.total_lotes} total</span>
                    </div>
                    <div className={s.quadraCardActions}>
                      <button className={s.btnGerarLotes}
                        onClick={() => { setAbrirGerar(abrirGerar === q.id ? null : q.id); setFormGerar({ qtd: '', frente: '', fundo: '', preco_m2: '' }); }}>
                        {abrirGerar === q.id ? 'Cancelar' : '+ Gerar Lotes'}
                      </button>
                      {q.total_lotes === 0 && (
                        <button className={s.btnRemoveQ} onClick={() => handleRemoveQuadra(q)} title="Remover quadra">✕</button>
                      )}
                    </div>
                  </div>

                  {/* Form gerar lotes */}
                  {abrirGerar === q.id && (
                    <div className={s.gerarForm}>
                      <div className={s.gerarGrid}>
                        <div className={s.gerarField}>
                          <label>Qtd de Lotes *</label>
                          <input className={s.input} type="number" min="1" max="200"
                            value={formGerar.qtd} onChange={e => setFormGerar(p => ({ ...p, qtd: e.target.value }))}
                            placeholder="Ex: 35" />
                        </div>
                        <div className={s.gerarField}>
                          <label>Frente (m)</label>
                          <input className={s.input} type="number" step="0.01" min="0"
                            value={formGerar.frente} onChange={e => setFormGerar(p => ({ ...p, frente: e.target.value }))}
                            placeholder="Ex: 12" />
                        </div>
                        <div className={s.gerarField}>
                          <label>Fundo (m)</label>
                          <input className={s.input} type="number" step="0.01" min="0"
                            value={formGerar.fundo} onChange={e => setFormGerar(p => ({ ...p, fundo: e.target.value }))}
                            placeholder="Ex: 30" />
                        </div>
                        <div className={s.gerarField}>
                          <label>Preço / m² (R$)</label>
                          <CurrencyInput className={s.input}
                            value={formGerar.preco_m2} onChange={e => setFormGerar(p => ({ ...p, preco_m2: e.target.value }))}
                            placeholder="0,00" />
                        </div>
                      </div>

                      {/* Preview do cálculo */}
                      {formGerar.qtd && formGerar.frente && formGerar.fundo && (
                        <div className={s.gerarPreview}>
                          {formGerar.qtd} lotes &nbsp;·&nbsp;
                          Área: {(parseFloat(formGerar.frente) * parseFloat(formGerar.fundo)).toFixed(0)} m² cada
                          {formGerar.preco_m2 && (
                            <> &nbsp;·&nbsp; Valor: <strong>{formatCurrency(parseFloat(formGerar.frente) * parseFloat(formGerar.fundo) * parseFloat(formGerar.preco_m2))}</strong> cada</>
                          )}
                        </div>
                      )}

                      <div className={s.gerarActions}>
                        <button className={s.newBtn} onClick={() => handleGerarLotes(q.id)}
                          disabled={gerandoQ === q.id || !formGerar.qtd}>
                          {gerandoQ === q.id ? 'Gerando...' : `Gerar ${formGerar.qtd || '?'} Lotes`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
          }
        </div>
      )}

      {aba === 'mapa' && <>{/* KPIs */}
      <div className={s.kpiRow}>
        {STATUS_LIST.map(st => (
          <div key={st} className={`${s.kpi} ${filtroStatus === st ? s.kpiActive : ''}`}
            onClick={() => setFiltroStatus(filtroStatus === st ? 'todos' : st)}
            style={{ '--kpi-color': STATUS_COLOR[st] }}>
            <div className={s.kpiBar} style={{ background: STATUS_COLOR[st] }} />
            <span className={s.kpiVal}>{totais[st]}</span>
            <span className={s.kpiLabel}>{STATUS_LABEL[st]}</span>
          </div>
        ))}
        <div className={s.kpi} style={{ '--kpi-color': '#6366f1' }}>
          <div className={s.kpiBar} style={{ background: '#6366f1' }} />
          <span className={s.kpiVal}>{lotes.length}</span>
          <span className={s.kpiLabel}>Total</span>
        </div>
      </div>

      {/* Filtros */}
      <div className={s.filterBar}>
        <select className={s.filterSelect} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="todos">Todos os status</option>
          {STATUS_LIST.map(st => <option key={st} value={st}>{STATUS_LABEL[st]}</option>)}
        </select>
        <select className={s.filterSelect} value={filtroQuadra} onChange={e => setFiltroQuadra(e.target.value)}>
          <option value="todas">Todas as quadras</option>
          {quadrasUnicas.map(q => <option key={q} value={q}>Quadra {q}</option>)}
        </select>
        {(filtroStatus !== 'todos' || filtroQuadra !== 'todas') && (
          <button className={s.clearBtn} onClick={() => { setFiltroStatus('todos'); setFiltroQuadra('todas'); }}>✕ Limpar</button>
        )}
        <span className={s.filterCount}>{lotesFiltrados.length} lotes</span>
      </div>

      {/* Grade visual de lotes por quadra */}
      <div className={s.mapaWrap}>
        {lotesPorQuadra.length === 0 ? (
          <div className={s.empty}>Nenhum lote encontrado. Clique em "Novo Lote" para começar.</div>
        ) : (
          lotesPorQuadra.map(grupo => (
            <div key={grupo.quadra} className={s.quadraWrap}>
              <div className={s.quadraLabel}>Quadra {grupo.quadra}</div>
              <div className={s.quadraLotes}>
                {grupo.lotes.map(lote => (
                  <motion.button key={lote.id}
                    className={s.loteBtn}
                    style={{ '--lote-color': loteColor(lote) }}
                    onClick={() => abrirDetalhe(lote)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    title={`Lote ${lote.numero} — ${STATUS_LABEL[lote.status]}${!lote.valor && lote.status === 'disponivel' ? ' (sem preço)' : ''}${lote.comprador_nome ? ` — ${lote.comprador_nome}` : ''}`}
                  >
                    <span className={s.loteNum}>{lote.numero}</span>
                    {lote.parcelas_vencidas > 0 && <span className={s.loteAlert}>!</span>}
                  </motion.button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Legenda */}
      <div className={s.legenda}>
        <div className={s.legendaItem}>
          <span className={s.legendaDot} style={{ background: '#10b981' }} />
          <span>Disponível (com preço)</span>
        </div>
        <div className={s.legendaItem}>
          <span className={s.legendaDot} style={{ background: '#f59e0b' }} />
          <span>Disponível (sem preço) / Reservado</span>
        </div>
        {['vendido', 'rescindido'].map(st => (
          <div key={st} className={s.legendaItem}>
            <span className={s.legendaDot} style={{ background: STATUS_COLOR[st] }} />
            <span>{STATUS_LABEL[st]}</span>
          </div>
        ))}
      </div>
      </> /* fim aba mapa */}

      {/* Modal detalhe do lote */}
      <AnimatePresence>
        {modalDetalhe && selected && (
          <Modal isOpen={modalDetalhe} onClose={() => setModalDetalhe(false)}
            title={`Lote ${selected.numero} — Quadra ${selected.quadra_nome}`} width={480}>
            <div className={s.detalhe}>
              <div className={s.detalheStatus} style={{ background: STATUS_COLOR[selected.status] + '22', color: STATUS_COLOR[selected.status], border: `1px solid ${STATUS_COLOR[selected.status]}44` }}>
                {STATUS_LABEL[selected.status]}
              </div>

              <div className={s.detalheGrid}>
                {selected.area && <div className={s.detalheItem}><span className={s.detalheKey}>Área</span><span className={s.detalheVal}>{selected.area} m²</span></div>}
                {selected.dimensoes && <div className={s.detalheItem}><span className={s.detalheKey}>Dimensões</span><span className={s.detalheVal}>{selected.dimensoes}</span></div>}
                {selected.valor && <div className={s.detalheItem}><span className={s.detalheKey}>Valor</span><span className={s.detalheVal}>{formatCurrency(selected.valor)}</span></div>}
              </div>

              {contratoDetalhe && (
                <div className={s.contratoInfo}>
                  <div className={s.contratoRow}><span>Comprador</span><strong>{contratoDetalhe.comprador_nome}</strong></div>
                  <div className={s.contratoRow}><span>Contrato</span><strong>{formatDate(contratoDetalhe.data_contrato)}</strong></div>
                  <div className={s.contratoRow}><span>Valor Total</span><strong>{formatCurrency(contratoDetalhe.valor_total)}</strong></div>
                  <div className={s.contratoRow}><span>Parcelas</span><strong>{contratoDetalhe.parcelas_pagas}/{contratoDetalhe.total_parcelas} pagas</strong></div>
                  {contratoDetalhe.parcelas_vencidas > 0 && (
                    <div className={s.alertVencido}>⚠️ {contratoDetalhe.parcelas_vencidas} parcela(s) vencida(s)</div>
                  )}
                  <div className={s.contratoRow}><span>Total Recebido</span><strong style={{ color: '#10b981' }}>{formatCurrency(contratoDetalhe.total_recebido)}</strong></div>
                </div>
              )}

              {selected.observacao && <p className={s.obs}>{selected.observacao}</p>}

              <div className={s.detalheActions}>
                <Button variant="secondary" onClick={() => abrirEditLote(selected)}>
                  <IcoEdit /> Editar Lote
                </Button>
                {selected.status === 'disponivel' && (
                  selected.valor
                    ? <Button variant="primary" onClick={() => {
                        setLoteParaProposta({ ...selected, empreendimento_nome: emp?.nome });
                        setModalDetalhe(false);
                        setModalProposta(true);
                      }}>
                        Fazer Proposta
                      </Button>
                    : <div className={s.semValorAviso}>⚠ Defina o valor do lote para fazer proposta</div>
                )}
                {contratoDetalhe && (
                  <Button variant="secondary" onClick={() => navigate(`/imoveis/contratos/${contratoDetalhe.id}`)}>
                    Ver Contrato
                  </Button>
                )}
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Modal novo/editar lote */}
      <Modal isOpen={modalLote} onClose={() => setModalLote(false)}
        title={editingLote ? `Editar Lote ${editingLote.numero}` : 'Novo Lote'} width={460}>
        <form onSubmit={handleSaveLote} className={s.form}>
          <div className={s.grid2}>
            <div className={s.field}>
              <label className={s.label}>Quadra <span className={s.req}>*</span></label>
              <select className={s.select} value={formLote.quadra_id} onChange={e => setL('quadra_id', e.target.value)} required>
                <option value="">Selecione...</option>
                {quadras.map(q => <option key={q.id} value={q.id}>Quadra {q.nome}</option>)}
              </select>
            </div>
            <div className={s.field}>
              <label className={s.label}>Número <span className={s.req}>*</span></label>
              <input className={s.input} value={formLote.numero} onChange={e => setL('numero', e.target.value)} required placeholder="Ex: 01" />
            </div>
          </div>
          {/* Dimensões: frente × fundo → calcula área e dimensões */}
          <div className={s.grid2}>
            <div className={s.field}>
              <label className={s.label}>Frente (m)</label>
              <input className={s.input} type="number" step="0.01" min="0"
                value={formLote.frente}
                onChange={e => {
                  const frente = e.target.value;
                  const fundo = formLote.fundo;
                  const area = frente && fundo ? (parseFloat(frente) * parseFloat(fundo)).toFixed(2) : '';
                  const dim  = frente && fundo ? `${frente}x${fundo}m` : '';
                  const valor = area && formLote.preco_m2 ? (parseFloat(area) * parseFloat(formLote.preco_m2)).toFixed(2) : formLote.valor;
                  setFormLote(p => ({ ...p, frente, area, dimensoes: dim, valor }));
                }}
                placeholder="Ex: 12" />
            </div>
            <div className={s.field}>
              <label className={s.label}>Fundo (m)</label>
              <input className={s.input} type="number" step="0.01" min="0"
                value={formLote.fundo}
                onChange={e => {
                  const fundo = e.target.value;
                  const frente = formLote.frente;
                  const area = frente && fundo ? (parseFloat(frente) * parseFloat(fundo)).toFixed(2) : '';
                  const dim  = frente && fundo ? `${frente}x${fundo}m` : '';
                  const valor = area && formLote.preco_m2 ? (parseFloat(area) * parseFloat(formLote.preco_m2)).toFixed(2) : formLote.valor;
                  setFormLote(p => ({ ...p, fundo, area, dimensoes: dim, valor }));
                }}
                placeholder="Ex: 30" />
            </div>
          </div>

          {/* Área calculada + preço/m² → calcula valor total */}
          <div className={s.grid2}>
            <div className={s.field}>
              <label className={s.label}>Área (m²)</label>
              <input className={s.input} type="number" step="0.01" min="0"
                value={formLote.area}
                onChange={e => {
                  const area = e.target.value;
                  const valor = area && formLote.preco_m2 ? (parseFloat(area) * parseFloat(formLote.preco_m2)).toFixed(2) : formLote.valor;
                  setFormLote(p => ({ ...p, area, valor }));
                }}
                placeholder="Calculado automaticamente" />
            </div>
            <div className={s.field}>
              <label className={s.label}>Preço por m² (R$)</label>
              <CurrencyInput className={s.input}
                value={formLote.preco_m2}
                onChange={e => {
                  const preco_m2 = e.target.value;
                  const valor = formLote.area && preco_m2 ? (parseFloat(formLote.area) * parseFloat(preco_m2)).toFixed(2) : formLote.valor;
                  setFormLote(p => ({ ...p, preco_m2, valor }));
                }}
                placeholder="0,00" />
            </div>
          </div>

          <div className={s.grid2}>
            <div className={s.field}>
              <label className={s.label}>Valor Total (R$)</label>
              <CurrencyInput className={s.input} value={formLote.valor} onChange={e => setL('valor', e.target.value)} placeholder="0,00" />
              {formLote.area && formLote.valor && (
                <span className={s.calcHint}>
                  {formatCurrency(parseFloat(formLote.valor))} — {parseFloat(formLote.area).toFixed(0)} m²
                </span>
              )}
            </div>
            <div className={s.field}>
              <label className={s.label}>Status</label>
              <select className={s.select} value={formLote.status} onChange={e => setL('status', e.target.value)}>
                {STATUS_LIST.map(st => <option key={st} value={st}>{STATUS_LABEL[st]}</option>)}
              </select>
            </div>
          </div>
          <div className={s.field}>
            <label className={s.label}>Observação</label>
            <textarea className={s.textarea} value={formLote.observacao} onChange={e => setL('observacao', e.target.value)} rows={2} />
          </div>
          <div className={s.formActions}>
            <Button type="button" variant="secondary" onClick={() => setModalLote(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" variant="primary" loading={saving}>{editingLote ? 'Salvar' : 'Criar Lote'}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal registrar venda */}
      <Modal isOpen={modalContrato} onClose={() => setModalContrato(false)}
        title={`Registrar Venda — Lote ${selected?.numero} Qd.${selected?.quadra_nome}`} width={500}>
        <form onSubmit={handleSaveContrato} className={s.form}>
          <div className={s.field}>
            <label className={s.label}>Comprador <span className={s.req}>*</span></label>
            <select className={s.select} value={formContrato.comprador_id} onChange={e => setC('comprador_id', e.target.value)} required>
              <option value="">Selecione...</option>
              {compradores.map(c => <option key={c.id} value={c.id}>{c.nome_razao}</option>)}
            </select>
          </div>
          <div className={s.grid2}>
            <div className={s.field}>
              <label className={s.label}>Data do Contrato <span className={s.req}>*</span></label>
              <DateInput className={s.input} value={formContrato.data_contrato} onChange={e => setC('data_contrato', e.target.value)} required />
            </div>
            <div className={s.field}>
              <label className={s.label}>Valor Total <span className={s.req}>*</span></label>
              <CurrencyInput className={s.input} value={formContrato.valor_total} onChange={e => setC('valor_total', e.target.value)} required />
            </div>
          </div>
          <div className={s.grid2}>
            <div className={s.field}>
              <label className={s.label}>Entrada (R$)</label>
              <CurrencyInput className={s.input} value={formContrato.entrada_valor} onChange={e => setC('entrada_valor', e.target.value)} />
            </div>
            <div className={s.field}>
              <label className={s.label}>Data da Entrada</label>
              <DateInput className={s.input} value={formContrato.entrada_data} onChange={e => setC('entrada_data', e.target.value)} />
            </div>
          </div>
          <div className={s.grid2}>
            <div className={s.field}>
              <label className={s.label}>Nº de Parcelas <span className={s.req}>*</span></label>
              <input className={s.input} type="number" min="1" value={formContrato.num_parcelas} onChange={e => setC('num_parcelas', e.target.value)} required />
            </div>
            <div className={s.field}>
              <label className={s.label}>Dia Vencimento <span className={s.req}>*</span></label>
              <input className={s.input} type="number" min="1" max="28" value={formContrato.dia_vencimento} onChange={e => setC('dia_vencimento', e.target.value)} required />
            </div>
          </div>
          {formContrato.valor_total && formContrato.num_parcelas > 0 && (
            <div className={s.parcelaPreview}>
              Valor da parcela: <strong>
                {formatCurrency((parseFloat(String(formContrato.valor_total).replace(/\./g,'').replace(',','.')) - parseFloat(String(formContrato.entrada_valor || '0').replace(/\./g,'').replace(',','.'))) / parseInt(formContrato.num_parcelas))}
              </strong>
            </div>
          )}
          <div className={s.field}>
            <label className={s.label}>Observação</label>
            <textarea className={s.textarea} value={formContrato.observacao} onChange={e => setC('observacao', e.target.value)} rows={2} />
          </div>
          <div className={s.formActions}>
            <Button type="button" variant="secondary" onClick={() => setModalContrato(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" variant="primary" loading={saving}>Registrar Venda</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Proposta */}
      {modalProposta && loteParaProposta && (
        <ModalProposta
          lote={loteParaProposta}
          onClose={() => setModalProposta(false)}
          onSaved={() => {
            setModalProposta(false);
            toast?.success('Proposta salva! Lote marcado como reservado.');
            load();
          }}
        />
      )}

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Excluir Lote" message={`Excluir lote ${deleteTarget?.numero}?`} />
    </div>
  );
}
