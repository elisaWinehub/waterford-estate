/**
 * Shared Waterford cart helpers — add lines via Ajax Cart API and notify
 * Horizon listeners (cart drawer morph, cart bubble) via CartLinesUpdateEvent.
 */
import { CartLinesUpdateEvent } from '@shopify/events';

/**
 * @returns {string[]}
 */
function getCartSectionIds() {
  const ids = [];
  document.querySelectorAll('cart-items-component').forEach((el) => {
    if (el instanceof HTMLElement && el.dataset.sectionId) {
      ids.push(el.dataset.sectionId);
    }
  });
  if (!ids.includes('cart-drawer-section')) {
    ids.push('cart-drawer-section');
  }
  return [...new Set(ids)];
}

/**
 * @param {{ id: string|number, quantity: number, selling_plan?: string|number }[]} lines
 */
export async function addLinesToCart(lines) {
  if (!lines?.length) throw new Error('No lines to add');

  const sectionIds = getCartSectionIds();
  const deferred = CartLinesUpdateEvent.createPromise();
  const eventTarget =
    document.querySelector('theme-drawer#cart-drawer') || document;

  eventTarget.dispatchEvent(
    new CartLinesUpdateEvent({
      action: 'add',
      context: 'product',
      lines: lines.map((line) => ({
        merchandiseId: String(line.id),
        quantity: line.quantity,
      })),
      promise: deferred.promise,
    })
  );

  const root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
  const cartAddUrl =
    (window.Theme && window.Theme.routes && window.Theme.routes.cart_add_url) || `${root}cart/add.js`;

  /** @type {{ items: object[], sections?: string, sections_url?: string }} */
  const payload = {
    items: lines.map((line) => {
      /** @type {{ id: number, quantity: number, selling_plan?: number }} */
      const item = {
        id: Number(line.id),
        quantity: Math.max(1, Number(line.quantity) || 1),
      };
      if (line.selling_plan) item.selling_plan = Number(line.selling_plan);
      return item;
    }),
  };

  if (sectionIds.length) {
    payload.sections = sectionIds.join(',');
    payload.sections_url = window.location.pathname;
  }

  try {
    const res = await fetch(cartAddUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.status) {
      throw new Error(data.description || data.message || 'Add to cart failed');
    }

    const cartRes = await fetch(`${root}cart.js`, {
      headers: { Accept: 'application/json' },
    });
    const ajaxCart = await cartRes.json();

    deferred.resolve({
      cart: CartLinesUpdateEvent.createCartFromAjaxResponse(ajaxCart),
      detail: {
        sections: data.sections,
        items: ajaxCart.items,
        itemCount: ajaxCart.item_count,
        source: 'waterford-cart',
        didError: false,
      },
    });

    return { data, ajaxCart };
  } catch (error) {
    deferred.reject(error);
    throw error;
  }
}

export async function openCartDrawer() {
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
