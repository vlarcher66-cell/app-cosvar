import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import Landing        from './pages/landing/Landing';
import Login          from './pages/auth/Login';
import Dashboard      from './pages/dashboard/Dashboard';
import DespesaPage       from './pages/financeiro/DespesaPage';
import ReceitaPage       from './pages/financeiro/ReceitaPage';
import ConciliacaoPage   from './pages/financeiro/ConciliacaoPage';
import RelatoriosPage    from './pages/relatorios/RelatoriosPage';
import ProducaoCacauPage from './pages/cacau/ProducaoCacauPage';
import CacauOrdemPage    from './pages/cacau/CacauOrdemPage';

// Cadastros
import GrupoPage       from './pages/cadastros/GrupoPage';
import SubgrupoPage    from './pages/cadastros/SubgrupoPage';
import ItemPage        from './pages/cadastros/ItemPage';
import CategoriaPage   from './pages/cadastros/CategoriaPage';
import DescricaoPage   from './pages/cadastros/DescricaoPage';
import ProdutorPage    from './pages/cadastros/ProdutorPage';
import FornecedorPage  from './pages/cadastros/FornecedorPage';
import CompradorPage   from './pages/cadastros/CompradorPage';
import ProjetoPage     from './pages/cadastros/ProjetoPage';
import CentroCustoPage from './pages/cadastros/CentroCustoPage';
import BancoPage       from './pages/cadastros/BancoPage';
import ContaPage       from './pages/cadastros/ContaPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Públicas */}
          <Route path="/"      element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* Protegidas */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard"               element={<Dashboard />} />
            <Route path="/despesas"                element={<DespesaPage />} />
            <Route path="/receitas"                element={<ReceitaPage />} />
            <Route path="/conciliacao"             element={<ConciliacaoPage />} />
            <Route path="/relatorios"              element={<RelatoriosPage />} />
            <Route path="/cacau/producao"          element={<ProducaoCacauPage />} />
            <Route path="/cacau/ordens"            element={<CacauOrdemPage />} />

            {/* Cadastros */}
            <Route path="/cadastros/grupos"        element={<GrupoPage />} />
            <Route path="/cadastros/subgrupos"     element={<SubgrupoPage />} />
            <Route path="/cadastros/itens"         element={<ItemPage />} />
            <Route path="/cadastros/categorias"    element={<CategoriaPage />} />
            <Route path="/cadastros/descricoes"    element={<DescricaoPage />} />
            <Route path="/cadastros/produtores"    element={<ProdutorPage />} />
            <Route path="/cadastros/fornecedores"  element={<FornecedorPage />} />
            <Route path="/cadastros/compradores"   element={<CompradorPage />} />
            <Route path="/cadastros/projetos"      element={<ProjetoPage />} />
            <Route path="/cadastros/centros-custo" element={<CentroCustoPage />} />
            <Route path="/cadastros/bancos"        element={<BancoPage />} />
            <Route path="/cadastros/contas"        element={<ContaPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
