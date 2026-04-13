import { useState, useEffect } from 'react';
import dashboardService from '../../services/dashboardService';
import { formatCurrency } from '../../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import s from './Dashboard.module.css';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const COLORS = ['#4f8ef7','#2ecc8a','#f0b93a','#f05b5b','#a78bfa','#38bdf8','#fb923c'];

/* ── Ícones SVG ── */
const IconArrowUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
);
const IconArrowDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
  </svg>
);
const IconBalance = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const KPI_ICONS = {
  success_up:   <IconArrowUp />,
  danger_down:  <IconArrowDown />,
  balance:      <IconBalance />,
  pending:      <IconClock />,
  paid:         <IconCheck />,
};

export default function Dashboard() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dashboardService.getResumo({ mes, ano })
      .then(setData)
      .finally(() => setLoading(false));
  }, [mes, ano]);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Dashboard</h1>
          <p className={s.sub}>Visão geral financeira</p>
        </div>
        <div className={s.filters}>
          <select className={s.select} value={mes} onChange={e => setMes(+e.target.value)}>
            {MESES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className={s.select} value={ano} onChange={e => setAno(+e.target.value)}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading || !data ? (
        <div className={s.loading}><span className={s.spinner} /></div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className={s.kpis}>
            <KpiCard label="Total Receitas"      value={data.totalReceitas}  color="success" icon={<IconArrowUp />} />
            <KpiCard label="Total Despesas"      value={data.totalDespesas}  color="danger"  icon={<IconArrowDown />} />
            <KpiCard label="Saldo"               value={data.saldo}          color={data.saldo >= 0 ? 'accent' : 'danger'} icon={<IconBalance />} />
            <KpiCard label="Receitas Pendentes"  value={data.recPendentes}   color="warning" icon={<IconClock />} />
            <KpiCard label="Despesas Pendentes"  value={data.despPendentes}  color="warning" icon={<IconClock />} />
            <KpiCard label="Despesas Pagas"      value={data.despPagas}      color="success" icon={<IconCheck />} />
          </div>

          {/* Charts */}
          <div className={s.charts}>
            <div className={s.chartBox}>
              <h3 className={s.chartTitle}>Despesas por Grupo</h3>
              {data.despPorGrupo.length === 0 ? (
                <p className={s.empty}>Sem dados no período</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.despPorGrupo} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <XAxis dataKey="grupo" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 8, color: '#111827', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="total" fill="#1d4ed8" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className={s.chartBox}>
              <h3 className={s.chartTitle}>Receitas vs Despesas</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Receitas', value: data.totalReceitas || 0.001 },
                      { name: 'Despesas', value: data.totalDespesas || 0.001 },
                    ]}
                    cx="50%" cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    <Cell fill="#059669" />
                    <Cell fill="#dc2626" />
                  </Pie>
                  <Legend formatter={(v) => <span style={{ color: '#6b7280', fontSize: 12 }}>{v}</span>} />
                  <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 8, color: '#111827', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, color, icon }) {
  return (
    <div className={`${s.kpi} ${s[`kpi_${color}`]}`}>
      <div className={s.kpiBody}>
        <div className={s.kpiIcon}>{icon}</div>
        <div className={s.kpiText}>
          <div className={s.kpiValue}>{formatCurrency(value)}</div>
          <div className={s.kpiLabel}>{label}</div>
        </div>
      </div>
    </div>
  );
}
