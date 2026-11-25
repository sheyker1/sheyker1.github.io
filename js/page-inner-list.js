/**
 * Вертикальное выравнивание пункта списка: по центру, если текст в одну строку;
 * по верху, если переносится.
 */
(function () {
  var ITEM_TYPES = [
    {
      selector: '.page-inner__list-item',
      singleLineClass: 'page-inner__list-item--single-line',
      textSelector: '.page-inner__list-text'
    },
    {
      selector: '.page-inner__solution-item',
      singleLineClass: 'page-inner__solution-item--single-line',
      textSelector: '.page-inner__list-text'
    }
  ];

  function isSingleLine(textEl) {
    if (textEl.getClientRects().length > 1) {
      return false;
    }

    var styles = window.getComputedStyle(textEl);
    var lineHeight = parseFloat(styles.lineHeight);

    if (Number.isNaN(lineHeight)) {
      lineHeight = parseFloat(styles.fontSize) * 1.4;
    }

    return textEl.scrollHeight <= lineHeight + 2;
  }

  function updateItem(item, singleLineClass, textSelector) {
    var textEl = item.querySelector(textSelector);
    if (!textEl) {
      return;
    }

    item.classList.toggle(singleLineClass, isSingleLine(textEl));
  }

  function updateAll() {
    ITEM_TYPES.forEach(function (type) {
      document.querySelectorAll(type.selector).forEach(function (item) {
        updateItem(item, type.singleLineClass, type.textSelector);
      });
    });
  }

  function scheduleUpdate() {
    window.requestAnimationFrame(updateAll);
  }

  var observer;

  function observeItems() {
    if (typeof ResizeObserver === 'undefined') return;
    if (!observer) observer = new ResizeObserver(scheduleUpdate);
    observer.disconnect();
    ITEM_TYPES.forEach(function (type) {
      document.querySelectorAll(type.textSelector).forEach(function (textEl) {
        if (textEl.closest(type.selector)) observer.observe(textEl);
      });
    });
  }

  function init() {
    var hasItems = ITEM_TYPES.some(function (type) {
      return document.querySelector(type.selector);
    });

    if (!hasItems && !document.querySelector('main[data-transcribe-case]')) {
      return;
    }

    updateAll();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleUpdate);
    }

    window.addEventListener('resize', scheduleUpdate, { passive: true });

    observeItems();
    document.addEventListener('transcribe:contentchange', function () {
      observeItems();
      scheduleUpdate();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
