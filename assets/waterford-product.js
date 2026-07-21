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

function getOrCreateLightbox() {
  let lightbox = document.querySelector('[data-wf-zoom-lightbox]');
  if (lightbox) return lightbox;

  lightbox = document.createElement('div');
  lightbox.className = 'wf-zoom-lightbox';
  lightbox.setAttribute('data-wf-zoom-lightbox', '');
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Zoomed product image');
  lightbox.innerHTML =
    '<button type="button" class="wf-zoom-lightbox__close" data-wf-zoom-close aria-label="Close zoom">&times;</button>' +
    '<img class="wf-zoom-lightbox__img" data-wf-zoom-img alt="" />';
  document.body.appendChild(lightbox);

  const close = () => {
    lightbox.classList.remove('is-open');
    document.body.classList.remove('wf-zoom-open');
  };

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox || event.target.closest('[data-wf-zoom-close]')) {
      close();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && lightbox.classList.contains('is-open')) {
      close();
    }
  });

  return lightbox;
}

function openZoom(src, alt) {
  if (!src) return;
  const lightbox = getOrCreateLightbox();
  const img = qs(lightbox, '[data-wf-zoom-img]');
  if (!img) return;
  img.src = src;
  img.alt = alt || '';
  lightbox.classList.add('is-open');
  document.body.classList.add('wf-zoom-open');
}

function initGallery(root) {
  const main = qs(root, '#mainImg') || qs(root, '[data-wf-main-img]');
  if (!main) return;

  const trigger = qs(root, '[data-wf-zoom-trigger], .pdp-photo');

  qsa(root, '[data-wf-thumb], .thumb').forEach((btn) => {
    btn.addEventListener('click', () => {
      const fullSrc = btn.getAttribute('data-full-src');
      const zoomSrc = btn.getAttribute('data-zoom-src') || fullSrc;
      const img = qs(btn, 'img');
      if (!img && !fullSrc) return;

      if (fullSrc) {
        main.src = fullSrc;
        main.removeAttribute('srcset');
      } else if (img) {
        main.src = img.currentSrc || img.src;
      }

      main.alt = btn.getAttribute('data-alt') || img?.alt || '';
      if (zoomSrc) main.setAttribute('data-zoom-src', zoomSrc);

      qsa(root, '.thumb, [data-wf-thumb]').forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    });
  });

  if (trigger) {
    const openFromTrigger = (event) => {
      // Ignore clicks that originated on a thumb control inside the gallery
      if (event.target.closest('.thumb, [data-wf-thumb]')) return;
      const src = main.getAttribute('data-zoom-src') || main.currentSrc || main.src;
      openZoom(src, main.alt);
    };

    trigger.addEventListener('click', openFromTrigger);
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openFromTrigger(event);
      }
    });
  }
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
