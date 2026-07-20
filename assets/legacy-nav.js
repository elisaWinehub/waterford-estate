/**
 * Waterford Estate legacy nav — replaces Webflow IX2 runtime.
 * Desktop: hover open with ~300ms close delay; click/keyboard also works.
 * Mobile (<991px): hamburger toggles menu; dropdowns are click accordions.
 */
(function () {
  const COLLAPSE_MQ = window.matchMedia('(max-width: 991px)');
  const CLOSE_DELAY = 300;

  function qs(root, sel) {
    return root.querySelector(sel);
  }

  function qsa(root, sel) {
    return Array.from(root.querySelectorAll(sel));
  }

  function isMobile() {
    return COLLAPSE_MQ.matches;
  }

  function setExpanded(toggle, open) {
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    const dropdown = toggle.closest('.w-dropdown, .navbar10_menu-dropdown');
    if (dropdown) dropdown.classList.toggle('w--open', open);
    const list = dropdown && (qs(dropdown, '.w-dropdown-list') || qs(dropdown, '.navbar10_dropdown-list'));
    if (list) {
      list.classList.toggle('w--open', open);
      list.style.display = open ? 'block' : '';
    }
  }

  function closeAll(nav, except) {
    qsa(nav, '.w-dropdown, .navbar10_menu-dropdown').forEach((dd) => {
      if (except && dd === except) return;
      const toggle = qs(dd, '[aria-haspopup], .navbar10_dropdown-toggle, .w-dropdown-toggle');
      setExpanded(toggle, false);
    });
  }

  function initDropdown(dd, nav) {
    const toggle =
      qs(dd, '.w-dropdown-toggle') ||
      qs(dd, '.navbar10_dropdown-toggle') ||
      qs(dd, '[aria-haspopup="menu"]') ||
      qs(dd, '[aria-haspopup="true"]');
    if (!toggle) return;

    if (!toggle.hasAttribute('aria-expanded')) toggle.setAttribute('aria-expanded', 'false');
    if (!toggle.hasAttribute('aria-haspopup')) toggle.setAttribute('aria-haspopup', 'menu');

    let closeTimer = null;

    const open = () => {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      closeAll(nav, dd);
      setExpanded(toggle, true);
    };

    const scheduleClose = () => {
      if (isMobile()) return;
      if (closeTimer) clearTimeout(closeTimer);
      closeTimer = setTimeout(() => setExpanded(toggle, false), CLOSE_DELAY);
    };

    const cancelClose = () => {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    };

    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      const openNow = toggle.getAttribute('aria-expanded') !== 'true';
      if (openNow) open();
      else setExpanded(toggle, false);
    });

    toggle.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle.click();
      }
      if (event.key === 'Escape') setExpanded(toggle, false);
    });

    dd.addEventListener('mouseenter', () => {
      if (isMobile()) return;
      cancelClose();
      open();
    });
    dd.addEventListener('mouseleave', scheduleClose);
  }

  function initNav(root) {
    if (!(root instanceof HTMLElement) || root.dataset.wfNavBound === '1') return;
    root.dataset.wfNavBound = '1';

    const nav = qs(root, '.navbar10_component') || root;
    const menu = qs(nav, '.navbar10_menu') || qs(nav, '.w-nav-menu');
    const button = qs(nav, '.navbar10_menu-button') || qs(nav, '.w-nav-button');

    qsa(nav, '.w-dropdown, .navbar10_menu-dropdown').forEach((dd) => initDropdown(dd, nav));

    if (button && menu) {
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', 'Menu');
      button.addEventListener('click', () => {
        const open = !menu.classList.contains('w--open');
        menu.classList.toggle('w--open', open);
        button.classList.toggle('w--open', open);
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
        nav.classList.toggle('w--open', open);
        if (!open) closeAll(nav);
      });
    }

    document.addEventListener('click', (event) => {
      const t = event.target;
      if (!(t instanceof Node)) return;
      if (!nav.contains(t)) {
        closeAll(nav);
        if (menu) menu.classList.remove('w--open');
        if (button) {
          button.classList.remove('w--open');
          button.setAttribute('aria-expanded', 'false');
        }
        nav.classList.remove('w--open');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeAll(nav);
        if (menu) menu.classList.remove('w--open');
        if (button) button.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function initAgeGate(root) {
    const modal = qs(root, '.age-gate-modal-wrapper') || document.querySelector('.wf-chrome .age-gate-modal-wrapper');
    if (!modal) return;

    const KEY = 'wf_age_verified';
    try {
      if (localStorage.getItem(KEY) === '1') {
        modal.style.display = 'none';
        return;
      }
    } catch (_) {}

    modal.style.display = '';

    const yes = document.getElementById('yes-over-18');
    const no = document.getElementById('no-under-18');
    const warn = document.getElementById('age-gate-warning');

    if (yes) {
      yes.addEventListener('click', (event) => {
        event.preventDefault();
        try {
          localStorage.setItem(KEY, '1');
        } catch (_) {}
        modal.style.display = 'none';
      });
    }
    if (no) {
      no.addEventListener('click', (event) => {
        event.preventDefault();
        if (warn) warn.style.display = 'block';
      });
    }

    qsa(modal, 'a, button').forEach((btn) => {
      if (btn.id === 'yes-over-18' || btn.id === 'no-under-18') return;
      const text = (btn.textContent || '').toLowerCase();
      if (!text.includes('close')) return;
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        if (warn) warn.style.display = 'none';
      });
    });
  }

  function initAll() {
    qsa(document, '.wf-chrome.wf-header, .wf-header').forEach(initNav);
    initAgeGate(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', initAll);
})();
