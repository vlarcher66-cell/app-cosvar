import { useState, useEffect } from 'react';
import CrudPage from '../../components/shared/CrudPage';
import SimpleForm from '../../components/shared/SimpleForm';
import subgrupoDespesaService from '../../services/subgrupoDespesaService';
import grupoDespesaService from '../../services/grupoDespesaService';

const columns = [
  { key: 'id',         label: 'ID',    width: 60 },
  { key: 'nome',       label: 'Nome' },
  { key: 'grupo_nome', label: 'Grupo' },
];

function Form({ initial, onSave, saving, onCancel }) {
  const [grupos, setGrupos] = useState([]);
  useEffect(() => { grupoDespesaService.getAll().then(setGrupos); }, []);

  const fields = [
    { name: 'nome', label: 'Nome do Subgrupo', required: true },
    {
      name: 'grupo_id', label: 'Grupo', type: 'select', required: true,
      options: grupos.map(g => ({ value: g.id, label: g.nome })),
    },
  ];
  return <SimpleForm fields={fields} initial={initial} onSave={onSave} saving={saving} onCancel={onCancel} />;
}

export default function SubgrupoPage() {
  return (
    <CrudPage
      title="Subgrupos de Despesa"
      subtitle="Subdivisões dentro dos grupos"
      service={subgrupoDespesaService}
      columns={columns}
      FormComponent={Form}
    />
  );
}
