/**
 * Waterford Estate collection listing:
 * - filter/sort via Section Rendering API with no-JS form fallback
 * - grid/list view toggle (localStorage)
 * - quantity steppers + add to cart
 */
(function () {
  const VIEW_KEY = 'wf-collection-view';

  function qs(root, sel) {
    return root.querySelector(sel);
  }

  function qsa(root, sel) {
    return Array.from(root.querySelectorAll(sel));
  }

  function getCleanUrlFromForm(form) {
    const action = form.getAttribute('action') || window.location.pathname;
    const data = new FormData(form);
    const params = new URLSearchParams();

    for (const [key, value] of data.entries()) {
      if (value === '' || value == null) continue;
      if (key === 'section_id') continue;
      params.append(key, String(value));
    }

    const query = params.toString();
    return query ? `${action}?${query}` : action;
  }

  async function openCartDrawer() {
    try {
      if (window.Shopify?.actions?.updateCart) {
        await window.Shopify.actions.updateCart();
      }
    } catch (_) {
      /* ignore refresh failures; still try to open */
    }

    try {
      if (window.Shopify?.actions?.openCart) {
        await window.Shopify.actions.openCart();
        return;
      }
    } catch (_) {
      /* fall through */
    }

    const drawer = document.querySelector('theme-drawer#cart-drawer');
    if (drawer && typeof drawer.open === 'function') {
      drawer.open();
    }
  }

  function bindCardControls(scope) {
    qsa(scope || document, '[data-wf-card]').forEach((card) => {
      if (card.dataset.wfCardBound === '1') return;
      card.dataset.wfCardBound = '1';

      const qty = qs(card, '[data-wf-qty]');
      if (qty) {
        const valueEl = qs(qty, '[data-qty-value]');
        const dec = qs(qty, '[data-qty-dec]');
        const inc = qs(qty, '[data-qty-inc]');
        if (valueEl && dec && inc) {
          dec.addEventListener('click', () => {
            const v = parseInt(valueEl.textContent || '1', 10) || 1;
            if (v > 1) valueEl.textContent = String(v - 1);
          });
          inc.addEventListener('click', () => {
            const v = parseInt(valueEl.textContent || '1', 10) || 1;
            valueEl.textContent = String(v + 1);
          });
        }
      }

      const btn = qs(card, '[data-wf-add]');
      if (!btn) return;

      btn.addEventListener('click', async (event) => {
        event.preventDefault();
        if (btn.disabled || btn.classList.contains('is-sold-out')) return;

        const variantId = btn.getAttribute('data-variant-id');
        if (!variantId) return;

        const qtyEl = qs(card, '[data-qty-value]');
        const quantity = Math.max(1, parseInt(qtyEl?.textContent || '1', 10) || 1);
        const defaultLabel = btn.getAttribute('data-label-default') || btn.textContent || '';
        const addingLabel = btn.getAttribute('data-label-adding') || defaultLabel;
        const addedLabel = btn.getAttribute('data-label-added') || defaultLabel;
        const errorLabel = btn.getAttribute('data-label-error') || defaultLabel;

        btn.classList.add('is-loading');
        btn.disabled = true;
        btn.setAttribute('aria-busy', 'true');
        btn.textContent = addingLabel;

        try {
          const root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
          const res = await fetch(`${root}cart/add.js`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              items: [{ id: Number(variantId), quantity }],
            }),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.description || 'Add to cart failed');
          }

          btn.classList.remove('is-loading');
          btn.textContent = addedLabel;
          await openCartDrawer();
          setTimeout(() => {
            btn.textContent = defaultLabel;
            btn.disabled = false;
            btn.removeAttribute('aria-busy');
          }, 1200);
        } catch (_) {
          btn.classList.remove('is-loading');
          btn.textContent = errorLabel;
          btn.removeAttribute('aria-busy');
          setTimeout(() => {
            btn.textContent = defaultLabel;
            btn.disabled = false;
          }, 1800);
        }
      });
    });
  }

  class WaterfordCollection {
    /** @param {HTMLElement} root */
    constructor(root) {
      this.root = root;
      this.sectionId = root.dataset.sectionId;
      this.form = qs(root, '[data-wf-facets-form]');
      this.grid = qs(root, '[data-wf-grid]');
      this.abortController = null;
      this.bind();
      this.restoreView();
      bindCardControls(root);
    }

    bind() {
      if (!this.form) return;

      this.form.addEventListener('submit', (event) => {
        if (!this.sectionId) return;
        event.preventDefault();
        this.renderFromForm();
      });

      qsa(this.root, '[data-wf-filter-trigger]').forEach((btn) => {
        btn.addEventListener('click', (event) => {
          event.preventDefault();
          const dd = btn.closest('[data-wf-filter-dd]');
          if (!dd) return;
          const opening = !dd.classList.contains('is-open');
          this.closeAllFilters();
          if (opening) {
            dd.classList.add('is-open');
            btn.setAttribute('aria-expanded', 'true');
            const panel = qs(dd, '[data-wf-filter-panel]');
            const focusable = panel?.querySelector('input, button, select');
            focusable?.focus();
          }
        });
      });

      qsa(this.root, '[data-wf-apply-filter]').forEach((btn) => {
        btn.addEventListener('click', (event) => {
          event.preventDefault();
          this.closeAllFilters();
          this.renderFromForm();
        });
      });

      qsa(this.root, '[data-wf-clear-filter]').forEach((btn) => {
        btn.addEventListener('click', (event) => {
          event.preventDefault();
          const dd = btn.closest('[data-wf-filter-dd]');
          if (!dd) return;
          qsa(dd, 'input[type="checkbox"]').forEach((input) => {
            input.checked = false;
          });
          qsa(dd, 'input[type="number"], input[type="text"]').forEach((input) => {
            input.value = '';
          });
          this.renderFromForm();
        });
      });

      const sortSelect = qs(this.root, '[data-wf-sort]');
      if (sortSelect) {
        sortSelect.addEventListener('change', () => this.renderFromForm());
      }

      qsa(this.root, '[data-wf-view]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const mode = btn.getAttribute('data-wf-view') || 'grid';
          this.setView(mode);
        });
      });

      qsa(this.root, '[data-wf-clear-all]').forEach((el) => {
        el.addEventListener('click', (event) => {
          if (el.tagName === 'A' && this.sectionId) {
            event.preventDefault();
            const href = el.getAttribute('href') || window.location.pathname;
            this.renderUrl(href);
          }
        });
      });

      qsa(this.root, '[data-wf-remove-filter]').forEach((el) => {
        el.addEventListener('click', (event) => {
          if (!this.sectionId) return;
          event.preventDefault();
          const href = el.getAttribute('href');
          if (href) this.renderUrl(href);
        });
      });

      qsa(this.root, '[data-wf-pagination] a').forEach((el) => {
        el.addEventListener('click', (event) => {
          if (!this.sectionId) return;
          event.preventDefault();
          const href = el.getAttribute('href');
          if (href) this.renderUrl(href);
        });
      });

      this.root.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') this.closeAllFilters();
      });
    }

    closeAllFilters() {
      qsa(this.root, '[data-wf-filter-dd]').forEach((dd) => {
        dd.classList.remove('is-open');
        const trigger = qs(dd, '[data-wf-filter-trigger]');
        trigger?.setAttribute('aria-expanded', 'false');
      });
    }

    setView(mode) {
      if (!this.grid) return;
      const isList = mode === 'list';
      this.grid.classList.toggle('list-view', isList);
      try {
        localStorage.setItem(VIEW_KEY, isList ? 'list' : 'grid');
      } catch (_) {
        /* private mode */
      }
      qsa(this.root, '[data-wf-view]').forEach((btn) => {
        const active = btn.getAttribute('data-wf-view') === mode;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    restoreView() {
      let mode = 'grid';
      try {
        mode = localStorage.getItem(VIEW_KEY) || 'grid';
      } catch (_) {
        /* ignore */
      }
      this.setView(mode);
    }

    renderFromForm() {
      if (!this.form) return;
      const url = getCleanUrlFromForm(this.form);
      this.renderUrl(url);
    }

    async renderUrl(url) {
      if (!this.sectionId) {
        window.location.href = url;
        return;
      }

      if (this.abortController) this.abortController.abort();
      this.abortController = new AbortController();

      const requestUrl = new URL(url, window.location.origin);
      requestUrl.searchParams.set('section_id', this.sectionId);

      this.root.classList.add('is-loading');

      try {
        const res = await fetch(requestUrl.toString(), {
          signal: this.abortController.signal,
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });
        if (!res.ok) throw new Error('Section render failed');
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const incoming =
          doc.getElementById(`shopify-section-${this.sectionId}`) ||
          doc.querySelector('[data-wf-collection]') ||
          doc.body;

        const sectionEl = document.getElementById(`shopify-section-${this.sectionId}`);
        if (!sectionEl || !incoming) throw new Error('Missing section markup');

        sectionEl.innerHTML = incoming.innerHTML;

        const clean = new URL(url, window.location.origin);
        clean.searchParams.delete('section_id');
        history.pushState({}, '', clean.pathname + clean.search);

        const nextRoot = sectionEl.querySelector('[data-wf-collection]');
        if (nextRoot) {
          nextRoot.dataset.wfBound = '1';
          new WaterfordCollection(/** @type {HTMLElement} */ (nextRoot));
        }
      } catch (error) {
        if (error && /** @type {Error} */ (error).name === 'AbortError') return;
        window.location.href = url;
      }
    }
  }

  function initAll(scope) {
    qsa(scope || document, '[data-wf-collection]').forEach((root) => {
      if (root.dataset.wfBound === '1') return;
      root.dataset.wfBound = '1';
      new WaterfordCollection(/** @type {HTMLElement} */ (root));
    });
    bindCardControls(scope || document);
  }

  if (!window.__wfCollectionDelegates) {
    window.__wfCollectionDelegates = true;
    document.addEventListener(
      'click',
      (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const openDd = document.querySelector('[data-wf-filter-dd].is-open');
        if (!openDd) return;
        if (openDd.contains(target)) return;
        openDd.classList.remove('is-open');
        openDd.querySelector('[data-wf-filter-trigger]')?.setAttribute('aria-expanded', 'false');
      },
      true
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAll());
  } else {
    initAll();
  }

  window.addEventListener('popstate', () => {
    window.location.reload();
  });

  document.addEventListener('shopify:section:load', (event) => {
    initAll(event.target);
  });
})();
