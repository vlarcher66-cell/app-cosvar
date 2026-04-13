import CrudPage from '../../components/shared/CrudPage';
import SimpleForm from '../../components/shared/SimpleForm';
import projetoService from '../../services/projetoService';

const columns = [
  { key: 'id', label: 'ID', width: 60 },
  { key: 'nome', label: 'Nome' },
  { key: 'data_inicio', label: 'Início' },
  { key: 'data_fim', label: 'Fim' },
  { key: 'status', label: 'Status' },
];
const fields = [
  { name: 'nome', label: 'Nome do Projeto', required: true },
  { name: 'descricao', label: 'Descrição', type: 'textarea' },
  { name: 'data_inicio', label: 'Data Início', type: 'date' },
  { name: 'data_fim', label: 'Data Fim', type: 'date' },
  { name: 'status', label: 'Status', type: 'select', default: 'ativo',
    options: [{ value: 'ativo', label: 'Ativo' }, { value: 'concluido', label: 'Concluído' }, { value: 'cancelado', label: 'Cancelado' }] },
];
const Form = (props) => <SimpleForm fields={fields} {...props} />;

export default function ProjetoPage() {
  return (
    <CrudPage title="Projetos" subtitle="Gestão de projetos" service={projetoService} columns={columns} FormComponent={Form} modalWidth={540} />
  );
}
