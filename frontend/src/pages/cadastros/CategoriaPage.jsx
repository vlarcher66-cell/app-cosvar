import CrudPage from '../../components/shared/CrudPage';
import SimpleForm from '../../components/shared/SimpleForm';
import categoriaReceitaService from '../../services/categoriaReceitaService';

const columns = [
  { key: 'id',   label: 'ID',   width: 60 },
  { key: 'nome', label: 'Nome' },
  { key: 'tipo', label: 'Tipo' },
];

const fields = [
  { name: 'nome', label: 'Nome da Categoria', required: true },
  { name: 'tipo', label: 'Tipo', required: true, placeholder: 'Ex: Venda, Serviço, etc.' },
];

const Form = (props) => <SimpleForm fields={fields} {...props} />;

export default function CategoriaPage() {
  return (
    <CrudPage
      title="Categorias de Receita"
      subtitle="Classificação das receitas"
      service={categoriaReceitaService}
      columns={columns}
      FormComponent={Form}
    />
  );
}
