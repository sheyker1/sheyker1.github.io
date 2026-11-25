(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const cards = new Set(document.querySelectorAll('a.card--project[href="/transcribe/"], a.card--project[href="/transcribe-design-system/"], a.card--project[href="/gmoji/"]'));
  if (!cards.size) return;

  const label = document.createElement('a');
  label.className = 'project-case-cursor';
  label.innerHTML = `Смотреть кейс
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6"/>
    </svg>`;
  label.setAttribute('aria-hidden', 'true');
  label.tabIndex = -1;
  document.body.appendChild(label);

  let pointerX = null;
  let pointerY = null;
  let activeCard = null;
  let frame = null;
  const setActiveCard = (card) => {
    if (activeCard !== card) {
      if (activeCard) activeCard.classList.remove('project-case-active');
      activeCard = card;
      if (activeCard) {
        activeCard.classList.add('project-case-active');
        label.href = activeCard.href;
      } else {
        label.removeAttribute('href');
      }
    }
    label.classList.toggle('is-visible', !!activeCard);
    document.documentElement.classList.toggle('project-case-cursor-visible', !!activeCard);
  };

  const checkPointerPosition = () => {
    if (pointerX === null || pointerY === null) {
      setActiveCard(null);
      return;
    }
    // The fixed link keeps the native cursor hidden during scrolling.
    // Resolve the project underneath it instead of treating it as the card.
    const target = document.elementsFromPoint(pointerX, pointerY)
      .find((element) => element !== label && !label.contains(element));
    const card = target && target.closest('a.card--project');
    setActiveCard(cards.has(card) ? card : null);
  };

  const updatePointer = (event) => {
    if (event.pointerType === 'touch') return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    label.style.left = pointerX + 'px';
    label.style.top = pointerY + 'px';
    checkPointerPosition();
  };

  const clearPointer = () => {
    pointerX = null;
    pointerY = null;
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    setActiveCard(null);
  };

  const updateAfterScroll = () => {
    // Resolve the new card even when the pointer has not moved.
    checkPointerPosition();
    if (frame !== null) return;
    frame = window.requestAnimationFrame(() => {
      frame = null;
      checkPointerPosition();
    });
  };

  document.addEventListener('pointermove', updatePointer, { passive: true });
  document.addEventListener('pointerover', updatePointer, { passive: true });
  document.addEventListener('pointerout', (event) => {
    if (!event.relatedTarget) clearPointer();
  });
  document.addEventListener('scroll', updateAfterScroll, { capture: true, passive: true });
  window.addEventListener('resize', updateAfterScroll);
  window.addEventListener('blur', clearPointer);
})();
