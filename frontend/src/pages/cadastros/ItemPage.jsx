import { useState, useEffect } from 'react';
import CrudPage from '../../components/shared/CrudPage';
import SimpleForm from '../../components/shared/SimpleForm';
import itemDespesaService from '../../services/itemDespesaService';
import subgrupoDespesaService from '../../services/subgrupoDespesaService';

const columns = [
  { key: 'id',             label: 'ID',      width: 60 },
  { key: 'nome',           label: 'Nome' },
  { key: 'subgrupo_nome',  label: 'Subgrupo' },
  { key: 'grupo_nome',     label: 'Grupo' },
];

function Form({ initial, onSave, saving, onCancel }) {
  const [subgrupos, setSubgrupos] = useState([]);
  useEffect(() => { subgrupoDespesaService.getAll().then(setSubgrupos); }, []);
  const fields = [
    { name: 'nome', label: 'Nome do Item', required: true },
    { name: 'subgrupo_id', label: 'Subgrupo', type: 'select', required: true,
      options: subgrupos.map(s => ({ value: s.id, label: `${s.grupo_nome || ''} › ${s.nome}` })) },
  ];
  return <SimpleForm fields={fields} initial={initial} onSave={onSave} saving={saving} onCancel={onCancel} />;
}

export default function ItemPage() {
  return (
    <CrudPage
      title="Itens de Despesa"
      subtitle="Itens específicos dentro dos subgrupos"
      service={itemDespesaService}
      columns={columns}
      FormComponent={Form}
    />
  );
}
