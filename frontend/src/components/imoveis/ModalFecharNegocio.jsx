import { useState } from 'react';
import Modal from '../ui/Modal';
import propostaLoteService from '../../services/propostaLoteService';
import { formatCurrency } from '../../utils/formatters';
import s from './ModalFecharNegocio.module.css';

export default function ModalFecharNegocio({ proposta, onClose, onContratoCriado }) {
  const [dataContrato, setDataContrato] = useState(new Date().toISOString().slice(0, 10));
  const [entradaData,  setEntradaData]  = useState('');
  const [diaVenc,      setDiaVenc]      = useState('10');
  const [saving,       setSaving]       = useState(false);

  if (!proposta) return null;

  const parcelas = typeof proposta.parcelas_json === 'string'
    ? JSON.parse(proposta.parcelas_json)
    : proposta.parcelas_json || [];

  // Determina opção escolhida: usa opcao_escolhida salva ou primeiro parcelamento
  const opcaoIdx = proposta.opcao_escolhida != null ? Number(proposta.opcao_escolhida) : null;
  const opcaoLabel = (() => {
    if (opcaoIdx === 'avista' || opcaoIdx === 0) {
      const av = parcelas.find(p => p.avista);
      return av ? `À Vista — ${formatCurrency(av.pmt)}` : 'À Vista';
    }
    const op = parcelas[typeof opcaoIdx === 'number' ? opcaoIdx : 1];
    if (!op) return '—';
    return op.avista
      ? `À Vista — ${formatCurrency(op.pmt)}`
      : `${op.n}x de ${formatCurrency(op.pmt)}${op.taxa > 0 ? ` (${op.taxa}% a.m.)` : ' SEM JUROS'}`;
  })();

  // Parcela escolhida para exibir num_parcelas e taxa
  const parcelaEscolhida = (() => {
    if (opcaoIdx == null) return parcelas.find(p => !p.avista) || parcelas[0];
    return parcelas[typeof opcaoIdx === 'number' ? opcaoIdx : 0] || parcelas[0];
  })();

  const handleConfirmar = async () => {
    setSaving(true);
    try {
      const res = await propostaLoteService.aprovar(proposta.id, {
        data_contrato:  dataContrato,
        entrada_data:   entradaData || null,
        dia_vencimento: parseInt(diaVenc) || 10,
        opcao_idx:      typeof opcaoIdx === 'number' ? opcaoIdx : 0,
      });
      onContratoCriado?.(res.data?.contrato_id);
    } catch (err) {
      alert(err?.response?.data?.message || 'Erro ao criar contrato');
    } finally { setSaving(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title="Fechar Negócio — Gerar Contrato" width={480}>
      <div className={s.wrap}>

        <div className={s.resumo}>
          <div className={s.resumoTitulo}>Resumo da Proposta</div>
          <div className={s.resumoRow}><span>Cliente</span><strong>{proposta.cliente_nome || '—'}</strong></div>
          <div className={s.resumoRow}><span>Valor Total</span><strong>{formatCurrency(proposta.valor_total)}</strong></div>
          {proposta.entrada_valor > 0 && (
            <div className={s.resumoRow}><span>Entrada</span><strong>{formatCurrency(proposta.entrada_valor)}</strong></div>
          )}
          <div className={s.resumoRow}><span>Forma escolhida</span><strong className={s.opcao}>{opcaoLabel}</strong></div>
        </div>

        <div className={s.fields}>
          <div className={s.field}>
            <label>Data do Contrato *</label>
            <input type="date" className={s.input} value={dataContrato} onChange={e => setDataContrato(e.target.value)} />
          </div>
          <div className={s.field}>
            <label>Data da Entrada</label>
            <input type="date" className={s.input} value={entradaData} onChange={e => setEntradaData(e.target.value)} />
          </div>
          <div className={s.field}>
            <label>Dia de Vencimento das Parcelas</label>
            <input type="number" className={s.input} min="1" max="28" value={diaVenc} onChange={e => setDiaVenc(e.target.value)} />
          </div>
        </div>

        <div className={s.aviso}>
          As parcelas serão geradas automaticamente com base na opção escolhida na proposta.
        </div>

        <div className={s.actions}>
          <button className={s.btnCancel} onClick={onClose} disabled={saving}>Cancelar</button>
          <button className={s.btnConfirmar} onClick={handleConfirmar} disabled={saving}>
            {saving ? 'Gerando...' : '✓ Confirmar e Gerar Contrato'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
