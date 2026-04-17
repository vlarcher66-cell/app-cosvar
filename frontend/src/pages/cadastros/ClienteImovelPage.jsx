import CrudPage from '../../components/shared/CrudPage';
import SimpleForm from '../../components/shared/SimpleForm';
import clienteImovelService from '../../services/clienteImovelService';

const columns = [
  { key: 'nome',     label: 'Nome' },
  { key: 'cpf_cnpj', label: 'CPF / CNPJ' },
  { key: 'telefone', label: 'Telefone' },
  { key: 'email',    label: 'E-mail' },
];

const fields = [
  { name: 'nome',      label: 'Nome',      required: true },
  { name: 'cpf_cnpj',  label: 'CPF / CNPJ' },
  { name: 'telefone',  label: 'Telefone' },
  { name: 'email',     label: 'E-mail' },
  { name: 'endereco',  label: 'Endereço' },
  { name: 'observacao', label: 'Observação' },
];

const Form = (props) => <SimpleForm fields={fields} {...props} />;

export default function ClienteImovelPage() {
  return (
    <CrudPage
      title="Clientes — Imobiliária"
      service={clienteImovelService}
      columns={columns}
      FormComponent={Form}
    />
  );
}
