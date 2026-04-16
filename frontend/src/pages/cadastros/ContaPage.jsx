import { useState, useEffect } from 'react';
import CrudPage from '../../components/shared/CrudPage';
import SimpleForm from '../../components/shared/SimpleForm';
import contaService from '../../services/contaService';
import bancoService from '../../services/bancoService';
import formaPagamentoService from '../../services/formaPagamentoService';
import s from './contas/ContaPage.module.css';

const columns = [
  { key: 'id',         label: 'ID',      width: 60 },
  { key: 'banco_nome', label: 'Banco' },
  { key: 'agencia',    label: 'Agência' },
  { key: 'numero',     label: 'Número' },
  { key: 'tipo',       label: 'Tipo' },
];

function Form({ initial, onSave, saving, onCancel }) {
  const [bancos,       setBancos]       = useState([]);
  const [formas,       setFormas]       = useState([]);
  const [selecionadas, setSelecionadas] = useState([]);

  useEffect(() => {
    bancoService.getAll().then(setBancos);
    formaPagamentoService.getAll().then(setFormas);
  }, []);

  useEffect(() => {
    if (initial?.id) {
      contaService.getFormas(initial.id).then(fs => setSelecionadas(fs.map(f => f.id)));
    } else {
      setSelecionadas([]);
    }
  }, [initial?.id]);

  const toggleForma = (id) => {
    setSelecionadas(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  // Embute _formas nos dados para o service customizado interceptar
  const handleSave = (data) => onSave({ ...data, _formas: selecionadas });

  const fields = [
    { name: 'banco_id', label: 'Banco', type: 'select', required: true,
      options: bancos.map(b => ({ value: b.id, label: b.nome })) },
    { name: 'agencia',       label: 'Agência' },
    { name: 'numero',        label: 'Número', required: true },
    { name: 'tipo', label: 'Tipo', type: 'select', default: 'corrente',
      options: [
        { value: 'corrente',     label: 'Corrente' },
        { value: 'poupanca',     label: 'Poupança' },
        { value: 'investimento', label: 'Investimento' },
        { value: 'caixa',        label: 'Caixa' },
      ] },
    { name: 'saldo_inicial', label: 'Saldo Inicial', type: 'number', default: '0' },
  ];

  return (
    <div>
      <SimpleForm fields={fields} initial={initial} onSave={handleSave} saving={saving} onCancel={onCancel} />
      {formas.length > 0 && (
        <div className={s.formasSection}>
          <div className={s.formasTitle}>Formas de pagamento aceitas</div>
          <div className={s.formasList}>
            {formas.map(f => (
              <button
                key={f.id}
                type="button"
                className={`${s.formaChip} ${selecionadas.includes(f.id) ? s.formaChipOn : ''}`}
                onClick={() => toggleForma(f.id)}
              >
                {selecionadas.includes(f.id) && <span className={s.chipCheck}>✓</span>}
                {f.nome}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Service customizado que intercepta create/update para salvar formas também
const contaServiceCustom = {
  ...contaService,
  create: async ({ _formas, ...data }) => {
    const id = await contaService.create(data);
    await contaService.setFormas(id, _formas || []);
    return id;
  },
  update: async (id, { _formas, ...data }) => {
    await contaService.update(id, data);
    await contaService.setFormas(id, _formas || []);
  },
};

export default function ContaPage() {
  return (
    <CrudPage
      title="Contas"
      subtitle="Contas bancárias e caixas"
      service={contaServiceCustom}
      columns={columns}
      FormComponent={Form}
    />
  );
}
