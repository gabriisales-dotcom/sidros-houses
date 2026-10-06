/* ── Aviso de cookies ──
   Hoje o site não usa cookies: o aviso só informa ("Entendi").
   Se um dia entrar estatística/publicidade, pôr esse código assim:
     <script type="text/plain" data-consentimento src="…"></script>
   e o aviso passa sozinho a "Aceitar / Rejeitar" — esses scripts só
   correm depois de "Aceitar". Qualquer elemento com [data-cookies]
   volta a abrir o aviso (para mudar de ideias).
   A escolha fica no localStorage; mudar VERSAO volta a perguntar. */
(() => {
  const CHAVE = 'sidros-cookies';
  const VERSAO = '1';
  const pendentes = () => document.querySelectorAll('script[type="text/plain"][data-consentimento]');
  const modoConsentimento = pendentes().length > 0;

  const TEXTOS = {
    pt: {
      aviso: {
        titulo: 'Aqui não há cookies.',
        texto: 'Não usamos cookies, estatísticas nem publicidade. Só guardamos no seu navegador a língua que escolher.',
        sim: 'Entendi'
      },
      consentimento: {
        titulo: 'Cookies',
        texto: 'Usamos cookies de estatística para perceber como o site é visitado. Só os ativamos se aceitar.',
        sim: 'Aceitar', nao: 'Rejeitar'
      },
      politica: 'Política de Privacidade',
      rotulo: 'Aviso de cookies'
    },
    en: {
      aviso: {
        titulo: 'No cookies here.',
        texto: 'We use no cookies, analytics or advertising. Your browser only remembers the language you choose.',
        sim: 'Got it'
      },
      consentimento: {
        titulo: 'Cookies',
        texto: 'We use analytics cookies to understand how the site is visited. They are only turned on if you accept.',
        sim: 'Accept', nao: 'Reject'
      },
      politica: 'Privacy Policy',
      rotulo: 'Cookie notice'
    }
  };

  const ler = () => { try { return JSON.parse(localStorage.getItem(CHAVE)); } catch (e) { return null; } };
  const gravar = (escolha) => {
    try { localStorage.setItem(CHAVE, JSON.stringify({ v: VERSAO, escolha })); } catch (e) { /* modo privado */ }
  };

  const ativar = () => {
    pendentes().forEach((velho) => {
      const s = document.createElement('script');
      [...velho.attributes].forEach((a) => { if (a.name !== 'type' && a.name !== 'data-consentimento') s.setAttribute(a.name, a.value); });
      s.text = velho.text;
      velho.replaceWith(s);
    });
  };

  const css = `
.cookies{position:fixed;z-index:120;left:clamp(16px,3vw,36px);bottom:clamp(16px,3vw,36px);
  width:min(400px,calc(100% - 32px));padding:22px 24px 20px;border-radius:14px;
  background:#1F2316;color:#FAF7F1;font-family:'DM Sans',system-ui,sans-serif;
  box-shadow:0 24px 50px -18px rgba(0,0,0,.55),inset 0 0 0 1px rgba(250,247,241,.08);
  opacity:0;transform:translateY(18px);
  transition:opacity .5s cubic-bezier(.22,1,.36,1),transform .6s cubic-bezier(.22,1,.36,1)}
.cookies.is-on{opacity:1;transform:none}
.cookies__titulo{margin:0 0 6px;font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;font-size:23px;line-height:1.15}
.cookies__texto{margin:0 0 16px;font-size:13.5px;line-height:1.6;color:rgba(250,247,241,.72)}
.cookies__acoes{display:flex;flex-wrap:wrap;align-items:center;gap:10px 18px}
.cookies__btn{appearance:none;border:1px solid rgba(250,247,241,.4);background:transparent;color:#FAF7F1;cursor:pointer;
  font:500 11.5px/1 'DM Sans',system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;
  padding:12px 20px;border-radius:999px;transition:background .3s,color .3s,border-color .3s}
.cookies__btn--sim{background:#FAF7F1;color:#1F2316;border-color:#FAF7F1}
.cookies__btn:hover{border-color:#9FB283;background:#9FB283;color:#1F2316}
.cookies__btn:focus-visible,.cookies__link:focus-visible{outline:2px solid #9FB283;outline-offset:3px}
.cookies__link{font-size:12.5px;color:rgba(250,247,241,.72);text-decoration:none;border-bottom:1px solid rgba(250,247,241,.25);transition:color .3s,border-color .3s}
.cookies__link:hover{color:#9FB283;border-color:#9FB283}
@media (max-width:640px){
  .cookies{left:12px;right:12px;bottom:12px;width:auto;padding:18px 18px 16px}
  .cookies__titulo{font-size:21px}
  body.cookies-aberto .zap{opacity:0;--zap-toque:none}
}
@media (prefers-reduced-motion:reduce){.cookies{transition:opacity .2s;transform:none}}`;

  let caixa = null;

  const lingua = () => (document.documentElement.lang || 'pt').toLowerCase().startsWith('en') ? 'en' : 'pt';
  const preencher = () => {
    if (!caixa) return;
    const L = TEXTOS[lingua()];
    const T = modoConsentimento ? L.consentimento : L.aviso;
    caixa.setAttribute('aria-label', L.rotulo);
    caixa.innerHTML = `
      <p class="cookies__titulo">${T.titulo}</p>
      <p class="cookies__texto">${T.texto}</p>
      <div class="cookies__acoes">
        <button type="button" class="cookies__btn cookies__btn--sim" data-escolha="sim">${T.sim}</button>
        ${T.nao ? `<button type="button" class="cookies__btn" data-escolha="nao">${T.nao}</button>` : ''}
        <a class="cookies__link" href="politica-privacidade.html">${L.politica}</a>
      </div>`;
  };

  const fechar = () => {
    if (!caixa) return;
    const c = caixa; caixa = null;
    document.body.classList.remove('cookies-aberto');
    c.classList.remove('is-on');
    setTimeout(() => c.remove(), 600);
  };

  const abrir = (atraso) => {
    if (caixa) return;
    if (!document.getElementById('cookies-css')) {
      const st = document.createElement('style');
      st.id = 'cookies-css'; st.textContent = css;
      document.head.append(st);
    }
    caixa = document.createElement('div');
    caixa.className = 'cookies';
    caixa.setAttribute('role', 'region');
    preencher();
    caixa.addEventListener('click', (e) => {
      const b = e.target.closest('[data-escolha]');
      if (!b) return;
      const sim = b.dataset.escolha === 'sim';
      gravar(modoConsentimento ? (sim ? 'aceite' : 'recusado') : 'visto');
      if (modoConsentimento && sim) ativar();
      fechar();
    });
    document.body.append(caixa);
    setTimeout(() => {
      if (!caixa) return;
      document.body.classList.add('cookies-aberto');
      requestAnimationFrame(() => caixa && caixa.classList.add('is-on'));
    }, atraso);
  };

  document.addEventListener('idioma', preencher);
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-cookies]')) { e.preventDefault(); abrir(0); }
  });

  const guardado = ler();
  const valido = guardado && guardado.v === VERSAO &&
    (modoConsentimento ? (guardado.escolha === 'aceite' || guardado.escolha === 'recusado') : true);
  if (valido) {
    if (modoConsentimento && guardado.escolha === 'aceite') ativar();
  } else {
    /* deixa o hero respirar antes de aparecer */
    abrir(1600);
  }
})();
