(() => {
  document.querySelectorAll('.contact__actions .contact-card.interactive-card').forEach(card => {
    let timer;
    card.addEventListener('click', () => {
      card.classList.remove('is-click-pressed');
      void card.offsetWidth;
      card.classList.add('is-click-pressed');
      clearTimeout(timer);
      timer = setTimeout(() => card.classList.remove('is-click-pressed'), 320);
    });
  });
})();
