import CrudPage from '../../components/shared/CrudPage';
import SimpleForm from '../../components/shared/SimpleForm';
import bancoService from '../../services/bancoService';

const columns = [
  { key: 'id', label: 'ID', width: 60 },
  { key: 'codigo', label: 'Código' },
  { key: 'nome', label: 'Nome' },
];
const fields = [
  { name: 'nome', label: 'Nome do Banco', required: true },
  { name: 'codigo', label: 'Código (ex: 001)' },
];
const Form = (props) => <SimpleForm fields={fields} {...props} />;

export default function BancoPage() {
  return <CrudPage title="Bancos" service={bancoService} columns={columns} FormComponent={Form} />;
}
