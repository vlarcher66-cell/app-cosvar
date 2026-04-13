import { useState, useEffect } from 'react';
import CrudPage from '../../components/shared/CrudPage';
import SimpleForm from '../../components/shared/SimpleForm';
import descricaoReceitaService from '../../services/descricaoReceitaService';
import categoriaReceitaService from '../../services/categoriaReceitaService';

const columns = [
  { key: 'id',             label: 'ID',       width: 60 },
  { key: 'nome',           label: 'Nome' },
  { key: 'categoria_nome', label: 'Categoria' },
];

function Form({ initial, onSave, saving, onCancel }) {
  const [categorias, setCategorias] = useState([]);
  useEffect(() => { categoriaReceitaService.getAll().then(setCategorias); }, []);
  const fields = [
    { name: 'nome', label: 'Descrição', required: true },
    { name: 'categoria_id', label: 'Categoria', type: 'select', required: true,
      options: categorias.map(c => ({ value: c.id, label: c.nome })) },
  ];
  return <SimpleForm fields={fields} initial={initial} onSave={onSave} saving={saving} onCancel={onCancel} />;
}

export default function DescricaoPage() {
  return (
    <CrudPage
      title="Descrições de Receita"
      subtitle="Tipos específicos dentro das categorias"
      service={descricaoReceitaService}
      columns={columns}
      FormComponent={Form}
    />
  );
}
