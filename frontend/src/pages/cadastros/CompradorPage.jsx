import CrudPage from '../../components/shared/CrudPage';
import SimpleForm from '../../components/shared/SimpleForm';
import compradorService from '../../services/compradorService';

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
];
const Form = (props) => <SimpleForm fields={fields} {...props} />;

export default function CompradorPage() {
  return <CrudPage title="Compradores" service={compradorService} columns={columns} FormComponent={Form} />;
}
