/**
 * Связывает короткие слова (1–2 символа) со следующим фрагментом текста
 * неразрывным пробелом, чтобы они не оставались в конце строки.
 */
(function () {
  var TYPOGRAPHY_SELECTORS = [
    '.app-store-case-v2 #task + .case-copy p',
    '.achievement__text',
    '.hero__title',
    '.hero__description',
    '.metric__label',
    '.project__description',
    '.projects-grid__description',
    '.page-inner__title',
    '.page-inner__lead',
    '.page-inner__stat-label',
    '.page-inner__meta-desc',
    '.page-inner__meta-value',
    '.page-inner__meta-value-text',
    '.page-inner__meta-note',
    '.page-inner__section-heading',
    '.page-inner__list-text',
    '.page-inner__solution-title',
    '.page-inner__solution-item-title',
    '.page-inner__solution-item-text',
    '.page-inner__result-metric',
    '.page-inner__result-text',
    '.page-inner__result-text--gmoji',
    '.page-inner__results-column-heading',
    '.page-inner__feature-title',
    '.page-inner__feature-text',
  ];

  /* Любое отдельное слово из 1–2 букв (кириллица/латиница) + пробел + текст после */
  var shortWordPattern = /(?<!\S)([a-zа-яё]{1,2})\s+(?=\S)/gi;

  function bindShortWords(text) {
    return text.replace(shortWordPattern, function (_, word) {
      return word + '\u00A0';
    });
  }

  function processTextNodes(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var textNodes = [];

    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    textNodes.forEach(function (node) {
      node.textContent = bindShortWords(node.textContent);
    });
  }

  function init() {
    TYPOGRAPHY_SELECTORS.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(processTextNodes);
    });
  }

  function scheduleInit() {
    init();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(init);
    }

    window.requestAnimationFrame(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleInit);
    window.addEventListener('load', init);
  } else {
    scheduleInit();
    window.addEventListener('load', init);
  }
  document.addEventListener('transcribe:contentchange', init);
})();
