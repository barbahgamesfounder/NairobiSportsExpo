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
});
