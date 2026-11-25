(() => {
  const list = document.querySelector('.achievements');
  if (!list) return;

  const updateFade = () => {
    const hasMoreToShow = list.scrollWidth - list.clientWidth - list.scrollLeft > 2;
    const hasPrevious = list.scrollLeft > 2;
    list.classList.toggle('achievements--fade-right', hasMoreToShow);
    list.classList.toggle('achievements--fade-left', hasPrevious);
  };

  list.addEventListener('scroll', updateFade, { passive: true });
  window.addEventListener('resize', updateFade);
  updateFade();
})();
