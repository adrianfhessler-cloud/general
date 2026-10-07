// BREWÉ — motion layer: reveals, split text, tilt, magnetic buttons, scroll story, AJAX cart.
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const root = document.documentElement;
  root.classList.add('js');

  // Split headline text into letters for staggered entrance.
  function splitText() {
    document.querySelectorAll('[data-split]').forEach((el) => {
      if (el.dataset.splitDone) return;
      const words = el.textContent.trim().split(/\s+/);
      el.setAttribute('aria-label', el.textContent.trim());
      el.textContent = '';
      let i = 0;
      words.forEach((word, wi) => {
        const w = document.createElement('span');
        w.className = 'split-word';
        w.setAttribute('aria-hidden', 'true');
        [...word].forEach((ch) => {
          const s = document.createElement('span');
          s.className = 'split-char';
          s.style.setProperty('--i', i++);
          s.textContent = ch;
          w.appendChild(s);
        });
        el.appendChild(w);
        if (wi < words.length - 1) el.appendChild(document.createTextNode(' '));
      });
      el.dataset.splitDone = '1';
    });
  }

  // Reveal elements as they enter the viewport.
  function reveals() {
    const items = document.querySelectorAll('[data-reveal], [data-split]');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    items.forEach((el) => io.observe(el));
  }

  // 3D tilt with glare for product cards.
  function tilt() {
    if (reduceMotion || !finePointer) return;
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      let raf = 0;
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`);
          card.style.setProperty('--ry', `${(x * 12).toFixed(2)}deg`);
          card.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`);
          card.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`);
        });
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  // Buttons that lean towards the cursor.
  function magnetic() {
    if (reduceMotion || !finePointer) return;
    document.querySelectorAll('[data-magnetic]').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.transform = '';
      });
    });
  }

  // Soft gold light that follows the cursor.
  function cursorGlow() {
    const glow = document.querySelector('.cursor-glow');
    if (!glow || reduceMotion || !finePointer) return;
    let x = window.innerWidth / 2, y = window.innerHeight / 2, cx = x, cy = y;
    window.addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; glow.classList.add('is-on'); }, { passive: true });
    (function frame() {
      cx += (x - cx) * 0.12;
      cy += (y - cy) * 0.12;
      glow.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(frame);
    })();
  }

  // Header turns solid after scrolling; scroll-linked CSS variables.
  function scrollState() {
    const header = document.querySelector('.site-header');
    const parallax = document.querySelectorAll('[data-parallax]');
    const stories = document.querySelectorAll('[data-story]');
    let ticking = false;

    function update() {
      const y = window.scrollY;
      if (header) header.classList.toggle('is-scrolled', y > 40);
      root.style.setProperty('--scroll', y.toFixed(0));

      if (!reduceMotion) {
        parallax.forEach((el) => {
          const r = el.getBoundingClientRect();
          const speed = parseFloat(el.dataset.parallax) || 0.15;
          const offset = (r.top + r.height / 2 - window.innerHeight / 2) * speed;
          el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
        });
      }

      // Pinned ritual story: progress 0..1 across the section, activates steps.
      stories.forEach((story) => {
        const r = story.getBoundingClientRect();
        const total = r.height - window.innerHeight;
        const p = Math.min(Math.max(-r.top / (total || 1), 0), 1);
        story.style.setProperty('--progress', p.toFixed(4));
        const steps = story.querySelectorAll('[data-step]');
        const active = Math.min(Math.floor(p * steps.length), steps.length - 1);
        steps.forEach((s, i) => s.classList.toggle('is-active', i === active));
        story.querySelectorAll('[data-step-visual]').forEach((v, i) => v.classList.toggle('is-active', i === active));
      });
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // Animated counters ("18 bar", "93 °C", ...).
  function counters() {
    const els = document.querySelectorAll('[data-count]');
    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const decimals = (el.dataset.count.split('.')[1] || '').length;
      if (reduceMotion) { el.textContent = target.toFixed(decimals); return; }
      const start = performance.now();
      const dur = 1600;
      (function step(now) {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 4);
        el.textContent = (target * eased).toFixed(decimals);
        if (t < 1) requestAnimationFrame(step);
      })(start);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.6 });
    els.forEach((el) => io.observe(el));
  }

  // AJAX add-to-cart with a flying "bean" toward the cart icon.
  function cart() {
    const countEl = document.querySelector('[data-cart-count]');
    document.addEventListener('submit', async (e) => {
      const form = e.target.closest('form[action$="/cart/add"]');
      if (!form || !window.fetch) return;
      e.preventDefault();
      const btn = form.querySelector('[type="submit"]');
      btn && btn.classList.add('is-loading');
      try {
        const res = await fetch(window.Shopify && Shopify.routes ? `${Shopify.routes.root}cart/add.js` : '/cart/add.js', {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form),
        });
        if (!res.ok) throw new Error((await res.json()).description || 'Error');
        const cartRes = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
        const data = await cartRes.json();
        if (countEl) {
          countEl.textContent = data.item_count;
          countEl.classList.remove('bump');
          void countEl.offsetWidth;
          countEl.classList.add('bump');
        }
        flyToCart(btn, countEl);
        btn && btn.classList.add('is-added');
        setTimeout(() => btn && btn.classList.remove('is-added'), 1800);
      } catch (err) {
        form.submit();
      } finally {
        btn && btn.classList.remove('is-loading');
      }
    });

    function flyToCart(from, to) {
      if (reduceMotion || !from || !to) return;
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      const bean = document.createElement('span');
      bean.className = 'fly-bean';
      document.body.appendChild(bean);
      const dx = b.left + b.width / 2 - (a.left + a.width / 2);
      const dy = b.top + b.height / 2 - (a.top + a.height / 2);
      bean.style.left = `${a.left + a.width / 2}px`;
      bean.style.top = `${a.top + a.height / 2}px`;
      bean.animate(
        [
          { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 },
          { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5 - 120}px)) scale(1.3) rotate(220deg)`, opacity: 1, offset: 0.5 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.3) rotate(420deg)`, opacity: 0.2 },
        ],
        { duration: 900, easing: 'cubic-bezier(.6,.05,.3,1)' },
      ).onfinish = () => bean.remove();
    }
  }

  // Mobile menu.
  function menu() {
    const toggle = document.querySelector('[data-menu-toggle]');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open);
    });
  }

  // Product page: gallery thumbnails + quantity stepper.
  function product() {
    document.querySelectorAll('[data-thumb]').forEach((t) => {
      t.addEventListener('click', () => {
        const main = document.querySelector('[data-main-image]');
        if (!main) return;
        main.classList.remove('swap');
        void main.offsetWidth;
        main.src = t.dataset.thumb;
        main.srcset = '';
        main.classList.add('swap');
      });
    });
    document.querySelectorAll('[data-qty]').forEach((wrap) => {
      const input = wrap.querySelector('input');
      wrap.querySelectorAll('button').forEach((b) =>
        b.addEventListener('click', () => {
          input.value = Math.max(1, (parseInt(input.value, 10) || 1) + (b.dataset.dir === 'up' ? 1 : -1));
        }),
      );
    });
  }

  function init() {
    splitText();
    reveals();
    tilt();
    magnetic();
    cursorGlow();
    scrollState();
    counters();
    cart();
    menu();
    product();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
