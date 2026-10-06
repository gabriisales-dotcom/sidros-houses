/* Sidrós Houses — interações da Home */
(function () {
  'use strict';
  const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Idioma atual e tradutor dos textos montados em JS.
     O dicionário (js/en.js) só chega quando alguém pede EN. */
  let lingua = 'pt', EN = null;
  const t = (s) => (lingua === 'en' && EN && EN.t[s]) || s;

  /* ── Ano no rodapé ── */
  const ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();

  /* ── Nav: estado ao rolar ── */
  const nav = document.getElementById('nav');
  const hero = document.getElementById('hero');
  if (nav && hero) {
    const io = new IntersectionObserver(
      ([e]) => {
        nav.classList.toggle('is-stuck', !e.isIntersecting);
        /* serve ao botão de WhatsApp, que em telemóvel só entra
           depois do hero para não tapar os botões de lá */
        document.body.classList.toggle('fora-do-hero', !e.isIntersecting);
      },
      { rootMargin: '-88px 0px 0px 0px', threshold: 0 }
    );
    io.observe(hero);
  }

  /* ── Hero: frases que se sucedem ──
     Cada frase fica o tempo de a ler (pelo número de letras). A barrinha
     da frase atual enche-se em CSS; quando acaba, passa-se à seguinte.
     Pausa com o rato ou o foco em cima, fora do ecrã e com o separador
     escondido. Com movimento reduzido não avança sozinha: muda-se nas barrinhas. */
  const heroRot = document.getElementById('heroRot');
  if (heroRot) {
    const frases = [...heroRot.querySelectorAll('.hero__frase')];
    const passos = [...heroRot.querySelectorAll('.hero__passo')];
    const tempo = (p) => Math.min(10000, Math.max(3800, p.textContent.trim().length * 45));
    let atual = 0;

    const ir = (n) => {
      if (n === atual) return;
      const velha = frases[atual];
      velha.classList.remove('is-on');
      velha.classList.add('is-sai');
      setTimeout(() => velha.classList.remove('is-sai'), 900);
      passos[atual].classList.remove('is-on');
      passos[atual].removeAttribute('aria-current');
      atual = n;
      frases[n].classList.add('is-on');
      passos[n].style.setProperty('--dur', tempo(frases[n]) + 'ms');
      passos[n].classList.add('is-on');
      passos[n].setAttribute('aria-current', 'true');
    };
    /* a primeira conta também com a entrada do hero */
    passos[0].style.setProperty('--dur', tempo(frases[0]) + 1200 + 'ms');

    heroRot.addEventListener('animationend', (e) => {
      if (!reduz && e.target.classList.contains('hero__passo')) ir((atual + 1) % frases.length);
    });
    passos.forEach((b, k) => b.addEventListener('click', () => ir(k)));

    const pausas = new Set();
    const pausa = (motivo, sim) => {
      if (sim) pausas.add(motivo); else pausas.delete(motivo);
      heroRot.classList.toggle('is-pausa', pausas.size > 0);
    };
    heroRot.addEventListener('mouseenter', () => pausa('rato', true));
    heroRot.addEventListener('mouseleave', () => pausa('rato', false));
    heroRot.addEventListener('focusin', () => pausa('foco', true));
    heroRot.addEventListener('focusout', () => pausa('foco', false));
    document.addEventListener('visibilitychange', () => pausa('oculto', document.hidden));
    new IntersectionObserver(([e]) => pausa('fora', !e.isIntersecting)).observe(heroRot);
  }

  /* ── WhatsApp flutuante: sai de cena na tab final ── */
  const fecho = document.getElementById('contacto');
  if (fecho) {
    const fio = new IntersectionObserver(
      ([e]) => document.body.classList.toggle('em-fecho', e.isIntersecting),
      { threshold: 0.15 }
    );
    fio.observe(fecho);
  }

  /* ── Menu em balão ── */
  const burger = document.getElementById('burger');
  const balao = document.getElementById('balao');
  if (burger && balao) {
    balao.hidden = false;

    /* o balão ancora-se à altura real da barra, que muda ao rolar */
    const medirNav = () => {
      if (nav) {
        document.documentElement.style.setProperty('--nav-h', nav.offsetHeight + 'px');
      }
    };
    medirNav();
    window.addEventListener('resize', medirNav);
    if (nav) new ResizeObserver(medirNav).observe(nav);

    /* Em desktop o PT|EN desliza pela largura da barra, medida aqui.
       Mais 14px para não ficar encostado. */
    const medirBalao = () => {
      document.documentElement.style.setProperty(
        '--balao-w', balao.offsetWidth + 14 + 'px'
      );
    };
    medirBalao();
    window.addEventListener('resize', medirBalao);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(medirBalao);

    const fechar = () => {
      if (!document.body.classList.contains('menu-open')) return;
      document.body.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', t('Abrir menu'));
    };

    burger.addEventListener('click', (e) => {
      e.stopPropagation();
      const aberto = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', String(aberto));
      burger.setAttribute('aria-label', t(aberto ? 'Fechar menu' : 'Abrir menu'));
      if (aberto) { medirNav(); medirBalao(); }
    });


    balao.querySelectorAll('a').forEach((a) => a.addEventListener('click', fechar));

    /* os links mudam de largura com o idioma */
    document.addEventListener('idioma', () => {
      medirBalao();
      burger.setAttribute('aria-label', t(document.body.classList.contains('menu-open') ? 'Fechar menu' : 'Abrir menu'));
    });

    /* clicar fora ou premir Escape fecha */
    document.addEventListener('click', (e) => {
      if (!balao.contains(e.target) && !burger.contains(e.target)) fechar();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') fechar();
    });
  }

  /* ── Balão de conversa do WhatsApp ── */
  const zapBotao = document.getElementById('zapBotao');
  const zapPainel = document.getElementById('zapPainel');
  const zapFechar = document.getElementById('zapFechar');
  if (zapBotao && zapPainel) {
    zapPainel.hidden = false;

    const fecharZap = () => {
      document.body.classList.remove('zap-aberto');
      zapBotao.setAttribute('aria-expanded', 'false');
    };

    zapBotao.addEventListener('click', (e) => {
      e.stopPropagation();
      const aberto = document.body.classList.toggle('zap-aberto');
      zapBotao.setAttribute('aria-expanded', String(aberto));
    });

    if (zapFechar) zapFechar.addEventListener('click', fecharZap);

    document.addEventListener('click', (e) => {
      if (!zapPainel.contains(e.target) && !zapBotao.contains(e.target)) fecharZap();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') fecharZap();
    });
  }

  /* ── Revelações ao scroll ── */
  const alvos = document.querySelectorAll('.reveal');
  if (reduz) {
    alvos.forEach((el) => el.classList.add('in'));
  } else {
    /* Entra e sai: como cada secção é um ecrã, a animação volta a
       correr de cada vez que se chega lá. */
    const rio = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => e.target.classList.toggle('in', e.isIntersecting));
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    alvos.forEach((el) => rio.observe(el));
  }

  /* ── Motor de movimento ──
     Um único rAF trata do cursor, do parallax de rato e do de scroll.
     Sem listeners de scroll: o scrollY é lido dentro do loop, que só
     corre enquanto houver algo para mover. */
  const heroLayer = document.getElementById('heroLayer');
  const heroContent = document.getElementById('heroContent');
  const cursor = document.getElementById('cursor');
  const ring = cursor && cursor.querySelector('.cursor__ring');
  const dot = cursor && cursor.querySelector('.cursor__dot');

  const finoEEstavel = window.matchMedia('(pointer: fine)').matches && !reduz;

  if (finoEEstavel) {
    document.documentElement.classList.add('tem-cursor');

    /* alvos: onde o rato está, ao pixel. atuais: onde o desenho está, com atraso */
    const alvo = { x: innerWidth / 2, y: innerHeight / 2 };
    const anelAtual = { x: alvo.x, y: alvo.y };
    const pontoAtual = { x: alvo.x, y: alvo.y };
    /* -1..1 a partir do centro do ecrã, para o parallax */
    const norm = { x: 0, y: 0 };
    const suave = { x: 0, y: 0 };

    let heroVisivel = true;
    let ativo = true;
    let raf = 0;

    const lerp = (a, b, f) => a + (b - a) * f;

    const acordar = () => {
      if (!ativo) { ativo = true; raf = requestAnimationFrame(passo); }
    };

    window.addEventListener('pointermove', (e) => {
      alvo.x = e.clientX;
      alvo.y = e.clientY;
      norm.x = (e.clientX / innerWidth) * 2 - 1;
      norm.y = (e.clientY / innerHeight) * 2 - 1;
      acordar();
    }, { passive: true });

    /* o hero só se mexe enquanto estiver no ecrã */
    if (hero) {
      new IntersectionObserver(([e]) => {
        heroVisivel = e.isIntersecting;
        if (heroVisivel) acordar();
      }).observe(hero);
    }

    /* estado sobre elementos interativos */
    const interativos = 'a[href], button, .cartao, .aloj__cartao';
    document.addEventListener('pointerover', (e) => {
      if (e.target.closest(interativos)) document.documentElement.classList.add('cursor-ativo');
    });
    document.addEventListener('pointerout', (e) => {
      if (e.target.closest(interativos)) document.documentElement.classList.remove('cursor-ativo');
    });
    document.addEventListener('pointerdown', () => document.documentElement.classList.add('cursor-premido'));
    document.addEventListener('pointerup', () => document.documentElement.classList.remove('cursor-premido'));
    document.addEventListener('pointerleave', () => { if (cursor) cursor.style.opacity = '0'; });
    document.addEventListener('pointerenter', () => { if (cursor) cursor.style.opacity = ''; });

    const passo = () => {
      /* cursor: o ponto cola-se ao rato, o anel segue atrás */
      pontoAtual.x = lerp(pontoAtual.x, alvo.x, 0.55);
      pontoAtual.y = lerp(pontoAtual.y, alvo.y, 0.55);
      anelAtual.x = lerp(anelAtual.x, alvo.x, 0.16);
      anelAtual.y = lerp(anelAtual.y, alvo.y, 0.16);
      if (dot) dot.style.translate = pontoAtual.x + 'px ' + pontoAtual.y + 'px';
      if (ring) ring.style.translate = anelAtual.x + 'px ' + anelAtual.y + 'px';

      /* parallax do hero: a casa desloca-se com o rato, o texto ao contrário */
      let mexeu = false;
      if (heroVisivel && heroLayer) {
        suave.x = lerp(suave.x, norm.x, 0.055);
        suave.y = lerp(suave.y, norm.y, 0.055);

        /* o scroll contribui em Y, mas travado para nunca descobrir a borda */
        const desvioScroll = Math.min(scrollY * 0.07, 19);
        heroLayer.style.setProperty('--px', (suave.x * 17).toFixed(2) + 'px');
        heroLayer.style.setProperty('--py', (suave.y * 10 + desvioScroll).toFixed(2) + 'px');

        if (heroContent) {
          heroContent.style.setProperty('--cx', (suave.x * -9).toFixed(2) + 'px');
          heroContent.style.setProperty('--cy', (suave.y * -7).toFixed(2) + 'px');
        }
        mexeu = Math.abs(suave.x - norm.x) > 0.001 || Math.abs(suave.y - norm.y) > 0.001;
      }

      /* adormece quando tudo assentou, para não queimar frames à toa */
      const cursorParado =
        Math.abs(anelAtual.x - alvo.x) < 0.1 && Math.abs(anelAtual.y - alvo.y) < 0.1;
      if (cursorParado && !mexeu) { ativo = false; return; }
      raf = requestAnimationFrame(passo);
    };

    raf = requestAnimationFrame(passo);
    window.addEventListener('pagehide', () => cancelAnimationFrame(raf));
  }

  /* ── Carrosséis: setas + arrastar ──
     Serve os cartões de "A casa". */
  const carrossel = (trilho, setas, seletor) => {
    const passo = () => {
      const c = trilho.querySelector(seletor);
      if (!c) return 320;
      const gap = parseFloat(getComputedStyle(trilho).columnGap) || 20;
      return c.getBoundingClientRect().width + gap;
    };

    const estado = () => {
      const max = trilho.scrollWidth - trilho.clientWidth - 2;
      setas.forEach((b) => {
        const dir = Number(b.dataset.dir);
        b.disabled = dir < 0 ? trilho.scrollLeft <= 2 : trilho.scrollLeft >= max;
      });
    };

    setas.forEach((b) =>
      b.addEventListener('click', () => {
        trilho.scrollBy({ left: Number(b.dataset.dir) * passo(), behavior: 'smooth' });
      })
    );
    trilho.addEventListener('scroll', estado, { passive: true });
    window.addEventListener('resize', estado);
    estado();

    /* arrastar com o rato; um arrasto não conta como clique */
    let ativo = false, x0 = 0, s0 = 0, moveu = false;
    trilho.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      ativo = true; moveu = false;
      x0 = e.clientX; s0 = trilho.scrollLeft;
    });
    trilho.addEventListener('pointermove', (e) => {
      if (!ativo) return;
      const d = e.clientX - x0;
      if (!moveu && Math.abs(d) > 4) { moveu = true; trilho.classList.add('is-dragging'); }
      if (moveu) trilho.scrollLeft = s0 - d;
    });
    const soltar = () => {
      if (!ativo) return;
      ativo = false;
      trilho.classList.remove('is-dragging');
    };
    trilho.addEventListener('pointerup', soltar);
    trilho.addEventListener('pointerleave', soltar);
    trilho.addEventListener('click', (e) => {
      if (moveu) { e.preventDefault(); e.stopPropagation(); moveu = false; }
    }, true);
  };


  /* ── À volta: o lugar atual em ecrã inteiro, os seguintes em fila ──
     Teste ao estilo "Globe Express". Escolher um cartão faz a foto dele
     crescer até ser o fundo. O avanço automático só corre com a secção
     à vista e para quando o rato está sobre a fila ou os controlos.
     Ordem = ordem do roteiro de 2 dias (PDF); o Poço Verde fica de fora dele. */
  const LUGARES = [
    { slug: 'misarela', nome: 'Ponte da Misarela', quando: 'Dia 01, manhã',
      desc: 'A ponte do diabo, encravada na garganta do Rio Rabagão. A lenda vale a viagem.' },
    { slug: 'barca', nome: 'Praia da Barca', quando: 'Dia 01, tarde',
      desc: 'Praia fluvial, para os dias em que só apetece relaxar com uma vista paradisíaca.' },
    { slug: 'pincaes', nome: 'Cascata de Pincães', quando: 'Dia 01, tarde',
      desc: 'Fecha o primeiro dia. A água cai a pique entre paredes de granito até uma lagoa verde.' },
    { slug: 'sete-lagoas', nome: 'Sete Lagoas', quando: 'Dia 02',
      desc: 'Abre o segundo dia, a pé: cerca de uma hora de trilho até chegar às lagoas, encadeadas no granito. Um mergulho a cada patamar.' },
    { slug: 'fafiao', nome: 'Miradouro de Fafião', quando: 'Dia 02',
      desc: 'A serra inteira, de uma só vez, lá do alto.' },
    { slug: 'arado', nome: 'Cascata do Arado', quando: 'Dia 02',
      desc: 'A última paragem do roteiro. Ouve-se a água muito antes de se ver.' },
    { slug: 'poco-verde', nome: 'Poço Verde', quando: 'Fora do roteiro',
      desc: 'Para quem ainda tiver fôlego: água fria, verde e tão limpa que se vê o fundo.' },
  ];
  const volta = document.getElementById('volta');
  if (volta) {
    const N = LUGARES.length;
    /* o total do contador acompanha a lista */
    const totalEl = document.getElementById('voltaTotal');
    if (totalEl) totalEl.textContent = '/ ' + String(N).padStart(2, '0');
    const cartoes = document.getElementById('voltaCartoes');
    const fundos = volta.querySelectorAll('.volta__fundo');
    const tempo = document.getElementById('voltaTempo');
    const linha = document.getElementById('voltaLinha');
    const num = document.getElementById('voltaNum');
    const campos = {};
    volta.querySelectorAll('[data-campo]').forEach((el) => { campos[el.dataset.campo] = el; });
    const semMov = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const src = (l, pequena) => `assets/img/volta/${l.slug}${pequena ? '-c' : ''}.jpg`;
    const dois = (i) => String(i + 1).padStart(2, '0');
    let atual = 0, ocupado = false, fundoAtivo = 0;

    const montarFila = () => {
      cartoes.innerHTML = '';
      for (let k = 1; k < N; k++) {
        const i = (atual + k) % N, l = LUGARES[i];
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'volta__cartao';
        b.dataset.i = i;
        b.setAttribute('aria-label', `${t('Ver')} ${t(l.nome)}`);
        b.innerHTML = `<img src="${src(l, true)}" alt="" draggable="false"><span class="rotulo">${dois(i)}</span><b>${t(l.nome)}</b>`;
        cartoes.append(b);
      }
    };

    const marcador = () => {
      num.textContent = dois(atual);
      linha.style.width = `${(atual / (N - 1)) * 100}%`;
    };

    /* cada campo sai pela máscara e o novo entra do lado oposto */
    const trocarTexto = (l, dir) => {
      Object.entries(campos).forEach(([k, el], n) => {
        if (semMov) { el.textContent = t(l[k]); return; }
        const sai = el.animate(
          [{ transform: 'none', opacity: 1 }, { transform: `translateY(${-105 * dir}%)`, opacity: 0 }],
          { duration: 380, delay: n * 60, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }
        );
        sai.onfinish = () => {
          el.textContent = t(l[k]);
          const entra = el.animate(
            [{ transform: `translateY(${105 * dir}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
            { duration: 760, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' }
          );
          sai.cancel();
          entra.onfinish = () => entra.cancel();
        };
      });
    };

    /* duas camadas de fundo que alternam; `corte` = aparece já, sem fade
       (usado quando o clone voador já está a tapar o ecrã) */
    const trocarFundo = async (i, corte) => {
      const novo = fundos[1 - fundoAtivo], velho = fundos[fundoAtivo];
      novo.classList.toggle('is-cut', !!corte);
      novo.src = src(LUGARES[i]);
      try { await novo.decode(); } catch (e) { /* segue mesmo assim */ }
      velho.classList.remove('is-cut');
      novo.classList.add('is-on');
      velho.classList.remove('is-on');
      fundoAtivo = 1 - fundoAtivo;
    };

    /* a assinatura: a foto do cartão cresce até ocupar a secção */
    const voar = (cartao) => new Promise((feito) => {
      const rS = volta.getBoundingClientRect(), rC = cartao.getBoundingClientRect();
      const voo = document.createElement('div');
      voo.className = 'volta__voo';
      voo.innerHTML = `<img src="${cartao.querySelector('img').src}" alt="">`;
      volta.append(voo);
      cartao.classList.add('is-saiu');
      const de = { left: `${rC.left - rS.left}px`, top: `${rC.top - rS.top}px`, width: `${rC.width}px`, height: `${rC.height}px`, borderRadius: '14px' };
      const para = { left: '0px', top: '0px', width: `${rS.width}px`, height: `${rS.height}px`, borderRadius: '0px' };
      voo.animate([de, para], { duration: 1050, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' })
        .onfinish = () => feito(voo);
    });

    const passoFila = () => {
      const c = cartoes.firstElementChild;
      return c ? c.offsetWidth + (parseFloat(getComputedStyle(cartoes).columnGap) || 0) : 0;
    };

    const ir = async (i, cartao) => {
      if (ocupado || i === atual) return;
      ocupado = true;
      const dir = cartao || i === (atual + 1) % N ? 1 : -1;
      const filaVisivel = cartoes.offsetParent !== null && !semMov;
      const passo = passoFila();
      trocarTexto(LUGARES[i], dir);

      if (dir > 0 && filaVisivel) {
        const c = cartao || cartoes.firstElementChild;
        const p = [...cartoes.children].indexOf(c);
        cartoes.classList.add('anda');
        cartoes.style.transform = `translateX(${-(p + 1) * passo}px)`;
        atual = i; marcador();
        const voo = await voar(c);
        await trocarFundo(i, true);
        cartoes.classList.remove('anda');
        cartoes.style.transform = '';
        montarFila();
        voo.remove();
      } else {
        atual = i; marcador();
        trocarFundo(i);
        montarFila();
        if (filaVisivel) {
          /* o antigo lugar volta à cabeça da fila, a entrar pela esquerda */
          cartoes.style.transform = `translateX(${-passo}px)`;
          void cartoes.offsetWidth;
          cartoes.classList.add('anda');
          cartoes.style.transform = '';
          await new Promise((r) => setTimeout(r, 900));
          cartoes.classList.remove('anda');
        } else {
          await new Promise((r) => setTimeout(r, 700));
        }
      }
      ocupado = false;
      reiniciarTempo();
    };

    const seguinte = () => ir((atual + 1) % N);
    const anterior = () => ir((atual - 1 + N) % N);

    /* avanço automático: a barra do topo é o relógio */
    let visto = false;
    const reiniciarTempo = () => {
      tempo.classList.remove('corre');
      if (semMov || !visto) return;
      void tempo.offsetWidth;
      tempo.classList.add('corre');
    };
    tempo.addEventListener('animationend', seguinte);
    new IntersectionObserver(([e]) => {
      const agora = e.intersectionRatio > 0.6;
      if (agora !== visto) { visto = agora; reiniciarTempo(); }
    }, { threshold: [0, 0.6, 1] }).observe(volta);

    const pausa = (on) => volta.classList.toggle('is-pausa', on);
    volta.querySelectorAll('.volta__fila, .volta__controlo, .volta__acoes').forEach((el) => {
      el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') pausa(true); });
      el.addEventListener('pointerleave', () => pausa(false));
    });
    document.addEventListener('visibilitychange', () => pausa(document.hidden));

    /* pré-carrega as fotos grandes quando a secção se aproxima */
    const pre = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      LUGARES.forEach((l) => { new Image().src = src(l); });
      pre.disconnect();
    }, { rootMargin: '100% 0px' });
    pre.observe(volta);

    cartoes.addEventListener('click', (e) => {
      const c = e.target.closest('.volta__cartao');
      if (c) ir(Number(c.dataset.i), c);
    });
    volta.querySelectorAll('.volta__seta').forEach((b) =>
      b.addEventListener('click', () => (Number(b.dataset.dir) > 0 ? seguinte() : anterior()))
    );
    volta.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') seguinte();
      else if (e.key === 'ArrowLeft') anterior();
    });

    /* telemóvel: deslizar para os lados troca de lugar */
    let tx = 0, ty = 0;
    volta.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    volta.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? seguinte : anterior)();
    }, { passive: true });

    montarFila();
    marcador();

    document.addEventListener('idioma', () => {
      Object.entries(campos).forEach(([k, el]) => { el.textContent = t(LUGARES[atual][k]); });
      montarFila();
    });
  }
  const alojTrilho = document.getElementById('alojTrilho');
  if (alojTrilho) carrossel(alojTrilho, document.querySelectorAll('.casa__nav .seta'), '.aloj__cartao');

  /* ── A casa: bolinhas ──
     Uma por cartão; acompanham o deslizar e levam ao cartão ao tocar.
     O CSS só as mostra no telemóvel. */
  const alojPontos = document.getElementById('alojPontos');
  if (alojTrilho && alojPontos) {
    const cartoes = [...alojTrilho.querySelectorAll('.aloj__cartao')];
    const pontos = cartoes.map((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'casa__ponto';
      b.setAttribute('aria-label', `${t('Cartão')} ${i + 1}`);
      b.addEventListener('click', () => {
        alojTrilho.scrollTo({ left: c.offsetLeft - cartoes[0].offsetLeft, behavior: reduz ? 'auto' : 'smooth' });
      });
      alojPontos.append(b);
      return b;
    });
    const marcar = () => {
      const passo = cartoes[1] ? cartoes[1].offsetLeft - cartoes[0].offsetLeft : 1;
      const i = Math.min(cartoes.length - 1, Math.round(alojTrilho.scrollLeft / passo));
      pontos.forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
    };
    alojTrilho.addEventListener('scroll', marcar, { passive: true });

    /* Deslizar com o dedo em qualquer ponto do cartão (não só na foto).
       O CSS dá ao trilho touch-action:pan-y no telemóvel: o scroll vertical
       da página fica com o browser, o horizontal é tratado aqui. */
    let tx = 0, ty = 0, s0 = 0, eixo = null;
    const irPara = (i) => {
      const k = Math.max(0, Math.min(cartoes.length - 1, i));
      alojTrilho.scrollTo({ left: cartoes[k].offsetLeft - cartoes[0].offsetLeft, behavior: reduz ? 'auto' : 'smooth' });
      setTimeout(() => alojTrilho.classList.remove('is-dragging'), reduz ? 0 : 450);
    };
    alojTrilho.addEventListener('touchstart', (e) => {
      tx = e.touches[0].clientX; ty = e.touches[0].clientY;
      s0 = alojTrilho.scrollLeft; eixo = null;
    }, { passive: true });
    alojTrilho.addEventListener('touchmove', (e) => {
      const dx = e.touches[0].clientX - tx, dy = e.touches[0].clientY - ty;
      if (!eixo && Math.abs(dx) + Math.abs(dy) > 8) eixo = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (eixo !== 'x') return;
      alojTrilho.classList.add('is-dragging');
      alojTrilho.scrollLeft = s0 - dx;
    }, { passive: true });
    alojTrilho.addEventListener('touchend', (e) => {
      if (eixo !== 'x') return;
      const dx = e.changedTouches[0].clientX - tx;
      const passo = cartoes[1] ? cartoes[1].offsetLeft - cartoes[0].offsetLeft : 1;
      const base = Math.round(s0 / passo);
      /* 40px chegam para mudar de cartão, sem ser preciso arrastar até meio */
      irPara(Math.abs(dx) > 40 ? base + (dx < 0 ? 1 : -1) : base);
    });
    window.addEventListener('resize', marcar);
    document.addEventListener('idioma', () => pontos.forEach((b, i) => b.setAttribute('aria-label', `${t('Cartão')} ${i + 1}`)));
    marcar();
  }

  /* ── Álbum e vídeos dos alojamentos ──
     A foto do cartão "voa" até ao palco e só depois entra o resto da
     interface. */
  /* versão das fotos: subir quando se trocam imagens com o mesmo nome */
  const FOTO_V = '?v=20260930b';
  const ALBUNS = {
    t0: {
      tipo: 'T0', nome: 'Recanto', pasta: 'assets/img/album/t0/',
      video: 'assets/video/t0.mp4', poster: 'assets/video/t0-poster.jpg',
      fotos: [
        '01.jpg',
        '02.jpg',
        '03.jpg',
        '04.jpg',
        '05.jpg'
      ]
    },
    t1: {
      tipo: 'T1', nome: 'Abrigo de histórias', pasta: 'assets/img/album/t1/',
      video: 'assets/video/t1.mp4', poster: 'assets/video/t1-poster.jpg',
      fotos: [
        '02.jpg',
        '05.jpg',
        '06.jpg',
        '11.jpg',
        '09.jpg',
        '04.jpg',
        '03.jpg',
        '10.jpg',
        '07.jpg',
        '08.jpg',
        '01.jpg'
      ]
    },
    ext: {
      tipo: 'Exterior', nome: '', pasta: 'assets/img/album/ext/',
      video: 'assets/video/ext.mp4', poster: 'assets/video/ext-poster.jpg',
      fotos: ['05.jpg', '01.jpg', '02.jpg', '03.jpg', '06.jpg', '04.jpg']
    }
  };

  const album = document.getElementById('album');
  if (album) {
    const html = document.documentElement;
    const palco = document.getElementById('albumPalco');
    const img = album.querySelector('.album__quadro img');
    const video = album.querySelector('.album__leitor video');
    const titB = album.querySelector('.album__titulo b');
    const titS = album.querySelector('.album__titulo span');
    const contaB = album.querySelector('.album__conta b');
    const contaS = album.querySelector('.album__conta span');
    const minis = album.querySelector('.album__miniaturas');
    const setas = album.querySelectorAll('.album__seta');
    const dois = (n) => String(n).padStart(2, '0');
    const EASE = 'cubic-bezier(.16,1,.3,1)';

    let atual = null, idx = 0, aberto = false, vez = 0, devolver = null;

    const carregar = (el) => (el.decode ? el.decode() : Promise.resolve()).catch(() => {});

    /* Voo: uma cópia da imagem de origem anima posição, tamanho e raio
       até ao retângulo final. Anima-se a caixa (não um scale) para o
       object-fit:cover ir reenquadrando sem deformar. */
    const voar = (src, de, para, raio) => {
      if (reduz || !de) return Promise.resolve();
      const r = de.getBoundingClientRect();
      if (!r.width || r.bottom < 0 || r.top > innerHeight) return Promise.resolve();
      const v = new Image();
      v.src = src; v.alt = ''; v.className = 'album-voo';
      document.body.appendChild(v);
      const caixa = (q, br) => ({
        left: q.left + 'px', top: q.top + 'px', width: q.width + 'px', height: q.height + 'px', borderRadius: br
      });
      const a = v.animate(
        /* aparece por cima da capa num fundido curto, para não haver salto */
        [
          { ...caixa(r, getComputedStyle(de).borderRadius || '16px'), opacity: 0 },
          { opacity: 1, offset: 0.22 },
          { ...caixa(para, raio), opacity: 1 }
        ],
        { duration: 760, easing: EASE, fill: 'forwards' }
      );
      return a.finished.then(() => {
        v.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: 'forwards' })
          .finished.then(() => v.remove());
      });
    };

    const marcar = () => {
      const a = ALBUNS[atual];
      img.alt = `${t(a.tipo)}, ${t('fotografia')} ${idx + 1} ${t('de')} ${a.fotos.length}`;
      contaB.textContent = dois(idx + 1);
      minis.querySelectorAll('.album__mini').forEach((m, i) => {
        const sim = i === idx;
        m.setAttribute('aria-selected', String(sim));
        m.tabIndex = sim ? 0 : -1;
        if (sim && aberto) m.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduz ? 'auto' : 'smooth' });
      });
      /* pré-carrega as vizinhas para a troca ser imediata */
      [idx + 1, idx - 1].forEach((j) => {
        const k = (j + a.fotos.length) % a.fotos.length;
        new Image().src = a.pasta + a.fotos[k] + FOTO_V;
      });
    };

    const ir = (n, dir) => {
      const a = ALBUNS[atual];
      if (!a || album.classList.contains('is-video')) return;
      const total = a.fotos.length;
      const novo = (n + total) % total;
      if (novo === idx) return;
      const minha = ++vez;
      img.style.setProperty('--dir', dir || (novo > idx ? 1 : -1));
      idx = novo;
      marcar();
      const trocar = () => {
        if (minha !== vez) return;
        img.src = a.pasta + a.fotos[idx] + FOTO_V;
        carregar(img).then(() => {
          if (minha !== vez) return;
          img.classList.remove('sai', 'entra');
          void img.offsetWidth;
          img.classList.add('entra');
        });
      };
      if (reduz) { trocar(); return; }
      img.classList.remove('entra');
      img.classList.add('sai');
      setTimeout(trocar, 300);
    };

    const abrir = (chave, modo, origem) => {
      const a = ALBUNS[chave];
      if (!a || aberto) return;
      atual = chave; idx = 0; aberto = true; vez++;
      devolver = document.activeElement;

      const eVideo = modo === 'video';
      album.classList.toggle('is-video', eVideo);
      titB.textContent = t(a.tipo);
      /* o exterior não tem nome próprio: fica só o tipo */
      const nm = a.nome ? t(a.nome) : '';
      titS.textContent = eVideo ? (nm ? `${nm} · ` : '') + t('vídeo') : nm;
      contaS.textContent = dois(a.fotos.length);

      /* miniaturas */
      minis.innerHTML = '';
      if (!eVideo) {
        a.fotos.forEach((f, i) => {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'album__mini';
          b.setAttribute('role', 'tab');
          b.setAttribute('aria-label', `${t('Fotografia')} ${i + 1}`);
          b.innerHTML = '<img src="' + a.pasta + f + FOTO_V + '" alt="" loading="lazy">';
          b.addEventListener('click', () => ir(i, i > idx ? 1 : -1));
          minis.appendChild(b);
        });
      }

      const alvo = eVideo ? video : img;
      img.classList.remove('sai', 'entra');
      if (eVideo) {
        video.poster = a.poster;
        video.src = a.video;
        video.setAttribute('aria-label', `${t('Vídeo do')} ${t(a.tipo)}`);
      } else {
        img.src = a.pasta + a.fotos[0] + FOTO_V;
        marcar();
      }

      album.hidden = false;
      html.classList.add('album-aberto');
      alvo.style.opacity = '0';
      void album.offsetWidth;
      album.classList.add('is-aberto');

      const origemImg = eVideo ? origem : origem && origem.querySelector('.aloj__foto img');
      /* voa já a primeira fotografia do álbum, não a capa do cartão */
      const srcVoo = eVideo ? a.poster : img.src;
      const pronto = eVideo
        ? new Promise((res) => { const p = new Image(); p.onload = p.onerror = res; p.src = a.poster; })
        : carregar(img);

      pronto.then(() => {
        const raio = getComputedStyle(alvo).borderRadius;
        return voar(srcVoo, origemImg, alvo.getBoundingClientRect(), raio);
      }).then(() => {
        if (!aberto) return;
        alvo.style.transition = 'opacity .3s';
        alvo.style.opacity = '';
        album.classList.add('is-pronto');
        if (eVideo) {
          video.currentTime = 0;
          const t = video.play();
          if (t && t.catch) t.catch(() => {});
          video.focus({ preventScroll: true });
        } else {
          album.querySelector('.album__fechar').focus({ preventScroll: true });
        }
        if (!eVideo) marcar();
      });
    };

    const fechar = () => {
      if (!aberto) return;
      aberto = false; vez++;
      video.pause();
      album.classList.remove('is-pronto', 'is-aberto');
      const alvo = album.classList.contains('is-video') ? video : img;
      const saida = reduz ? null : alvo.animate(
        [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.96)' }],
        { duration: 380, easing: EASE, fill: 'forwards' }
      );
      setTimeout(() => {
        if (aberto) return;
        album.hidden = true;
        html.classList.remove('album-aberto');
        if (saida) saida.cancel();
        alvo.style.transition = '';
        video.removeAttribute('src'); video.load();
        if (devolver && devolver.focus) devolver.focus({ preventScroll: true });
      }, reduz ? 0 : 420);
    };

    /* gatilhos: o cartão inteiro abre o álbum, o botão de vídeo abre o vídeo */
    document.querySelectorAll('.aloj__cartao[data-album]').forEach((c) => {
      c.addEventListener('click', (e) => {
        if (e.target.closest('[data-video]')) return;
        abrir(c.dataset.album, 'fotos', c);
      });
    });
    document.querySelectorAll('.aloj__video[data-video]').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        abrir(b.dataset.video, 'video', b.querySelector('.aloj__video-play'));
      });
    });

    album.querySelectorAll('[data-fechar]').forEach((b) => b.addEventListener('click', fechar));
    setas.forEach((b) => b.addEventListener('click', () => ir(idx + Number(b.dataset.dir), Number(b.dataset.dir))));

    /* clicar no vazio do palco fecha; arrastar muda de fotografia */
    let x0 = null, y0 = 0, arrastou = false;
    palco.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; arrastou = false; });
    palco.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        arrastou = true;
        ir(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      }
    });
    palco.addEventListener('click', (e) => {
      if (arrastou) return;
      if (e.target === palco || e.target.classList.contains('album__quadro') || e.target.classList.contains('album__leitor')) fechar();
    });

    /* teclado: setas, Escape e o foco preso dentro do álbum */
    document.addEventListener('keydown', (e) => {
      if (!aberto) return;
      if (e.key === 'Escape') { e.preventDefault(); fechar(); }
      else if (e.key === 'ArrowRight' && e.target !== video) ir(idx + 1, 1);
      else if (e.key === 'ArrowLeft' && e.target !== video) ir(idx - 1, -1);
      else if (e.key === 'Tab') {
        const foco = [...album.querySelectorAll('button, video')].filter(
          (el) => el.offsetParent !== null && el.tabIndex !== -1
        );
        if (!foco.length) return;
        const pri = foco[0], ult = foco[foco.length - 1];
        if (e.shiftKey && document.activeElement === pri) { e.preventDefault(); ult.focus(); }
        else if (!e.shiftKey && document.activeElement === ult) { e.preventDefault(); pri.focus(); }
      }
    });
  }

  /* ── Telemóvel: enquadramento suave entre secções ──
     O scroll-snap nativo é brusco no telemóvel. Aqui, só depois de o dedo
     sair e a página parar: se o início de uma secção estiver a menos de 15%
     do ecrã do topo, a página desliza até ela devagar. No meio de uma
     secção não faz nada; um toque novo cancela. */
  if (!reduz && matchMedia('(max-width:860px)').matches) {
    const telas = [...document.querySelectorAll('main > .tela')];
    let espera = null, tocando = false, anim = null;
    const parar = () => { if (anim) { cancelAnimationFrame(anim); anim = null; } };
    const deslizar = (dist) => {
      const y0 = window.scrollY, t0 = performance.now(), dur = 600;
      const passo = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - k, 3); /* ease-out: abranda no fim */
        window.scrollTo(0, y0 + dist * e);
        anim = k < 1 ? requestAnimationFrame(passo) : null;
      };
      anim = requestAnimationFrame(passo);
    };
    const enquadrar = () => {
      if (tocando || anim || document.documentElement.classList.contains('album-aberto')) return;
      const limite = window.innerHeight * 0.15;
      let melhor = null;
      telas.forEach((el) => {
        const top = el.getBoundingClientRect().top;
        if (Math.abs(top) > 2 && Math.abs(top) < limite && (melhor === null || Math.abs(top) < Math.abs(melhor))) melhor = top;
      });
      if (melhor !== null) deslizar(melhor);
    };
    const agendar = () => {
      if (anim) return;
      clearTimeout(espera);
      espera = setTimeout(enquadrar, 180);
    };
    window.addEventListener('touchstart', () => { tocando = true; parar(); clearTimeout(espera); }, { passive: true });
    window.addEventListener('touchend', () => { tocando = false; agendar(); }, { passive: true });
    window.addEventListener('scroll', agendar, { passive: true });
  }

  /* ── Idioma: PT | EN ──
     O português vive no HTML. O inglês é um dicionário à parte (js/en.js)
     que só se descarrega quando alguém escolhe EN — começa a vir quando o
     rato passa por cima do botão, para o clique ser imediato.
     Na primeira troca percorre-se a página uma vez e guarda-se cada texto
     e atributo traduzível com as duas versões; daí em diante trocar é só
     reescrever essa lista. As partes montadas em JS (À volta, álbum)
     ouvem o evento 'idioma' e redesenham-se com t(). */
  const langBtns = document.querySelectorAll('.lang__opt[data-lang]');
  if (langBtns.length) {
    const html = document.documentElement;
    const CHAVE = 'sidros-idioma';
    const metaDesc = document.querySelector('meta[name="description"]');
    const PT_META = { title: document.title, desc: metaDesc ? metaDesc.content : '' };
    /* zonas que o JS reescreve sozinho, ou que não são texto */
    const SALTA = 'svg, script, style, .lang, .cookies, [data-campo], #voltaCartoes, .album__titulo, .album__conta, .album__miniaturas';
    const SALTA_ATTR = '#burger, #voltaCartoes, .album__quadro, .album__leitor, .album__miniaturas *';
    const ATTRS = ['aria-label', 'alt', 'aria-roledescription'];
    const norm = (s) => s.replace(/\s+/g, ' ').trim();

    let pedido = null, alvos = null;
    const carregarEN = () => pedido || (pedido = new Promise((ok, falha) => {
      const s = document.createElement('script');
      s.src = 'js/en.js?v=20261006d';
      s.onload = () => (window.SIDROS_EN ? ok(window.SIDROS_EN) : falha());
      s.onerror = () => { pedido = null; s.remove(); falha(); };
      document.head.append(s);
    }));

    const recolher = () => {
      const d = EN.t;
      alvos = [];
      /* um elemento cujo conteúdo inteiro (com <em>, <br>…) esteja no
         dicionário troca-se de uma vez; senão desce-se e tenta-se cada texto */
      const varrer = (el) => {
        el.childNodes.forEach((n) => {
          if (n.nodeType === 3) {
            const v = n.nodeValue, k = norm(v);
            if (k && d[k]) {
              const en = v.match(/^\s*/)[0] + d[k] + v.match(/\s*$/)[0];
              alvos.push({ pt: v, en, por: (x) => { n.nodeValue = x; } });
            }
          } else if (n.nodeType === 1 && !n.matches(SALTA)) {
            const pt = n.innerHTML, k = norm(pt);
            if (d[k]) alvos.push({ pt, en: d[k], por: (x) => { n.innerHTML = x; } });
            else varrer(n);
          }
        });
      };
      varrer(document.body);
      document.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(',')).forEach((el) => {
        if (el.closest(SALTA_ATTR)) return;
        ATTRS.forEach((a) => {
          const pt = el.getAttribute(a);
          if (pt && d[pt]) alvos.push({ pt, en: d[pt], por: (x) => el.setAttribute(a, x) });
        });
      });
    };

    const aplicar = (l) => {
      lingua = l;
      const en = l === 'en';
      if (en && !alvos) recolher();
      if (alvos) alvos.forEach((a) => a.por(en ? a.en : a.pt));
      html.lang = en ? 'en' : 'pt-PT';
      document.title = en ? EN.meta.title : PT_META.title;
      if (metaDesc) metaDesc.content = en ? EN.meta.desc : PT_META.desc;
      langBtns.forEach((b) => {
        const sim = b.dataset.lang === l;
        b.classList.toggle('is-on', sim);
        b.setAttribute('aria-pressed', String(sim));
      });
      document.dispatchEvent(new CustomEvent('idioma'));
    };

    const escolher = async (l, semFundido) => {
      if (l === lingua) return;
      if (l === 'en' && !EN) {
        try { EN = await carregarEN(); } catch (e) { return; }
      }
      /* fundido nativo do browser; sem suporte, troca seca */
      if (!semFundido && !reduz && document.startViewTransition) document.startViewTransition(() => aplicar(l));
      else aplicar(l);
      try { localStorage.setItem(CHAVE, l); } catch (e) { /* modo privado */ }
    };

    langBtns.forEach((b) => {
      b.addEventListener('click', () => escolher(b.dataset.lang));
      if (b.dataset.lang === 'en') {
        const antecipar = () => { carregarEN().catch(() => {}); };
        b.addEventListener('pointerenter', antecipar, { once: true });
        b.addEventListener('focus', antecipar, { once: true });
      }
    });

    /* ?lang=en (para partilhar o link em inglês) ou a escolha anterior */
    let inicial = new URLSearchParams(location.search).get('lang');
    if (!inicial) { try { inicial = localStorage.getItem(CHAVE); } catch (e) { /* nada */ } }
    if (inicial === 'en') escolher('en', true);
  }
})();
