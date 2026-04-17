import { useState } from 'react';
import Modal from '../ui/Modal';
import DateInput from '../ui/DateInput';
import propostaLoteService from '../../services/propostaLoteService';
import { formatCurrency } from '../../utils/formatters';
import s from './ModalFecharNegocio.module.css';

export default function ModalFecharNegocio({ proposta, onClose, onContratoCriado }) {
  const [opcaoIdx,    setOpcaoIdx]    = useState(null);
  const [dataContrato, setDataContrato] = useState(new Date().toISOString().slice(0, 10));
  const [entradaData,  setEntradaData]  = useState('');
  const [diaVenc,      setDiaVenc]      = useState('10');
  const [saving,       setSaving]       = useState(false);

  if (!proposta) return null;

  const parcelas = typeof proposta.parcelas_json === 'string'
    ? JSON.parse(proposta.parcelas_json)
    : proposta.parcelas_json || [];

  // Separa à vista das parcelas
  const optAvista    = parcelas.find(p => p.avista);
  const optParcelas  = parcelas.filter(p => !p.avista);

  const fmt = (v) => formatCurrency(v);

  const handleConfirmar = async () => {
    if (opcaoIdx === null) return alert('Escolha uma forma de pagamento');
    setSaving(true);
    try {
      const res = await propostaLoteService.aprovar(proposta.id, {
        data_contrato:  dataContrato,
        entrada_data:   entradaData || null,
        dia_vencimento: parseInt(diaVenc) || 10,
        opcao_idx:      opcaoIdx,
      });
      onContratoCriado?.(res.data?.contrato_id);
    } catch (err) {
      alert(err?.response?.data?.message || 'Erro ao criar contrato');
    } finally { setSaving(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title="Fechar Negócio — Gerar Contrato" width={520}>
      <div className={s.wrap}>

        {/* Resumo do cliente e imóvel */}
        <div className={s.resumo}>
          <div className={s.resumoRow}><span>Cliente</span><strong>{proposta.cliente_nome || '—'}</strong></div>
          <div className={s.resumoRow}><span>Valor do Imóvel</span><strong>{fmt(proposta.valor_total)}</strong></div>
          {proposta.entrada_valor > 0 && (
            <div className={s.resumoRow}><span>Entrada ({proposta.entrada_pct}%)</span><strong>{fmt(proposta.entrada_valor)}</strong></div>
          )}
        </div>

        {/* Escolha da forma de pagamento */}
        <div className={s.secaoTitulo}>Escolha a Forma de Pagamento</div>
        <div className={s.opcoes}>

          {/* À Vista */}
          {optAvista && (
            <div
              className={`${s.opcaoCard} ${opcaoIdx === 0 ? s.opcaoSelecionada : ''}`}
              onClick={() => setOpcaoIdx(0)}
            >
              <div className={s.opcaoRadio}>
                <div className={`${s.radio} ${opcaoIdx === 0 ? s.radioAtivo : ''}`} />
              </div>
              <div className={s.opcaoInfo}>
                <div className={s.opcaoLabel}>À Vista</div>
                <div className={s.opcaoDesc} style={{ color: '#10b981' }}>
                  {proposta.desconto_avista_pct}% de desconto
                </div>
              </div>
              <div className={s.opcaoValor} style={{ color: '#10b981' }}>
                {fmt(optAvista.pmt)}
              </div>
            </div>
          )}

          {/* Parcelamentos */}
          {optParcelas.map((op, i) => {
            const idx = i + 1; // índice no array original (0 = avista)
            return (
              <div
                key={i}
                className={`${s.opcaoCard} ${opcaoIdx === idx ? s.opcaoSelecionada : ''}`}
                onClick={() => setOpcaoIdx(idx)}
              >
                <div className={s.opcaoRadio}>
                  <div className={`${s.radio} ${opcaoIdx === idx ? s.radioAtivo : ''}`} />
                </div>
                <div className={s.opcaoInfo}>
                  <div className={s.opcaoLabel}>{op.n}x de {fmt(op.pmt)}</div>
                  <div className={s.opcaoDesc}>
                    {op.taxa === 0
                      ? <span style={{ color: '#10b981' }}>SEM JUROS</span>
                      : <span>{String(op.taxa.toFixed(2)).replace('.', ',')}% a.m.</span>}
                    {' · '}Total: {fmt(op.pmt * op.n + (proposta.entrada_valor || 0))}
                  </div>
                </div>
                <div className={s.opcaoValor}>{fmt(op.pmt)}<span>/mês</span></div>
              </div>
            );
          })}
        </div>

        {/* Dados do contrato */}
        <div className={s.secaoTitulo}>Dados do Contrato</div>
        <div className={s.fields}>
          <div className={s.field}>
            <label>Data do Contrato *</label>
            <DateInput className={s.input} value={dataContrato} onChange={e => setDataContrato(e.target.value)} />
          </div>
          <div className={s.field}>
            <label>Data da Entrada</label>
            <DateInput className={s.input} value={entradaData} onChange={e => setEntradaData(e.target.value)} />
          </div>
          <div className={s.field}>
            <label>Dia Vencimento</label>
            <input type="number" className={s.input} min="1" max="28" value={diaVenc} onChange={e => setDiaVenc(e.target.value)} />
          </div>
        </div>

        <div className={s.actions}>
          <button className={s.btnCancel} onClick={onClose} disabled={saving}>Cancelar</button>
          <button className={s.btnConfirmar} onClick={handleConfirmar} disabled={saving || opcaoIdx === null}>
            {saving ? 'Gerando...' : '✓ Confirmar e Gerar Contrato'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
