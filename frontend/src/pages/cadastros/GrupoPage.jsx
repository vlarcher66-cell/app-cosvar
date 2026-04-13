import CrudPage from '../../components/shared/CrudPage';
import SimpleForm from '../../components/shared/SimpleForm';
import grupoDespesaService from '../../services/grupoDespesaService';

const columns = [
  { key: 'id',   label: 'ID',   width: 60 },
  { key: 'nome', label: 'Nome' },
];

const fields = [
  { name: 'nome', label: 'Nome do Grupo', required: true, placeholder: 'Ex: Despesas Administrativas' },
];

const Form = (props) => <SimpleForm fields={fields} {...props} />;

export default function GrupoPage() {
  return (
    <CrudPage
      title="Grupos de Despesa"
      subtitle="Categorias principais para classificação de despesas"
      service={grupoDespesaService}
      columns={columns}
      FormComponent={Form}
    />
  );
}
