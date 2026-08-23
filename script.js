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

  // Cursor trail — fine-pointer devices only, respects reduced-motion
  const canHover = window.matchMedia('(pointer: fine)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (canHover && !reduceMotion) {
    const DOT_COUNT = 8;
    const trail = document.createElement('div');
    trail.className = 'cursor-trail';

    const dots = Array.from({ length: DOT_COUNT }, (_, i) => {
      const scale = 1 - i / DOT_COUNT;
      const dot = document.createElement('span');
      dot.className = 'cursor-dot';
      const size = 6 + scale * 8;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.opacity = (0.55 * scale).toFixed(2);
      trail.appendChild(dot);
      return { el: dot, x: window.innerWidth / 2, y: window.innerHeight / 2 };
    });
    document.body.appendChild(trail);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
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
      requestAnimationFrame(animateTrail);
    })();
  }
});
