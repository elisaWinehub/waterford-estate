// Desktop hover-open dropdowns with leave-delay; click/keyboard toggle for accessibility & mobile.
(function () {
  var CLOSE_DELAY = 300;
  var dropdowns = document.querySelectorAll('.navbar10_menu-dropdown');
  var isDesktop = function () { return window.matchMedia('(min-width: 992px)').matches; };

  dropdowns.forEach(function (dd) {
    var toggle = dd.querySelector('.navbar10_dropdown-toggle');
    var list = dd.querySelector('.navbar10_dropdown-list');
    if (!toggle || !list) return;
    var closeTimer = null;

    function open() {
      clearTimeout(closeTimer);
      list.classList.add('w--open');
      toggle.setAttribute('aria-expanded', 'true');
    }
    function close() {
      list.classList.remove('w--open');
      toggle.setAttribute('aria-expanded', 'false');
    }
    function scheduleClose() {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(close, CLOSE_DELAY);
    }

    dd.addEventListener('mouseenter', function () { if (isDesktop()) open(); });
    dd.addEventListener('mouseleave', function () { if (isDesktop()) scheduleClose(); });

    toggle.addEventListener('click', function (e) {
      // Let top-level nav labels navigate (e.g. Members → /pages/membership).
      // Chevron / empty toggle area still opens/closes the dropdown.
      var link = e.target.closest('a[href]');
      if (link && toggle.contains(link)) {
        var href = link.getAttribute('href');
        if (href && href !== '#' && href.indexOf('javascript:') !== 0) {
          return;
        }
      }
      e.preventDefault();
      var isOpen = list.classList.contains('w--open');
      // close all others
      dropdowns.forEach(function (other) {
        if (other !== dd) {
          var otherList = other.querySelector('.navbar10_dropdown-list');
          var otherToggle = other.querySelector('.navbar10_dropdown-toggle');
          if (otherList) otherList.classList.remove('w--open');
          if (otherToggle) otherToggle.setAttribute('aria-expanded', 'false');
        }
      });
      isOpen ? close() : open();
    });
  });

  // mobile hamburger
  var navButton = document.querySelector('.navbar10_menu-button');
  var navMenu = document.querySelector('.navbar10_menu');
  if (navButton && navMenu) {
    navButton.addEventListener('click', function () {
      var open = navButton.classList.toggle('w--open');
      navButton.setAttribute('aria-expanded', open ? 'true' : 'false');
      navMenu.style.display = open ? 'block' : '';
    });
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.navbar10_menu-dropdown')) {
      dropdowns.forEach(function (dd) {
        var list = dd.querySelector('.navbar10_dropdown-list');
        var toggle = dd.querySelector('.navbar10_dropdown-toggle');
        if (list) list.classList.remove('w--open');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      });
    }
  });
})();