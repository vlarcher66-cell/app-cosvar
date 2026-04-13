import { useState, useEffect } from 'react';
import CrudPage from '../../components/shared/CrudPage';
import SimpleForm from '../../components/shared/SimpleForm';
import contaService from '../../services/contaService';
import bancoService from '../../services/bancoService';

const columns = [
  { key: 'id', label: 'ID', width: 60 },
  { key: 'banco_nome', label: 'Banco' },
  { key: 'agencia', label: 'Agência' },
  { key: 'numero', label: 'Número' },
  { key: 'tipo', label: 'Tipo' },
];

function Form({ initial, onSave, saving, onCancel }) {
  const [bancos, setBancos] = useState([]);
  useEffect(() => { bancoService.getAll().then(setBancos); }, []);
  const fields = [
    { name: 'banco_id', label: 'Banco', type: 'select', required: true,
      options: bancos.map(b => ({ value: b.id, label: b.nome })) },
    { name: 'agencia', label: 'Agência' },
    { name: 'numero', label: 'Número', required: true },
    { name: 'tipo', label: 'Tipo', type: 'select', default: 'corrente',
      options: [
        { value: 'corrente', label: 'Corrente' },
        { value: 'poupanca', label: 'Poupança' },
        { value: 'investimento', label: 'Investimento' },
        { value: 'caixa', label: 'Caixa' },
      ] },
    { name: 'saldo_inicial', label: 'Saldo Inicial', type: 'number', default: '0' },
  ];
  return <SimpleForm fields={fields} initial={initial} onSave={onSave} saving={saving} onCancel={onCancel} />;
}

export default function ContaPage() {
  return <CrudPage title="Contas" subtitle="Contas bancárias e caixas" service={contaService} columns={columns} FormComponent={Form} />;
}
