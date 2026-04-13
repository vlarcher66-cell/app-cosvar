import CrudPage from '../../components/shared/CrudPage';
import SimpleForm from '../../components/shared/SimpleForm';
import centroCustoService from '../../services/centroCustoService';

const columns = [
  { key: 'id', label: 'ID', width: 60 },
  { key: 'codigo', label: 'Código' },
  { key: 'nome', label: 'Nome' },
];
const fields = [
  { name: 'nome', label: 'Nome', required: true },
  { name: 'codigo', label: 'Código', required: true },
  { name: 'descricao', label: 'Descrição', type: 'textarea' },
];
const Form = (props) => <SimpleForm fields={fields} {...props} />;

export default function CentroCustoPage() {
  return <CrudPage title="Centros de Custo" service={centroCustoService} columns={columns} FormComponent={Form} />;
}
