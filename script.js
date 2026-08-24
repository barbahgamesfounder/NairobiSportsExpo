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

  // Scroll-reveal animations
  const reveals = document.querySelectorAll('.reveal');
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

  // CTA click tracking — any link pointing to the two conversion routes
  document.querySelectorAll('a[href="/waitlist"], a[href="/express-interest"]').forEach((link) => {
    link.addEventListener('click', () => {
      if (typeof gtag !== 'function') return;
      const dest = link.getAttribute('href') === '/waitlist' ? 'waitlist' : 'express_interest';
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

  // Cursor trail + water ripple — fine-pointer devices only, respects reduced-motion
  const canHover = window.matchMedia('(pointer: fine)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (canHover && !reduceMotion) {
    // Official SDG colors, ordered as a rainbow sweep
    const SDG_RAINBOW = ['#E5243B', '#FD6925', '#FCC30B', '#4C9F38', '#26BDE2', '#0A97D9', '#19486A', '#DD1367'];

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
            const span = document.createElement('span');
            span.className = 'letter';
            span.setAttribute('aria-hidden', 'true');
            span.textContent = ch === ' ' ? ' ' : ch;
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

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      const now = performance.now();
      if (now - lastRipple > RIPPLE_INTERVAL) {
        lastRipple = now;
        spawnRipple(mouseX, mouseY);
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
      requestAnimationFrame(animateTrail);
    })();
  }
});
