import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactApexChart from 'react-apexcharts';
import dashboardService from '../../services/dashboardService';
import { formatCurrency } from '../../utils/formatters';
import s from './Dashboard.module.css';

const MESES_ABR = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
const APEX_COLORS = ['#1e3a5f','#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];

/* ── Ícones ── */
const IcoReceita   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const IcoDespesa   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>;
const IcoSaldo     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IcoClock     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcoCheck     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoWarning   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoCacau     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/></svg>;
const IcoHome      = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IcoChart     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const IcoAlert     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

const fadeUp = { hidden: { opacity: 0, y: 18 }, visible: i => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35, ease: [0.22,1,0.36,1] } }) };

function RptHeader({ icon, title, sub, badge }) {
  return (
    <div className={s.rptHeader}>
      <div className={s.rptHeaderLeft}>
        <span className={s.rptHeaderIcon}>{icon}</span>
        <div>
          <div className={s.rptTitle}>{title}</div>
          {sub && <div className={s.rptSub}>{sub}</div>}
        </div>
      </div>
      {badge && <div className={s.rptBadge}>{badge}</div>}
    </div>
  );
}

function KpiCard({ label, value, icon, color, sub, i }) {
  return (
    <motion.div className={`${s.kpi} ${s[`kpi_${color}`]}`} custom={i} variants={fadeUp} initial="hidden" animate="visible">
      <div className={s.kpiAccent} />
      <div className={s.kpiIcon}>{icon}</div>
      <div className={s.kpiBody}>
        <div className={s.kpiValue}>{value}</div>
        <div className={s.kpiLabel}>{label}</div>
        {sub && <div className={s.kpiSub}>{sub}</div>}
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dashboardService.getResumo({ mes, ano }).then(setData).finally(() => setLoading(false));
  }, [mes, ano]);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const fmtBRL = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  // ── helpers de gráfico ──
  const mesLabel = i => MESES_ABR[i - 1] || MESES_ABR[i];

  const areaOpts = (series, colors) => ({
    chart: { type: 'area', toolbar: { show: false }, background: 'transparent', fontFamily: 'inherit', animations: { speed: 500 }, zoom: { enabled: false } },
    colors,
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.25, opacityTo: 0.02, stops: [0,100] } },
    stroke: { curve: 'smooth', width: 2 },
    dataLabels: { enabled: false },
    xaxis: { categories: MESES_ABR, labels: { style: { colors: '#64748b', fontSize: '10px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { formatter: v => v >= 1000 ? `R$${(v/1000).toFixed(0)}k` : `R$${v}`, style: { colors: '#64748b', fontSize: '10px' } } },
    grid: { borderColor: '#e2e8f0', strokeDashArray: 3 },
    legend: { position: 'top', horizontalAlign: 'left', labels: { colors: '#64748b' }, markers: { radius: 3 } },
    tooltip: { theme: 'dark', y: { formatter: v => `R$ ${fmtBRL(v)}` } },
  });

  const donutOpts = (labels, colors) => ({
    chart: { type: 'donut', background: 'transparent', fontFamily: 'inherit', animations: { speed: 500 } },
    colors: colors || APEX_COLORS,
    labels,
    dataLabels: { enabled: false },
    legend: { position: 'bottom', fontSize: '11px', labels: { colors: '#64748b' }, markers: { radius: 3 } },
    plotOptions: { pie: { donut: { size: '65%', labels: { show: true, total: { show: true, label: 'Total', color: '#64748b', fontSize: '11px', formatter: w => `R$ ${fmtBRL(w.globals.seriesTotals.reduce((a,b)=>a+b,0))}` } } } } },
    stroke: { show: false },
    tooltip: { theme: 'dark', y: { formatter: v => `R$ ${fmtBRL(v)}` } },
  });

  const barOpts = (categories, colors) => ({
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent', fontFamily: 'inherit', animations: { speed: 500 } },
    colors: colors || ['#2563eb'],
    plotOptions: { bar: { borderRadius: 5, borderRadiusApplication: 'end', columnWidth: '55%' } },
    dataLabels: { enabled: false },
    xaxis: { categories, labels: { style: { colors: '#64748b', fontSize: '10px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { formatter: v => v >= 1000 ? `R$${(v/1000).toFixed(0)}k` : `R$${v}`, style: { colors: '#64748b', fontSize: '10px' } } },
    grid: { borderColor: '#e2e8f0', strokeDashArray: 3 },
    legend: { labels: { colors: '#64748b' }, markers: { radius: 3 } },
    tooltip: { theme: 'dark', y: { formatter: v => `R$ ${fmtBRL(v)}` } },
  });

  if (loading || !data) return (
    <div className={s.page}>
      <div className={s.loadingWrap}><span className={s.spinner} /></div>
    </div>
  );

  // Backend já retorna 12 meses em ordem
  const evolByMes   = data.evolucao || Array(12).fill({ receitas: 0, despesas: 0 });
  const cacauByMes  = data.cacau?.vendas || Array(12).fill({ total: 0 });
  const imovelByMes = data.imoveis?.recebimentosPorMes || Array(12).fill({ total: 0 });

  const loteStatus = data.imoveis?.lotesPorStatus || [];
  const contratos  = data.imoveis?.contratos || {};
  const parcelas   = data.imoveis?.parcelas || {};
  const cacauT     = data.cacau?.totais || {};
  const saldoCacau = data.cacau?.saldo || [];
  const alertas    = data.alertas?.parcelasVencidas || [];
  const recCat     = data.receitasPorCategoria || [];

  return (
    <div className={s.page}>
      {/* ── Cabeçalho ── */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>Dashboard Executivo</h1>
          <p className={s.pageSub}>Visão consolidada — Financeiro · Cacau · Imobiliária</p>
        </div>
        <div className={s.filters}>
          <select className={s.select} value={mes} onChange={e => setMes(+e.target.value)}>
            {MESES_ABR.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className={s.select} value={ano} onChange={e => setAno(+e.target.value)}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* ══ SEÇÃO 1 — FINANCEIRO ══ */}
      <motion.div className={s.rptBlock} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35 }}>
        <RptHeader icon={<IcoChart />} title="Painel Financeiro" sub={`Competência ${MESES_ABR[mes-1]}/${ano}`} badge={`SALDO: R$ ${fmtBRL(data.saldo)}`} />
        <div className={s.rptBody}>
          <div className={s.kpis}>
            <KpiCard i={0} label="Total Receitas"     value={formatCurrency(data.totalReceitas)}  icon={<IcoReceita />}  color={data.totalReceitas >= 0 ? 'success' : 'danger'} />
            <KpiCard i={1} label="Total Despesas"     value={formatCurrency(data.totalDespesas)}  icon={<IcoDespesa />}  color="danger" />
            <KpiCard i={2} label="Saldo do Período"   value={formatCurrency(data.saldo)}          icon={<IcoSaldo />}    color={data.saldo >= 0 ? 'accent' : 'danger'} sub={data.saldo >= 0 ? 'Positivo' : 'Negativo'} />
            <KpiCard i={3} label="Receitas Pendentes" value={formatCurrency(data.recPendentes)}   icon={<IcoClock />}    color="warning" />
            <KpiCard i={4} label="Despesas a Pagar"   value={formatCurrency(data.despPendentes)}  icon={<IcoClock />}    color="warning" />
            <KpiCard i={5} label="Despesas Pagas"     value={formatCurrency(data.despPagas)}      icon={<IcoCheck />}    color="success" />
          </div>

          <div className={s.chartRow}>
            <div className={s.chartCard}>
              <div className={s.chartCardTitle}>Receitas vs Despesas — {ano}</div>
              <ReactApexChart
                type="area"
                options={areaOpts(['Receitas','Despesas'], ['#10b981','#ef4444'])}
                series={[
                  { name: 'Receitas', data: evolByMes.map(m => parseFloat(m.receitas || 0)) },
                  { name: 'Despesas', data: evolByMes.map(m => parseFloat(m.despesas || 0)) },
                ]}
                height={220}
              />
            </div>
            <div className={s.chartCard}>
              <div className={s.chartCardTitle}>Receitas por Categoria — {MESES_ABR[mes-1]}</div>
              {recCat.length === 0
                ? <div className={s.emptyChart}>Sem dados no período</div>
                : <ReactApexChart
                    type="donut"
                    options={donutOpts(recCat.map(r => r.categoria || 'Sem categoria'), ['#10b981','#2563eb','#f59e0b','#8b5cf6','#14b8a6'])}
                    series={recCat.map(r => parseFloat(r.total || 0))}
                    height={220}
                  />
              }
            </div>
            <div className={s.chartCard}>
              <div className={s.chartCardTitle}>Despesas por Grupo — {MESES_ABR[mes-1]}</div>
              {(!data.despPorGrupo || data.despPorGrupo.length === 0)
                ? <div className={s.emptyChart}>Sem dados no período</div>
                : <ReactApexChart
                    type="bar"
                    options={barOpts(data.despPorGrupo.map(g => g.grupo), ['#2563eb'])}
                    series={[{ name: 'Despesas', data: data.despPorGrupo.map(g => parseFloat(g.total || 0)) }]}
                    height={220}
                  />
              }
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══ SEÇÃO 2 — CACAU ══ */}
      <motion.div className={s.rptBlock} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35, delay:0.08 }}>
        <RptHeader icon={<IcoCacau />} title="Cacau" sub={`Vendas e produção — ${ano}`} badge={`${parseFloat(cacauT.total_arrobas||0).toFixed(0)} arrobas vendidas`} />
        <div className={s.rptBody}>
          <div className={s.kpis}>
            <KpiCard i={0} label="Total Vendido"   value={formatCurrency(cacauT.total_vendido || 0)} icon={<IcoReceita />} color="success" />
            <KpiCard i={1} label="Total KG"        value={`${parseFloat(cacauT.total_kg||0).toLocaleString('pt-BR')} kg`} icon={<IcoChart />} color="accent" />
            <KpiCard i={2} label="Total Arrobas"   value={`${parseFloat(cacauT.total_arrobas||0).toFixed(0)} @`} icon={<IcoChart />} color="accent" />
          </div>

          <div className={s.chartRow}>
            <div className={`${s.chartCard} ${s.chartCardWide}`}>
              <div className={s.chartCardTitle}>Vendas por Mês — {ano}</div>
              <ReactApexChart
                type="bar"
                options={barOpts(MESES_ABR, ['#f59e0b'])}
                series={[{ name: 'Vendas (R$)', data: cacauByMes.map(m => parseFloat(m.total || 0)) }]}
                height={200}
              />
            </div>

            {saldoCacau.length > 0 && (
              <div className={s.chartCard}>
                <div className={s.chartCardTitle}>Saldo por Credora</div>
                <div className={s.miniTable}>
                  <div className={s.miniTableHead}>
                    <span>Credora</span><span>Entregue</span><span>Baixado</span><span>Saldo</span>
                  </div>
                  {saldoCacau.slice(0,6).map(c => (
                    <div key={c.credora} className={s.miniTableRow}>
                      <span className={s.miniTableName}>{c.credora}</span>
                      <span>{parseFloat(c.kg_entregue||0).toFixed(0)} kg</span>
                      <span>{parseFloat(c.kg_baixado||0).toFixed(0)} kg</span>
                      <span className={parseFloat(c.saldo_kg) > 0 ? s.pos : s.neg}>
                        {parseFloat(c.saldo_kg||0).toFixed(0)} kg
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ══ SEÇÃO 3 — IMOBILIÁRIA ══ */}
      <motion.div className={s.rptBlock} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35, delay:0.16 }}>
        <RptHeader icon={<IcoHome />} title="Imobiliária" sub="Loteamentos e contratos" badge={`${contratos.ativos || 0} contratos ativos`} />
        <div className={s.rptBody}>
          <div className={s.kpis}>
            <KpiCard i={0} label="Contratos Ativos"    value={contratos.ativos || 0}                           icon={<IcoCheck />}   color="success" />
            <KpiCard i={1} label="Total Contratado"    value={formatCurrency(contratos.valor_total_contratado)} icon={<IcoSaldo />}   color="accent" />
            <KpiCard i={2} label="Total Recebido"      value={formatCurrency(parcelas.total_recebido)}          icon={<IcoReceita />} color="success" />
            <KpiCard i={3} label="A Receber"           value={formatCurrency(parcelas.total_pendente)}          icon={<IcoClock />}   color="warning" />
            <KpiCard i={4} label="Parcelas Vencidas"   value={formatCurrency(parcelas.total_vencido)}           icon={<IcoWarning />} color="danger"  sub={`${parcelas.qtd_vencidas || 0} parcela(s)`} />
            <KpiCard i={5} label="Contratos Quitados"  value={contratos.quitados || 0}                         icon={<IcoCheck />}   color="success" />
          </div>

          <div className={s.chartRow}>
            <div className={`${s.chartCard} ${s.chartCardWide}`}>
              <div className={s.chartCardTitle}>Recebimentos Mensais — {ano}</div>
              <ReactApexChart
                type="bar"
                options={barOpts(MESES_ABR, ['#2563eb'])}
                series={[{ name: 'Recebido (R$)', data: imovelByMes.map(m => parseFloat(m.total || 0)) }]}
                height={200}
              />
            </div>

            {loteStatus.length > 0 && (
              <div className={s.chartCard}>
                <div className={s.chartCardTitle}>Status dos Lotes</div>
                <ReactApexChart
                  type="donut"
                  options={donutOpts(
                    loteStatus.map(l => l.status === 'disponivel' ? 'Disponível' : l.status === 'vendido' ? 'Vendido' : 'Quitado'),
                    ['#10b981','#2563eb','#f59e0b']
                  )}
                  series={loteStatus.map(l => parseInt(l.qtd || 0))}
                  height={220}
                />
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ══ SEÇÃO 4 — ANÁLISE QUALITATIVA / ALERTAS ══ */}
      <motion.div className={s.rptBlock} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35, delay:0.24 }}>
        <RptHeader icon={<IcoAlert />} title="Alertas e Análise Qualitativa" sub="Pontos de atenção do sistema" />
        <div className={s.rptBody}>
          <div className={s.alertGrid}>

            {/* Parcelas vencidas */}
            <div className={s.alertCard}>
              <div className={s.alertCardHeader}>
                <IcoWarning />
                <span>Parcelas Vencidas +30 dias</span>
                <span className={s.alertBadgeDanger}>{alertas.length}</span>
              </div>
              {alertas.length === 0
                ? <div className={s.alertEmpty}>Nenhuma parcela vencida crítica</div>
                : alertas.map(a => (
                  <div key={a.id} className={s.alertRow}>
                    <div className={s.alertRowMain}>
                      <span className={s.alertRowName}>{a.cliente || 'Cliente'}</span>
                      <span className={s.alertRowSub}>{a.empreendimento}</span>
                    </div>
                    <div className={s.alertRowRight}>
                      <span className={s.alertRowVal}>R$ {fmtBRL(a.valor)}</span>
                      <span className={s.alertRowDias}>{a.dias_atraso} dias</span>
                    </div>
                  </div>
                ))
              }
            </div>

            {/* Resumo financeiro qualitativo */}
            <div className={s.alertCard}>
              <div className={s.alertCardHeader}>
                <IcoChart />
                <span>Indicadores do Período</span>
              </div>
              <div className={s.indicadorGrid}>
                {[
                  { label: 'Taxa de Inadimplência Imóveis', value: parcelas.total_pendente > 0 ? `${((parcelas.total_vencido / (parcelas.total_pendente + parcelas.total_vencido)) * 100).toFixed(1)}%` : '0%', color: parseFloat(parcelas.total_vencido) > 0 ? 'danger' : 'success' },
                  { label: 'Contratos Rescindidos', value: contratos.rescindidos || 0, color: parseInt(contratos.rescindidos) > 0 ? 'warning' : 'success' },
                  { label: 'Saldo Financeiro', value: formatCurrency(data.saldo), color: data.saldo >= 0 ? 'success' : 'danger' },
                  { label: 'Receitas Pendentes', value: formatCurrency(data.recPendentes), color: 'warning' },
                  { label: 'Despesas Pendentes', value: formatCurrency(data.despPendentes), color: 'warning' },
                  { label: 'Cacau — Arrobas Vendidas', value: `${parseFloat(cacauT.total_arrobas||0).toFixed(0)} @`, color: 'accent' },
                ].map((ind, i) => (
                  <div key={i} className={s.indicadorItem}>
                    <span className={s.indicadorLabel}>{ind.label}</span>
                    <span className={`${s.indicadorValue} ${s[`ind_${ind.color}`]}`}>{ind.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </motion.div>

    </div>
  );
}
