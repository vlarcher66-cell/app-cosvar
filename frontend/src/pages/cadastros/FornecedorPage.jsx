import CrudPage from '../../components/shared/CrudPage';
import SimpleForm from '../../components/shared/SimpleForm';
import fornecedorService from '../../services/fornecedorService';

const columns = [
  { key: 'id', label: 'ID', width: 60 },
  { key: 'nome', label: 'Nome' },
  { key: 'documento', label: 'Documento' },
  { key: 'contato', label: 'Contato' },
];
const fields = [
  { name: 'nome', label: 'Nome', required: true },
  { name: 'documento', label: 'CPF / CNPJ' },
  { name: 'contato', label: 'Contato' },
  { name: 'endereco', label: 'Endereço' },
];
const Form = (props) => <SimpleForm fields={fields} {...props} />;

export default function FornecedorPage() {
  return <CrudPage title="Fornecedores" service={fornecedorService} columns={columns} FormComponent={Form} />;
}
