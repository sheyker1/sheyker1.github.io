(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pressedCard = null;
  let pressStartedAt = 0;
  let navigating = false;

  const getCard = (target) => {
    if (!(target instanceof Element)) return null;
    if (target.closest('.project-case-cursor')) {
      return document.querySelector('a.card--project.project-case-active');
    }
    return target.closest('a.card--project.interactive-card');
  };
  const isPlainClick = (event) => event.button === 0 &&
    !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
  const clearPress = () => {
    if (pressedCard) pressedCard.classList.remove('is-click-pressed');
    pressedCard = null;
    pressStartedAt = 0;
  };
  const startPress = (card) => {
    if (reduceMotion.matches || navigating) return;
    if (pressedCard === card) return;
    clearPress();
    pressedCard = card;
    pressStartedAt = performance.now();
    card.classList.add('is-click-pressed');
  };

  document.addEventListener('pointerdown', (event) => {
    const card = getCard(event.target);
    // Touch feedback starts on click, after the browser confirms a tap.
    // Starting on pointerdown can replay after a delayed mobile click.
    if (card && event.pointerType !== 'touch' && isPlainClick(event)) startPress(card);
  });
  document.addEventListener('click', (event) => {
    const card = getCard(event.target);
    if (!card || event.defaultPrevented || !isPlainClick(event) || reduceMotion.matches) return;
    event.preventDefault();
    if (navigating) return;
    startPress(card);
    navigating = true;
    const href = card.href;
    const remaining = Math.max(0, 320 - (performance.now() - pressStartedAt));
    window.setTimeout(() => window.location.assign(href), remaining);
  });
  document.addEventListener('pointerup', () => {
    window.setTimeout(() => { if (!navigating) clearPress(); }, 0);
  });
  document.addEventListener('pointercancel', () => { if (!navigating) clearPress(); });
  window.addEventListener('blur', () => { if (!navigating) clearPress(); });
  window.addEventListener('pageshow', () => { navigating = false; clearPress(); });
})();
