/**
 * Waterford PDP — gallery thumbs (swapImg), qty stepper, add to cart.
 * Matches mockup IDs: #mainImg, #qtyVal
 */
import { addLinesToCart, openCartDrawer } from '@theme/waterford-cart';

function qs(root, sel) {
  return root.querySelector(sel);
}

function qsa(root, sel) {
  return Array.from(root.querySelectorAll(sel));
}

function initGallery(root) {
  const main = qs(root, '#mainImg') || qs(root, '[data-wf-main-img]');
  if (!main) return;

  qsa(root, '[data-wf-thumb], .thumb').forEach((btn) => {
    btn.addEventListener('click', () => {
      const img = qs(btn, 'img');
      if (!img) return;
      main.src = img.currentSrc || img.src;
      main.alt = btn.getAttribute('data-alt') || img.alt || '';
      qsa(root, '.thumb, [data-wf-thumb]').forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    });
  });
}

function syncQtyInput(form, value) {
  const input = qs(form, '[data-wf-qty-input], input[name="quantity"]');
  if (input) input.value = String(value);
}

function initBuyForm(root) {
  const form = qs(root, '[data-wf-buy-form], form.buy-actions');
  if (!form) return;

  const qtyValue = qs(form, '#qtyVal') || qs(form, '[data-qty-value]');
  const dec = qs(form, '[data-qty-dec]');
  const inc = qs(form, '[data-qty-inc]');
  const variantInput = qs(form, '[name="id"]');
  const sellingPlanInput = qs(form, '[name="selling_plan"]');
  const variantSelect = qs(form, '[data-wf-variant-select]');
  const submitBtn = qs(form, '[data-wf-buy-submit]');

  if (dec && qtyValue) {
    dec.addEventListener('click', () => {
      const v = parseInt(qtyValue.textContent || '1', 10) || 1;
      if (v > 1) {
        qtyValue.textContent = String(v - 1);
        syncQtyInput(form, v - 1);
      }
    });
  }
  if (inc && qtyValue) {
    inc.addEventListener('click', () => {
      const v = parseInt(qtyValue.textContent || '1', 10) || 1;
      qtyValue.textContent = String(v + 1);
      syncQtyInput(form, v + 1);
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

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!submitBtn || submitBtn.disabled) return;

    const variantId = Number(variantInput?.value || 0);
    const quantity = Math.max(1, parseInt(qtyValue?.textContent || '1', 10) || 1);
    const sellingPlan = sellingPlanInput?.value || '';
    const defaultLabel = submitBtn.getAttribute('data-label-add') || submitBtn.textContent;
    const addingLabel = submitBtn.getAttribute('data-label-adding') || defaultLabel;
    const addedLabel = submitBtn.getAttribute('data-label-added') || defaultLabel;
    const errorLabel = submitBtn.getAttribute('data-label-error') || defaultLabel;

    /** @type {{ id: number, quantity: number, selling_plan?: number }} */
    const line = { id: variantId, quantity };
    if (sellingPlan) line.selling_plan = Number(sellingPlan);

    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');
    submitBtn.setAttribute('aria-busy', 'true');
    submitBtn.textContent = addingLabel;

    try {
      await addLinesToCart([line]);
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
