import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import empreendimentoService from '../../services/empreendimentoService';
import compradorService from '../../services/compradorService';
import contratoLoteService from '../../services/contratoLoteService';
import { useGlobalToast } from '../../components/layout/MainLayout';
import CurrencyInput from '../../components/shared/CurrencyInput';
import s from './ContratoFormPage.module.css';

const parseMoney = v => parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0;

export default function ContratoFormPage() {
  const toast    = useGlobalToast();
  const navigate = useNavigate();

  const [empreendimentos, setEmpreendimentos] = useState([]);
  const [quadras,         setQuadras]         = useState([]);
  const [lotes,           setLotes]           = useState([]);
  const [compradores,     setCompradores]      = useState([]);
  const [saving,          setSaving]           = useState(false);

  const [form, setForm] = useState({
    empreendimento_id: '',
    quadra_id:         '',
    lote_id:           '',
    comprador_id:      '',
    data_contrato:     new Date().toISOString().slice(0, 10),
    valor_total:       '',
    entrada_valor:     '',
    entrada_data:      '',
    num_parcelas:      12,
    dia_vencimento:    10,
    observacao:        '',
  });

  useEffect(() => {
    empreendimentoService.getAll().then(setEmpreendimentos);
    compradorService.getAll().then(setCompradores);
  }, []);

  // Quando muda empreendimento, carrega quadras e lotes
  useEffect(() => {
    if (!form.empreendimento_id) { setQuadras([]); setLotes([]); return; }
    empreendimentoService.getLotes(form.empreendimento_id).then(data => {
      // Agrupa por quadra
      const qMap = {};
      data.forEach(l => {
        if (!qMap[l.quadra_id]) qMap[l.quadra_id] = { id: l.quadra_id, nome: l.quadra_nome, lotes: [] };
        if (l.status === 'disponivel') qMap[l.quadra_id].lotes.push(l);
      });
      setQuadras(Object.values(qMap).filter(q => q.lotes.length > 0));
      setLotes([]);
    });
    setForm(p => ({ ...p, quadra_id: '', lote_id: '' }));
  }, [form.empreendimento_id]);

  // Quando muda quadra, filtra lotes disponíveis
  useEffect(() => {
    if (!form.quadra_id) { setLotes([]); return; }
    const q = quadras.find(q => q.id === Number(form.quadra_id));
    setLotes(q ? q.lotes : []);
    setForm(p => ({ ...p, lote_id: '' }));
  }, [form.quadra_id]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Preview parcelas
  const valorTotal  = parseMoney(form.valor_total);
  const valorEntrada = parseMoney(form.entrada_valor);
  const valorParcelas = valorTotal - valorEntrada;
  const numParcelas  = parseInt(form.num_parcelas) || 0;
  const valorParcela = numParcelas > 0 ? valorParcelas / numParcelas : 0;

  const fmt = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.lote_id)       return toast?.error('Selecione um lote');
    if (!form.comprador_id)  return toast?.error('Selecione um comprador');
    if (!form.valor_total)   return toast?.error('Informe o valor total');
    if (!form.num_parcelas)  return toast?.error('Informe o número de parcelas');
    setSaving(true);
    try {
      await contratoLoteService.create({
        ...form,
        valor_total:   parseMoney(form.valor_total),
        entrada_valor: parseMoney(form.entrada_valor),
      });
      toast?.success('Contrato criado com sucesso!');
      navigate('/imoveis/contratos');
    } catch (err) {
      toast?.error(err?.response?.data?.message || 'Erro ao criar contrato');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <button className={s.btnBack} onClick={() => navigate('/imoveis/contratos')}>← Voltar</button>
        <h1 className={s.title}>Novo Contrato</h1>
      </div>

      <motion.form className={s.card} onSubmit={handleSubmit} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>

        <div className={s.section}>
          <div className={s.sectionTitle}>Lote</div>
          <div className={s.row3}>
            <div className={s.field}>
              <label>Empreendimento</label>
              <select value={form.empreendimento_id} onChange={e => set('empreendimento_id', e.target.value)} required>
                <option value="">Selecione...</option>
                {empreendimentos.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </div>
            <div className={s.field}>
              <label>Quadra</label>
              <select value={form.quadra_id} onChange={e => set('quadra_id', e.target.value)} required disabled={!quadras.length}>
                <option value="">Selecione...</option>
                {quadras.map(q => <option key={q.id} value={q.id}>Quadra {q.nome} ({q.lotes.length} disponíveis)</option>)}
              </select>
            </div>
            <div className={s.field}>
              <label>Lote</label>
              <select value={form.lote_id} onChange={e => set('lote_id', e.target.value)} required disabled={!lotes.length}>
                <option value="">Selecione...</option>
                {lotes.map(l => <option key={l.id} value={l.id}>Lote {l.numero}{l.area ? ` — ${l.area}m²` : ''}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className={s.section}>
          <div className={s.sectionTitle}>Comprador</div>
          <div className={s.row2}>
            <div className={s.field}>
              <label>Comprador</label>
              <select value={form.comprador_id} onChange={e => set('comprador_id', e.target.value)} required>
                <option value="">Selecione...</option>
                {compradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className={s.field}>
              <label>Data do Contrato</label>
              <input type="date" value={form.data_contrato} onChange={e => set('data_contrato', e.target.value)} required />
            </div>
          </div>
        </div>

        <div className={s.section}>
          <div className={s.sectionTitle}>Valores e Parcelas</div>
          <div className={s.row3}>
            <div className={s.field}>
              <label>Valor Total</label>
              <CurrencyInput value={form.valor_total} onChange={v => set('valor_total', v)} placeholder="0,00" required />
            </div>
            <div className={s.field}>
              <label>Entrada (R$)</label>
              <CurrencyInput value={form.entrada_valor} onChange={v => set('entrada_valor', v)} placeholder="0,00" />
            </div>
            <div className={s.field}>
              <label>Data da Entrada</label>
              <input type="date" value={form.entrada_data} onChange={e => set('entrada_data', e.target.value)} />
            </div>
          </div>
          <div className={s.row3}>
            <div className={s.field}>
              <label>Nº de Parcelas</label>
              <input type="number" min="1" max="360" value={form.num_parcelas} onChange={e => set('num_parcelas', e.target.value)} required />
            </div>
            <div className={s.field}>
              <label>Dia de Vencimento</label>
              <input type="number" min="1" max="28" value={form.dia_vencimento} onChange={e => set('dia_vencimento', e.target.value)} required />
            </div>
            <div className={s.field}>
              <label>Observação</label>
              <input type="text" value={form.observacao} onChange={e => set('observacao', e.target.value)} placeholder="Opcional" />
            </div>
          </div>
        </div>

        {valorTotal > 0 && numParcelas > 0 && (
          <div className={s.preview}>
            <div className={s.previewItem}><span>Valor total</span><strong>{fmt(valorTotal)}</strong></div>
            {valorEntrada > 0 && <div className={s.previewItem}><span>Entrada</span><strong>{fmt(valorEntrada)}</strong></div>}
            <div className={s.previewItem}><span>Valor a parcelar</span><strong>{fmt(valorParcelas)}</strong></div>
            <div className={s.previewItem}><span>{numParcelas}x de</span><strong style={{ color: '#6366f1' }}>{fmt(valorParcela)}</strong></div>
          </div>
        )}

        <div className={s.footer}>
          <button type="button" className={s.btnCancel} onClick={() => navigate('/imoveis/contratos')}>Cancelar</button>
          <button type="submit" className={s.btnSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Criar Contrato'}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
