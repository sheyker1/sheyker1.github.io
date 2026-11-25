(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const boundLinks = new WeakSet();
  const bindLinks = () => document.querySelectorAll('.case-navigation__link').forEach(link => {
    if (boundLinks.has(link)) return;
    boundLinks.add(link);
    let navigating = false;
    let pressStartedAt = 0;
    const startPress = () => {
      if (reduceMotion.matches || pressStartedAt) return;
      pressStartedAt = performance.now();
      link.classList.add('is-click-pressed');
    };
    link.addEventListener('pointerdown', event => {
      if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) startPress();
    });
    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || reduceMotion.matches) return;
      event.preventDefault();
      if (navigating) return;
      navigating = true;
      startPress();
      const remaining = Math.max(0, 320 - (performance.now() - pressStartedAt));
      window.setTimeout(() => window.location.assign(link.href), remaining);
    });
    link.addEventListener('pointerleave', () => {
      if (navigating) return;
      link.classList.remove('is-click-pressed');
      pressStartedAt = 0;
    });
    link.addEventListener('pointercancel', () => {
      link.classList.remove('is-click-pressed');
      pressStartedAt = 0;
    });
  });
  bindLinks();
  document.addEventListener('transcribe:contentchange', bindLinks);
})();
