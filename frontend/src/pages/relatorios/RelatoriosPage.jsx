import s from './RelatoriosPage.module.css';

const relatorios = [
  { icon: '◈', title: 'Análise por Grupo', desc: 'Totais de despesas agrupados por grupo no período selecionado.' },
  { icon: '◉', title: 'Análise por Subgrupo', desc: 'Detalhamento por subgrupo com percentuais e totais.' },
  { icon: '↓', title: 'Despesas em Aberto', desc: 'Todas as despesas com status pendente.' },
  { icon: '↑', title: 'Receitas Aportadas', desc: 'Receitas com status recebido no período.' },
];

export default function RelatoriosPage() {
  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Relatórios</h1>
        <p className={s.sub}>Análises financeiras e exportações</p>
      </div>
      <div className={s.grid}>
        {relatorios.map((r) => (
          <div key={r.title} className={s.card}>
            <div className={s.cardIcon}>{r.icon}</div>
            <div>
              <h3 className={s.cardTitle}>{r.title}</h3>
              <p className={s.cardDesc}>{r.desc}</p>
            </div>
            <button className={s.cardBtn}>Gerar</button>
          </div>
        ))}
      </div>
      <div className={s.notice}>
        <span>ℹ</span>
        <p>Os relatórios em PDF podem ser gerados integrando a biblioteca <code>pdfkit</code> ou <code>puppeteer</code> no backend (<code>/api/relatorios</code>).</p>
      </div>
    </div>
  );
}
