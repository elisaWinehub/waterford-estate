/**
 * Wine Club — benefits popup for frequency cards
 */
(function () {
  function closeModal(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    document.body.classList.remove('wc-modal-open');
  }

  function openModal(dialog) {
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    document.body.classList.add('wc-modal-open');
  }

  function init() {
    document.querySelectorAll('[data-wc-benefits-open]').forEach((btn) => {
      if (btn.dataset.wcBound === '1') return;
      btn.dataset.wcBound = '1';
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-wc-modal');
        const dialog = id ? document.getElementById(id) : null;
        openModal(dialog);
      });
    });

    document.querySelectorAll('[data-wc-benefits-modal]').forEach((dialog) => {
      if (dialog.dataset.wcBound === '1') return;
      dialog.dataset.wcBound = '1';

      dialog.querySelectorAll('[data-wc-benefits-close]').forEach((closeBtn) => {
        closeBtn.addEventListener('click', () => closeModal(dialog));
      });

      dialog.addEventListener('click', (event) => {
        if (event.target === dialog) closeModal(dialog);
      });

      dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeModal(dialog);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', init);
})();
