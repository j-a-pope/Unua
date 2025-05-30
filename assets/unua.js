document.addEventListener('DOMContentLoaded', () => {
  // === Tooltips ===
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

  // === Flash message helper ===
  globalThis.flashMessage = ({message = '', reload = false, type = 'info'}) => {
    let key = 'flash-message';
    let sessionMessage = sessionStorage.getItem(key);
    if (message === '' && sessionMessage) {
      FOSSBilling.message(sessionMessage, type);
      sessionStorage.removeItem(key);
      return;
    }
    if (message) {
      sessionStorage.setItem(key, message);
      if (typeof reload === 'boolean' && reload) {
        bb.reload();
      } else if (typeof reload === 'string') {
        bb.redirect(reload);
      }
    }
  };
  flashMessage({});

  // === Currency selector ===
  const currencySelector = document.querySelectorAll('select.currency_selector');
  currencySelector.forEach(function (select) {
    select.addEventListener('change', function () {
      API.guest.post('cart/set_currency', {currency: select.value}, function(response) {
        location.reload();
      }, function(error) {
        FOSSBilling.message(error);
      });
    });
  });

  // === Toast autohide fix ===
  document.addEventListener('shown.bs.toast', e => {
    const toast = bootstrap.Toast.getInstance(e.target);
    if (toast && toast._config) {
      toast._config.autohide = false;
    }
  });

  // === Dynamic text contrast based on --bg-dark ===
  const parseHSL = (hsl) => {
    const match = hsl.match(/^hsl\(\s*(\d+),\s*(\d+)%\s*,\s*(\d+)%\s*\)$/i);
    return match ? {
      h: parseInt(match[1], 10),
      s: parseInt(match[2], 10),
      l: parseInt(match[3], 10)
    } : null;
  };

  const isLightColor = (hsl) => {
    const parsed = parseHSL(hsl);
    return parsed ? parsed.l > 60 : true;
  };

  const bgDark = getComputedStyle(document.documentElement).getPropertyValue('--bg-dark').trim();
  const text = getComputedStyle(document.documentElement).getPropertyValue('--text').trim();
  const preferredText = isLightColor(bgDark) ? text : 'white';
  document.documentElement.style.setProperty('--text-on-bg-dark', preferredText);

  // === Scroll toggle class ===
  document.addEventListener('scroll', function () {
    document.body.classList.toggle('scrolled', window.scrollY > 300);
  });

  // === Menu toggle ===
  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('nav-links');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
  }

  // === Unified section nav highlight on scroll ===
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.section-nav a');
  function activateCurrentLink() {
    let fromTop = window.scrollY + 100;
    sections.forEach(section => {
      const id = section.getAttribute('id');
      const link = document.querySelector(`.section-nav a[href="#${id}"]`);
      if (!link) return;
      if (section.offsetTop <= fromTop && section.offsetTop + section.offsetHeight > fromTop) {
        navLinks.forEach(link => link.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }
  window.addEventListener('scroll', activateCurrentLink);
  activateCurrentLink();

  // === Language selector ===
  document.body.addEventListener('click', function (e) {
    const link = e.target.closest('.language_selector');
    if (link) {
      e.preventDefault();
      const locale = link.dataset.locale;
      document.cookie = `BBLANG=${locale};path=/;max-age=604800`;
      window.location.reload();
    }
  });

  // === Support ticket form submission ===
  if (document.body.classList.contains('support-tickets')) {
    const form = document.getElementById('ticket-submit');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        API.client.post('support/ticket_create',
          new FormData(form).serializeObject(),
          (res) => bb.redirect('/client/support/ticket/' + res),
          (res) => FOSSBilling.message(`${res.message} (${res.code})`, 'error')
        );
      });
    }
  }
});
