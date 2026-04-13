import CrudPage from '../../components/shared/CrudPage';
import SimpleForm from '../../components/shared/SimpleForm';
import produtorService from '../../services/produtorService';

const columns = [
  { key: 'id',        label: 'ID',       width: 60 },
  { key: 'nome',      label: 'Nome' },
  { key: 'documento', label: 'Documento' },
  { key: 'contato',   label: 'Contato' },
];

const fields = [
  { name: 'nome',      label: 'Nome',          required: true },
  { name: 'documento', label: 'CPF / CNPJ' },
  { name: 'contato',   label: 'Contato (Tel/Email)' },
  { name: 'endereco',  label: 'Endereço' },
];

const Form = (props) => <SimpleForm fields={fields} {...props} />;

export default function ProdutorPage() {
  return (
    <CrudPage title="Produtores" subtitle="Cadastro de produtores" service={produtorService} columns={columns} FormComponent={Form} />
  );
}
