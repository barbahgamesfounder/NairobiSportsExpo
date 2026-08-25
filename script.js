document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');

  if (toggle) {
    toggle.addEventListener('click', () => {
      const isOpen = header.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    document.querySelectorAll('.nav-links a, .nav-ctas a').forEach((link) => {
      link.addEventListener('click', () => {
        header.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Scroll-reveal animations (also drives the pillar-list quest-unlock cascade)
  const reveals = document.querySelectorAll('.reveal, .pillar-list');
  if ('IntersectionObserver' in window && reveals.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    reveals.forEach((el) => observer.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  // Generic form handler: any form with data-endpoint submits via fetch as JSON
  document.querySelectorAll('form[data-endpoint]').forEach((form) => {
    const endpoint = form.getAttribute('data-endpoint');
    const status = form.querySelector('.form-status');
    const submitBtn = form.querySelector('button[type="submit"]');
    const gaEvent = form.getAttribute('data-ga-event');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (status) { status.textContent = 'Sending...'; status.className = 'form-status'; }
      if (submitBtn) submitBtn.disabled = true;

      const formData = new FormData(form);
      const payload = {};
      for (const [key, value] of formData.entries()) {
        if (payload[key] !== undefined) {
          payload[key] = Array.isArray(payload[key]) ? [...payload[key], value] : [payload[key], value];
        } else {
          payload[key] = value;
        }
      }

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error('Request failed');

        const successMsg = form.getAttribute('data-success') || "Thanks — we'll be in touch soon.";
        if (status) { status.textContent = successMsg; status.className = 'form-status success'; }

        if (gaEvent && typeof gtag === 'function') {
          gtag('event', gaEvent, {
            page_path: location.pathname,
            audience_type: payload.audience_type || undefined,
            organisation_type: payload.organisation_type || undefined,
          });
        }

        form.reset();
      } catch (err) {
        if (status) {
          status.textContent = 'Something went wrong. Please try again or email us directly.';
          status.className = 'form-status error';
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });

  // CTA click tracking — any link pointing to the conversion routes
  document.querySelectorAll('a[href="/waitlist"], a[href="/partners"]').forEach((link) => {
    link.addEventListener('click', () => {
      if (typeof gtag !== 'function') return;
      const dest = link.getAttribute('href') === '/waitlist' ? 'waitlist' : 'partners';
      const location_group = link.closest('.nav-ctas') ? 'nav'
        : link.closest('.mobile-cta-bar') ? 'mobile_sticky_bar'
        : link.closest('.hero') ? 'hero'
        : link.closest('.statement') ? 'statement'
        : 'section';
      gtag('event', 'cta_click', {
        cta_destination: dest,
        cta_location: location_group,
        cta_text: link.textContent.trim(),
        page_path: location.pathname,
      });
    });
  });

  // Cursor/touch effects — respect reduced-motion; fine-pointer vs coarse-pointer branch differently
  const canHover = window.matchMedia('(pointer: fine)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Official SDG colors, ordered as a rainbow sweep
  const SDG_RAINBOW = ['#E5243B', '#FD6925', '#FCC30B', '#4C9F38', '#26BDE2', '#0A97D9', '#19486A', '#DD1367'];

  // Hidden combo-counter mini-game, shared by desktop shake detection and
  // mobile tap detection below — one secret, two ways to trigger it.
  let comboCount = 0;
  let comboBadge = null;
  let comboFadeTimer = null;

  function ensureComboBadge() {
    if (comboBadge) return comboBadge;
    comboBadge = document.createElement('div');
    comboBadge.className = 'shake-counter';
    comboBadge.innerHTML = '<span class="shake-counter-label">Secret Found</span><span class="shake-counter-value">0</span>';
    document.body.appendChild(comboBadge);
    return comboBadge;
  }

  function registerCombo() {
    comboCount += 1;
    const color = SDG_RAINBOW[comboCount % SDG_RAINBOW.length];
    const badge = ensureComboBadge();
    badge.querySelector('.shake-counter-value').textContent = comboCount;
    badge.style.setProperty('--shake-color', color);
    badge.classList.remove('pulse');
    void badge.offsetWidth;
    badge.classList.add('pulse', 'is-visible');
    clearTimeout(comboFadeTimer);
    comboFadeTimer = setTimeout(() => badge.classList.remove('is-visible'), 4500);
    return color;
  }

  if (canHover && !reduceMotion) {
    const DOT_COUNT = SDG_RAINBOW.length;
    const trail = document.createElement('div');
    trail.className = 'cursor-trail';

    const dots = Array.from({ length: DOT_COUNT }, (_, i) => {
      const scale = 1 - i / DOT_COUNT;
      const dot = document.createElement('span');
      dot.className = 'cursor-dot';
      const size = 7 + scale * 9;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.opacity = (0.7 * scale).toFixed(2);
      dot.style.background = SDG_RAINBOW[i];
      trail.appendChild(dot);
      return { el: dot, x: window.innerWidth / 2, y: window.innerHeight / 2 };
    });
    document.body.appendChild(trail);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    // Split heading text into per-letter spans so we can ripple color across them
    const RIPPLE_RADIUS = 110;
    const letterEls = [];
    document.querySelectorAll('h1, h2, h3').forEach((heading) => {
      if (heading.closest('.cursor-trail')) return;
      const nodes = Array.from(heading.childNodes);
      const originalLabel = nodes
        .map((node) => (node.nodeType === Node.TEXT_NODE ? node.textContent : node.nodeName === 'BR' ? ' ' : node.textContent || ''))
        .join('')
        .trim()
        .replace(/\s+/g, ' ');
      heading.textContent = '';
      heading.setAttribute('aria-label', originalLabel);
      nodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          Array.from(node.textContent).forEach((ch) => {
            if (ch === ' ') {
              heading.appendChild(document.createTextNode(' '));
              return;
            }
            const span = document.createElement('span');
            span.className = 'letter';
            span.setAttribute('aria-hidden', 'true');
            span.textContent = ch;
            heading.appendChild(span);
            letterEls.push(span);
          });
        } else {
          heading.appendChild(node);
        }
      });
    });

    let rippleTick = 0;
    let frameCount = 0;
    function updateLetterRipple() {
      frameCount += 1;
      if (frameCount % 4 === 0) rippleTick += 1;
      letterEls.forEach((span, i) => {
        const rect = span.getBoundingClientRect();
        if (!rect.width && !rect.height) return;
        const dx = mouseX - (rect.left + rect.width / 2);
        const dy = mouseY - (rect.top + rect.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < RIPPLE_RADIUS) {
          const proximity = 1 - dist / RIPPLE_RADIUS;
          const sdgColor = SDG_RAINBOW[(i + rippleTick) % SDG_RAINBOW.length];
          span.style.color = '#ffffff';
          span.style.textShadow = `0 0 ${6 + proximity * 16}px ${sdgColor}`;
        } else if (span.style.color) {
          span.style.color = '';
          span.style.textShadow = '';
        }
      });
    }

    // Gamified pillar-list items (Explore/Play/Discover/Connect) — glow on cursor proximity
    const PILLAR_RADIUS = 70;
    const pillarItems = Array.from(document.querySelectorAll('.pillar-list .bubble'));
    function updatePillarGlow() {
      pillarItems.forEach((li, i) => {
        const rect = li.getBoundingClientRect();
        if (!rect.width && !rect.height) return;
        const nearestX = Math.max(rect.left, Math.min(mouseX, rect.right));
        const nearestY = Math.max(rect.top, Math.min(mouseY, rect.bottom));
        const dist = Math.hypot(mouseX - nearestX, mouseY - nearestY);
        if (dist < PILLAR_RADIUS) {
          li.style.setProperty('--pillar-glow', SDG_RAINBOW[(i + rippleTick) % SDG_RAINBOW.length]);
          li.classList.add('pillar-active');
        } else {
          li.classList.remove('pillar-active');
        }
      });
    }

    // Water ripple rings, spawned as the cursor moves (throttled)
    let lastRipple = 0;
    const RIPPLE_INTERVAL = 90;
    function spawnRipple(x, y) {
      const ripple = document.createElement('span');
      ripple.className = 'water-ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      document.body.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    }

    // Hidden shake-counter mini-game — rapid back-and-forth motion in
    // roughly the same spot activates the shared combo counter.
    const SHAKE_MIN_DELTA = 12;
    const SHAKE_MAX_INTERVAL = 500;
    const SHAKE_MAX_RANGE = 140;
    const SHAKE_SAMPLE_WINDOW = 900;
    let shakeDir = 0;
    let lastShakeTime = 0;
    let shakeSamples = [];

    function shakeInRange() {
      if (shakeSamples.length < 2) return false;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      shakeSamples.forEach((s) => {
        if (s.x < minX) minX = s.x;
        if (s.x > maxX) maxX = s.x;
        if (s.y < minY) minY = s.y;
        if (s.y > maxY) maxY = s.y;
      });
      return (maxX - minX) < SHAKE_MAX_RANGE && (maxY - minY) < SHAKE_MAX_RANGE;
    }

    window.addEventListener('mousemove', (e) => {
      const prevX = mouseX;
      mouseX = e.clientX;
      mouseY = e.clientY;
      const now = performance.now();
      if (now - lastRipple > RIPPLE_INTERVAL) {
        lastRipple = now;
        spawnRipple(mouseX, mouseY);
      }

      shakeSamples.push({ x: mouseX, y: mouseY, t: now });
      while (shakeSamples.length && now - shakeSamples[0].t > SHAKE_SAMPLE_WINDOW) shakeSamples.shift();

      const dx = mouseX - prevX;
      if (Math.abs(dx) > SHAKE_MIN_DELTA) {
        const dir = dx > 0 ? 1 : -1;
        if (shakeDir !== 0 && dir !== shakeDir && (now - lastShakeTime) < SHAKE_MAX_INTERVAL && shakeInRange()) {
          registerCombo();
        }
        shakeDir = dir;
        lastShakeTime = now;
      }
    });

    (function animateTrail() {
      let targetX = mouseX;
      let targetY = mouseY;
      dots.forEach((dot) => {
        dot.x += (targetX - dot.x) * 0.35;
        dot.y += (targetY - dot.y) * 0.35;
        dot.el.style.transform = `translate(${dot.x}px, ${dot.y}px) translate(-50%, -50%)`;
        targetX = dot.x;
        targetY = dot.y;
      });
      if (letterEls.length) updateLetterRipple();
      if (pillarItems.length) updatePillarGlow();
      requestAnimationFrame(animateTrail);
    })();
  }

  // Mobile equivalent — tapping repeatedly in the same spot (TikTok-style)
  // glows an SDG ring at each tap and drives the same shared combo counter.
  if (!canHover && !reduceMotion) {
    const TAP_RANGE = 50;
    const TAP_MAX_INTERVAL = 650;
    let lastTapX = null;
    let lastTapY = null;
    let lastTapTime = 0;

    function spawnTapRing(x, y, color) {
      const ring = document.createElement('span');
      ring.className = 'tap-ring';
      ring.style.left = `${x}px`;
      ring.style.top = `${y}px`;
      ring.style.setProperty('--ring-color', color);
      document.body.appendChild(ring);
      ring.addEventListener('animationend', () => ring.remove());
    }

    document.addEventListener('touchstart', (e) => {
      if (!e.touches || !e.touches.length) return;
      const touch = e.touches[0];
      const x = touch.clientX;
      const y = touch.clientY;
      const now = performance.now();
      const dist = lastTapX === null ? Infinity : Math.hypot(x - lastTapX, y - lastTapY);
      const inCombo = dist < TAP_RANGE && (now - lastTapTime) < TAP_MAX_INTERVAL;
      const color = inCombo ? registerCombo() : SDG_RAINBOW[comboCount % SDG_RAINBOW.length];
      spawnTapRing(x, y, color);
      lastTapX = x;
      lastTapY = y;
      lastTapTime = now;
    }, { passive: true });
  }
});
