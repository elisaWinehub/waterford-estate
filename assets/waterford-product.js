/**
 * Waterford PDP: gallery thumbs, qty, purchase-option sync, add to cart.
 * Purchase option selection is exposed via custom event + data attributes
 * so buy-buttons can read selling_plan independently.
 */
(function () {
  const EVENT = 'wf:purchase-option-change';

  function qs(root, sel) {
    return root.querySelector(sel);
  }

  function qsa(root, sel) {
    return Array.from(root.querySelectorAll(sel));
  }

  async function openCartDrawer() {
    try {
      if (window.Shopify?.actions?.updateCart) await window.Shopify.actions.updateCart();
    } catch (_) {}
    try {
      if (window.Shopify?.actions?.openCart) {
        await window.Shopify.actions.openCart();
        return;
      }
    } catch (_) {}
    const drawer = document.querySelector('theme-drawer#cart-drawer');
    if (drawer && typeof drawer.open === 'function') drawer.open();
  }

  function initGallery(root) {
    const main = qs(root, '[data-wf-main-img]');
    if (!main) return;
    qsa(root, '[data-wf-thumb]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const img = qs(btn, 'img');
        if (!img) return;
        main.src = img.currentSrc || img.src;
        main.alt = btn.getAttribute('data-alt') || img.alt || '';
        qsa(root, '[data-wf-thumb]').forEach((t) => {
          t.classList.remove('active');
          t.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      });
    });
  }

  function publishPurchaseOption(root) {
    const checked = qs(root, 'input[name="purchase_option"]:checked');
    const sellingPlan = checked?.getAttribute('data-selling-plan') || '';
    const detail = { sellingPlanId: sellingPlan || null };
    root.dataset.sellingPlanId = sellingPlan;
    root.dispatchEvent(new CustomEvent(EVENT, { bubbles: true, detail }));
    document.dispatchEvent(new CustomEvent(EVENT, { detail }));
  }

  function initPurchaseOptions(root) {
    const wrap = qs(root, '[data-wf-po]');
    if (!wrap) return;

    qsa(wrap, 'input[name="purchase_option"]').forEach((input) => {
      input.addEventListener('change', () => {
        qsa(wrap, '[data-wf-po-card]').forEach((card) => card.classList.remove('is-selected'));
        const card = input.closest('[data-wf-po-card]');
        if (card) card.classList.add('is-selected');

        // Selecting subscribe header radio → auto-select first frequency if present
        if (input.getAttribute('data-po-type') === 'subscribe' && !input.getAttribute('data-selling-plan')) {
          const firstFreq = qs(card, 'input[data-selling-plan]');
          if (firstFreq) {
            firstFreq.checked = true;
            firstFreq.dispatchEvent(new Event('change', { bubbles: true }));
            return;
          }
        }
        publishPurchaseOption(root);
      });
    });

    qsa(wrap, '[data-wf-po-card]').forEach((card) => {
      card.addEventListener('click', (event) => {
        if (event.target instanceof HTMLInputElement) return;
        const radio = qs(card, 'input[name="purchase_option"]');
        if (radio && !radio.checked) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });

    publishPurchaseOption(root);
  }

  function initBuyForm(root) {
    const form = qs(root, '[data-wf-buy-form]');
    if (!form) return;

    const qtyValue = qs(form, '[data-qty-value]');
    const dec = qs(form, '[data-qty-dec]');
    const inc = qs(form, '[data-qty-inc]');
    const variantInput = qs(form, '[name="id"]');
    const sellingPlanInput = qs(form, '[name="selling_plan"]');
    const variantSelect = qs(form, '[data-wf-variant-select]');
    const submitBtn = qs(form, '[data-wf-buy-submit]');

    if (dec && qtyValue) {
      dec.addEventListener('click', () => {
        const v = parseInt(qtyValue.textContent || '1', 10) || 1;
        if (v > 1) qtyValue.textContent = String(v - 1);
      });
    }
    if (inc && qtyValue) {
      inc.addEventListener('click', () => {
        const v = parseInt(qtyValue.textContent || '1', 10) || 1;
        qtyValue.textContent = String(v + 1);
      });
    }

    if (variantSelect && variantInput) {
      variantSelect.addEventListener('change', () => {
        variantInput.value = variantSelect.value;
        const opt = variantSelect.selectedOptions[0];
        if (submitBtn && opt) {
          const available = opt.getAttribute('data-available') === 'true';
          submitBtn.disabled = !available;
          submitBtn.textContent = available
            ? submitBtn.getAttribute('data-label-add') || submitBtn.textContent
            : submitBtn.getAttribute('data-label-sold') || submitBtn.textContent;
        }
      });
    }

    document.addEventListener(EVENT, (event) => {
      if (!sellingPlanInput) return;
      const id = event.detail?.sellingPlanId || '';
      sellingPlanInput.value = id;
      if (!id) sellingPlanInput.removeAttribute('value');
      else sellingPlanInput.value = id;
    });

    // sync from root dataset on load
    if (sellingPlanInput && root.dataset.sellingPlanId) {
      sellingPlanInput.value = root.dataset.sellingPlanId;
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!submitBtn || submitBtn.disabled) return;

      const variantId = Number(variantInput?.value || 0);
      const quantity = Math.max(1, parseInt(qtyValue?.textContent || '1', 10) || 1);
      const sellingPlan = sellingPlanInput?.value || root.dataset.sellingPlanId || '';
      const defaultLabel = submitBtn.getAttribute('data-label-add') || submitBtn.textContent;
      const addingLabel = submitBtn.getAttribute('data-label-adding') || defaultLabel;
      const addedLabel = submitBtn.getAttribute('data-label-added') || defaultLabel;
      const errorLabel = submitBtn.getAttribute('data-label-error') || defaultLabel;

      const payload = { items: [{ id: variantId, quantity }] };
      if (sellingPlan) payload.items[0].selling_plan = Number(sellingPlan);

      submitBtn.disabled = true;
      submitBtn.classList.add('is-loading');
      submitBtn.setAttribute('aria-busy', 'true');
      submitBtn.textContent = addingLabel;

      try {
        const shopRoot = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
        const res = await fetch(`${shopRoot}cart/add.js`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.description || 'Add failed');
        }
        submitBtn.classList.remove('is-loading');
        submitBtn.textContent = addedLabel;
        await openCartDrawer();
      } catch (_) {
        submitBtn.classList.remove('is-loading');
        submitBtn.textContent = errorLabel;
      } finally {
        setTimeout(() => {
          submitBtn.textContent = defaultLabel;
          submitBtn.disabled = false;
          submitBtn.classList.remove('is-loading');
          submitBtn.removeAttribute('aria-busy');
        }, 1400);
      }
    });
  }

  function init(root) {
    if (!(root instanceof HTMLElement) || root.dataset.wfPdpBound === '1') return;
    root.dataset.wfPdpBound = '1';
    initGallery(root);
    initPurchaseOptions(root);
    initBuyForm(root);
  }

  function initAll(scope) {
    qsa(scope || document, '[data-wf-pdp]').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAll());
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', (event) => initAll(event.target));
})();
