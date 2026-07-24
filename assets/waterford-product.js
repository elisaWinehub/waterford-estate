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

const PO_EVENT = 'wf:purchase-option-change';

function formatMoney(cents, moneyFormat) {
  const amount = Number(cents) || 0;
  if (window.Shopify?.formatMoney) {
    return window.Shopify.formatMoney(amount, moneyFormat || window.Shopify.money_format);
  }
  const value = (amount / 100).toFixed(2);
  if (moneyFormat && moneyFormat.includes('{{amount}}')) {
    return moneyFormat.replace(/\{\{\s*amount\s*\}\}/g, value);
  }
  if (moneyFormat && moneyFormat.includes('{{amount_no_decimals}}')) {
    return moneyFormat.replace(/\{\{\s*amount_no_decimals\s*\}\}/g, String(Math.round(amount / 100)));
  }
  return `R ${value}`;
}

function saleCents(baseCents, discountPct) {
  const base = Number(baseCents) || 0;
  const pct = Math.max(0, Math.min(100, Number(discountPct) || 0));
  return Math.round((base * (100 - pct)) / 100);
}

function publishPurchaseOption(root, detail) {
  root.dataset.sellingPlanId = detail.sellingPlanId || '';
  root.dispatchEvent(new CustomEvent(PO_EVENT, { bubbles: true, detail }));
  document.dispatchEvent(new CustomEvent(PO_EVENT, { detail }));
}

function updateMainPrice(root, { sale, compare, discount }) {
  const box = qs(root, '[data-wf-price]');
  if (!box) return;
  const valueEl = qs(box, '[data-wf-price-value]');
  const compareEl = qs(box, '[data-wf-compare-price]');
  const badgeEl = qs(box, '[data-wf-discount-badge]');
  const format = qs(root, '[data-wf-po]')?.getAttribute('data-money-format') || '';

  if (valueEl) valueEl.textContent = formatMoney(sale, format);

  if (compareEl) {
    if (discount > 0 && compare > sale) {
      compareEl.textContent = formatMoney(compare, format);
      compareEl.hidden = false;
    } else {
      compareEl.textContent = '';
      compareEl.hidden = true;
    }
  }

  if (badgeEl) {
    if (discount > 0) {
      badgeEl.textContent = `${discount}% off`;
      badgeEl.hidden = false;
    } else {
      badgeEl.textContent = '';
      badgeEl.hidden = true;
    }
  }
}

function renderCardPrice(el, { base, sale, discount, format }) {
  if (!el) return;
  if (discount > 0 && sale < base) {
    el.innerHTML = `<s class="po-compare">${formatMoney(base, format)}</s><span class="po-sale">${formatMoney(sale, format)}</span>`;
  } else {
    el.textContent = formatMoney(base, format);
  }
}

function initPurchaseOptions(root) {
  const wrap = qs(root, '[data-wf-po], .po-wrap');
  if (!wrap) return;

  const baseCents = Number(wrap.getAttribute('data-base-cents') || 0);
  const moneyFormat = wrap.getAttribute('data-money-format') || '';

  function selectedState() {
    const checked = qs(wrap, 'input[name="purchase_option"]:checked');
    const card = checked?.closest('[data-wf-po-card], .po-card');
    const select = card ? qs(card, '[data-po-freq-select]') : null;
    const option = select?.selectedOptions?.[0];

    let discount = Number(checked?.getAttribute('data-discount') || 0);
    let sellingPlanId = checked?.getAttribute('data-selling-plan') || '';
    let sale = saleCents(baseCents, discount);

    if (checked?.getAttribute('data-po-type') === 'subscribe' && option) {
      discount = Number(option.getAttribute('data-discount') || discount || 0);
      sellingPlanId = option.getAttribute('data-selling-plan') || '';
      const explicitSale = option.getAttribute('data-sale-cents');
      sale = explicitSale != null && explicitSale !== '' ? Number(explicitSale) : saleCents(baseCents, discount);
    }

    return {
      type: checked?.getAttribute('data-po-type') || 'onetime',
      discount,
      sale,
      compare: baseCents,
      sellingPlanId,
      card,
      select,
    };
  }

  function syncUI() {
    const state = selectedState();

    qsa(wrap, '[data-wf-po-card], .po-card').forEach((card) => {
      const isSelected = card === state.card;
      card.classList.toggle('is-selected', isSelected);
      const select = qs(card, '[data-po-freq-select]');
      if (select) select.disabled = !isSelected;

      const priceEl = qs(card, '[data-po-card-price]');
      const badge = qs(card, '[data-po-save-badge]');
      if (card.getAttribute('data-po-type') === 'subscribe') {
        const opt = qs(card, '[data-po-freq-select]')?.selectedOptions?.[0];
        const disc = Number(opt?.getAttribute('data-discount') || 0);
        const sale = Number(opt?.getAttribute('data-sale-cents') || saleCents(baseCents, disc));
        renderCardPrice(priceEl, { base: baseCents, sale, discount: disc, format: moneyFormat });
        if (badge) badge.textContent = disc > 0 ? `${disc}% off` : '';
      } else {
        renderCardPrice(priceEl, { base: baseCents, sale: baseCents, discount: 0, format: moneyFormat });
      }
    });

    updateMainPrice(root, state);
    publishPurchaseOption(root, {
      sellingPlanId: state.sellingPlanId || null,
      discount: state.discount,
      saleCents: state.sale,
      baseCents,
      type: state.type,
    });
  }

  qsa(wrap, 'input[name="purchase_option"]').forEach((input) => {
    input.addEventListener('change', () => {
      if (input.getAttribute('data-po-type') === 'subscribe') {
        const card = input.closest('[data-wf-po-card], .po-card');
        const select = card && qs(card, '[data-po-freq-select]');
        if (select) select.disabled = false;
      }
      syncUI();
    });
  });

  qsa(wrap, '[data-po-freq-select]').forEach((select) => {
    select.addEventListener('change', () => {
      const card = select.closest('[data-wf-po-card], .po-card');
      const radio = card && qs(card, 'input[name="purchase_option"]');
      if (radio && !radio.checked) {
        radio.checked = true;
      }
      syncUI();
    });
    // Clicking the dropdown should select subscribe
    select.addEventListener('focus', () => {
      const card = select.closest('[data-wf-po-card], .po-card');
      const radio = card && qs(card, 'input[name="purchase_option"]');
      if (radio && !radio.checked) {
        radio.checked = true;
        syncUI();
      }
    });
  });

  qsa(wrap, '[data-wf-po-card], .po-card').forEach((card) => {
    card.addEventListener('click', (event) => {
      if (event.target instanceof HTMLSelectElement || event.target.closest('select')) return;
      if (event.target instanceof HTMLInputElement) return;
      const radio = qs(card, 'input[name="purchase_option"]');
      if (radio && !radio.checked) {
        radio.checked = true;
        syncUI();
      }
    });
  });

  syncUI();
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

  document.addEventListener(PO_EVENT, (event) => {
    if (!sellingPlanInput) return;
    const id = event.detail?.sellingPlanId || '';
    sellingPlanInput.value = id;
  });

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

function upgradeYoutubeThumbs(root) {
  qsa(root, 'img[data-wf-yt-thumb]').forEach((img) => {
    const id = img.getAttribute('data-wf-yt-thumb');
    if (!id) return;
    const max = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
    const probe = new Image();
    probe.onload = () => {
      // maxresdefault returns a tiny placeholder when missing (~120px wide)
      if (probe.naturalWidth > 200) img.src = max;
    };
    probe.src = max;
  });
}

async function fetchOgImage(url) {
  if (!url) return null;

  try {
    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}&palette=false&audio=false&video=false&iframe=false`);
    if (res.ok) {
      const json = await res.json();
      const image = json?.data?.image?.url || json?.data?.logo?.url || null;
      if (image) return { image, title: json?.data?.title || '' };
    }
  } catch (_) {
    /* try fallback */
  }

  try {
    const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const html = await res.text();
    const imageMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    const titleMatch =
      html.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
    if (imageMatch?.[1]) {
      return { image: imageMatch[1], title: titleMatch?.[1] || '' };
    }
  } catch (_) {
    /* ignore */
  }

  return null;
}

function initMediaCards(root) {
  upgradeYoutubeThumbs(root);

  qsa(root, '[data-wf-og-url]').forEach(async (thumb) => {
    if (thumb.dataset.wfOgBound === '1') return;
    thumb.dataset.wfOgBound = '1';

    const url = thumb.getAttribute('data-wf-og-url');
    const img = qs(thumb, '[data-wf-og-target]');
    if (!url || !img) return;

    const meta = await fetchOgImage(url);
    thumb.classList.remove('is-loading-og');
    if (!meta?.image) return;

    img.src = meta.image;
    img.hidden = false;
    img.removeAttribute('hidden');

    const card = thumb.closest('.media-card');
    const titleEl = card && qs(card, '[data-wf-og-title]');
    if (titleEl && !titleEl.textContent.trim() && meta.title) {
      titleEl.textContent = meta.title;
    }
  });
}

function syncGalleryStickyOffset() {
  const header = document.querySelector('.navbar10_component');
  if (!header) return;
  const apply = () => {
    const h = Math.ceil(header.getBoundingClientRect().height);
    if (h > 0) {
      document.documentElement.style.setProperty('--wf-header-offset', `${h}px`);
    }
  };
  apply();
  if (!window.__wfHeaderOffsetBound) {
    window.__wfHeaderOffsetBound = true;
    window.addEventListener('resize', apply, { passive: true });
  }
}

function initAccordion(root) {
  const items = qsa(root, '.acc-item');
  if (!items.length) return;

  items.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      items.forEach((other) => {
        if (other !== item) other.removeAttribute('open');
      });
    });
  });
}

function init(root) {
  if (!(root instanceof HTMLElement) || root.dataset.wfPdpBound === '1') return;
  root.dataset.wfPdpBound = '1';
  syncGalleryStickyOffset();
  initGallery(root);
  initPurchaseOptions(root);
  initBuyForm(root);
  initMediaCards(root);
  initAccordion(root);
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
