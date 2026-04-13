import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import s from './Landing.module.css';

/* ── Contador animado ── */
function Counter({ end, prefix = '', suffix = '', duration = 2000 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = null;
      const step = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 4);
        setVal(Math.floor(ease * end));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{prefix}{val.toLocaleString('pt-BR')}{suffix}</span>;
}

/* ── Ticker de fundo ── */
const TICKER_ITEMS = [
  'RECEITAS +12.4%', 'SALDO R$847.290', 'DESPESAS −8.1%', 'PROJETOS 24',
  'CONTAS 9', 'RENDIMENTO +3.7%', 'FLUXO POSITIVO', 'RELATÓRIO Q1',
  'CENTRO DE CUSTO', 'CONTROLE TOTAL', 'RECEITAS +12.4%', 'SALDO R$847.290',
];

export default function Landing() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const heroRef = useRef(null);

  /* parallax sutil no hero */
  useEffect(() => {
    const handler = (e) => {
      if (!heroRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 18;
      const y = (e.clientY / window.innerHeight - 0.5) * 12;
      heroRef.current.style.setProperty('--px', `${x}px`);
      heroRef.current.style.setProperty('--py', `${y}px`);
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return (
    <div className={s.root}>

      {/* ══ NAV ══ */}
      <nav className={s.nav}>
        <div className={s.navInner}>
          <a href="#" className={s.logo}>
            <span className={s.logoMark}>C</span>
            <span className={s.logoText}>Cosvar</span>
          </a>
          <ul className={`${s.navLinks} ${menuOpen ? s.navOpen : ''}`}>
            <li><a href="#features" onClick={() => setMenuOpen(false)}>Funcionalidades</a></li>
            <li><a href="#modulos" onClick={() => setMenuOpen(false)}>Módulos</a></li>
            <li><a href="#numeros" onClick={() => setMenuOpen(false)}>Números</a></li>
            <li>
              <button className={s.navCta} onClick={() => navigate('/login')}>
                Acessar Sistema
              </button>
            </li>
          </ul>
          <button className={s.burger} onClick={() => setMenuOpen(p => !p)} aria-label="Menu">
            <span className={menuOpen ? s.burgerX : ''} />
            <span className={menuOpen ? s.burgerX2 : ''} />
            <span className={menuOpen ? s.burgerX3 : ''} />
          </button>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section className={s.hero} ref={heroRef}>
        {/* Ticker de fundo */}
        <div className={s.tickerWrap} aria-hidden>
          <div className={s.ticker}>
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
              <span key={i} className={s.tickerItem}>{t}</span>
            ))}
          </div>
        </div>

        {/* Grid decorativo */}
        <div className={s.grid} aria-hidden />

        {/* Orbes */}
        <div className={s.orb1} aria-hidden />
        <div className={s.orb2} aria-hidden />

        <div className={s.heroContent}>
          <div className={s.heroBadge}>
            <span className={s.badgeDot} />
            Sistema Financeiro Profissional
          </div>

          <h1 className={s.heroTitle}>
            Controle total<br />
            <em>das suas finanças.</em>
          </h1>

          <p className={s.heroSub}>
            Lançamentos, relatórios, dashboards e muito mais —<br />
            tudo em um sistema integrado, rápido e seguro.
          </p>

          <div className={s.heroCtas}>
            <button className={s.ctaPrimary} onClick={() => navigate('/login')}>
              Entrar no Sistema
              <span className={s.ctaArrow}>→</span>
            </button>
            <a href="#features" className={s.ctaGhost}>
              Ver funcionalidades
            </a>
          </div>

          <div className={s.heroStats}>
            <div className={s.stat}>
              <span className={s.statNum}><Counter end={15} suffix="+" /></span>
              <span className={s.statLabel}>Módulos</span>
            </div>
            <div className={s.statDiv} />
            <div className={s.stat}>
              <span className={s.statNum}><Counter end={100} suffix="%" /></span>
              <span className={s.statLabel}>Seguro</span>
            </div>
            <div className={s.statDiv} />
            <div className={s.stat}>
              <span className={s.statNum}><Counter end={24} suffix="/7" /></span>
              <span className={s.statLabel}>Disponível</span>
            </div>
          </div>
        </div>

        {/* Terminal mock */}
        <div className={s.terminal}>
          <div className={s.termBar}>
            <span className={s.dot} style={{ background: '#f05b5b' }} />
            <span className={s.dot} style={{ background: '#f0b93a' }} />
            <span className={s.dot} style={{ background: '#2ecc8a' }} />
            <span className={s.termTitle}>dashboard — cosvar</span>
          </div>
          <div className={s.termBody}>
            <TermLine delay={0}  color="#7a82a0" text="$ cosvar start --mode=production" />
            <TermLine delay={400} color="#2ecc8a" text="✓ MySQL conectado" />
            <TermLine delay={700} color="#2ecc8a" text="✓ JWT configurado" />
            <TermLine delay={1000} color="#2ecc8a" text="✓ API rodando :3001" />
            <TermLine delay={1300} color="#4f8ef7" text="→ Dashboard carregado" />
            <TermLine delay={1600} color="#f0b93a" text="⚡ Saldo: R$ 847.290,00" />
            <TermLine delay={1900} color="#e8eaf0" text="▦ Receitas: R$ 1.240.000" blink />
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="features" className={s.features}>
        <div className={s.sectionLabel}>Funcionalidades</div>
        <h2 className={s.sectionTitle}>Tudo que você precisa,<br />num só lugar.</h2>

        <div className={s.featureGrid}>
          {FEATURES.map((f, i) => (
            <div key={i} className={s.featureCard} style={{ animationDelay: `${i * 80}ms` }}>
              <div className={s.featureIcon}>{f.icon}</div>
              <h3 className={s.featureName}>{f.name}</h3>
              <p className={s.featureDesc}>{f.desc}</p>
              <div className={s.featureLine} />
            </div>
          ))}
        </div>
      </section>

      {/* ══ MÓDULOS ══ */}
      <section id="modulos" className={s.modulos}>
        <div className={s.modulosBg} aria-hidden />
        <div className={s.modulosInner}>
          <div className={s.modulosLeft}>
            <div className={s.sectionLabel}>Módulos do Sistema</div>
            <h2 className={s.sectionTitle}>Menu completo,<br />estrutura sólida.</h2>
            <p className={s.modulosDesc}>
              Cada módulo foi pensado para integrar-se perfeitamente
              com os demais — da hierarquia de despesas até o controle
              de contas bancárias.
            </p>
            <button className={s.ctaPrimary} onClick={() => navigate('/login')} style={{ marginTop: 32 }}>
              Acessar agora →
            </button>
          </div>
          <div className={s.modulosRight}>
            {MODULOS.map((grupo, gi) => (
              <div key={gi} className={s.moduloGrupo}>
                <div className={s.moduloGrupoLabel}>{grupo.label}</div>
                <div className={s.moduloItems}>
                  {grupo.items.map((item, ii) => (
                    <span key={ii} className={s.moduloTag}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ NÚMEROS ══ */}
      <section id="numeros" className={s.numeros}>
        <div className={s.sectionLabel}>Capacidade</div>
        <h2 className={s.sectionTitle}>Números que<br />impressionam.</h2>
        <div className={s.numerosGrid}>
          {STATS.map((st, i) => (
            <div key={i} className={s.statCard}>
              <div className={s.statCardNum}>
                <Counter end={st.end} prefix={st.prefix} suffix={st.suffix} />
              </div>
              <div className={s.statCardLabel}>{st.label}</div>
              <div className={s.statCardBar}>
                <div className={s.statCardFill} style={{ width: `${st.pct}%`, animationDelay: `${i * 150}ms` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CTA FINAL ══ */}
      <section className={s.ctaSection}>
        <div className={s.ctaGlow} aria-hidden />
        <div className={s.ctaContent}>
          <h2 className={s.ctaTitle}>Pronto para começar?</h2>
          <p className={s.ctaSub}>Acesse o sistema agora e tenha controle total das suas finanças.</p>
          <button className={s.ctaPrimary} onClick={() => navigate('/login')} style={{ fontSize: '1.05rem', padding: '14px 36px' }}>
            Entrar no Cosvar
            <span className={s.ctaArrow}>→</span>
          </button>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className={s.footer}>
        <div className={s.footerInner}>
          <div className={s.logo}>
            <span className={s.logoMark}>C</span>
            <span className={s.logoText}>Cosvar</span>
          </div>
          <p className={s.footerText}>Sistema Financeiro Profissional — {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}

/* ── Terminal line com animação ── */
function TermLine({ text, color, delay = 0, blink = false }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  if (!show) return null;
  return (
    <div className={s.termLine} style={{ color, animationDelay: `${delay}ms` }}>
      {text}{blink && <span className={s.cursor}>▌</span>}
    </div>
  );
}

/* ── Dados ── */
const FEATURES = [
  { icon: '◈', name: 'Dashboard Analítico',  desc: 'KPIs em tempo real com gráficos de receitas, despesas e saldo por período.' },
  { icon: '↓', name: 'Lançamento de Despesas', desc: 'Hierarquia completa: Grupo → Subgrupo → Item com dropdowns encadeados.' },
  { icon: '↑', name: 'Lançamento de Receitas', desc: 'Categoria → Descrição vinculada a projetos e contas específicas.' },
  { icon: '◉', name: 'Cadastros Completos',   desc: 'Produtores, fornecedores, compradores, projetos e centros de custo.' },
  { icon: '▦', name: 'Gestão de Contas',      desc: 'Controle de contas bancárias com saldo inicial e vínculos bancários.' },
  { icon: '◫', name: 'Relatórios',            desc: 'Análise por grupo, subgrupo, despesas em aberto e receitas aportadas.' },
  { icon: '⚿', name: 'Multiusuário',          desc: 'Controle de acesso por perfil: admin e usuário com JWT seguro.' },
  { icon: '⬡', name: 'API REST',              desc: 'Backend Express com arquitetura em camadas: routes → controllers → services → repositories.' },
];

const MODULOS = [
  { label: 'Financeiro', items: ['Lançar Despesa', 'Lançar Receita'] },
  { label: 'Cadastros — Despesas', items: ['Grupo', 'Subgrupo', 'Item'] },
  { label: 'Cadastros — Receitas', items: ['Categoria', 'Descrição'] },
  { label: 'Cadastros — Gerais', items: ['Produtor', 'Fornecedor', 'Comprador', 'Projeto', 'Centro de Custo', 'Banco', 'Conta'] },
  { label: 'Análise', items: ['Dashboard', 'Relatórios'] },
];

const STATS = [
  { end: 15,  prefix: '',   suffix: '+',  label: 'Módulos integrados',      pct: 100 },
  { end: 100, prefix: '',   suffix: '%',  label: 'Dados criptografados',    pct: 100 },
  { end: 12,  prefix: '',   suffix: '',   label: 'Tabelas relacionadas',    pct: 80  },
  { end: 40,  prefix: '+',  suffix: '',   label: 'Endpoints de API',        pct: 70  },
];
