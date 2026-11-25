(function () {
  var cleanups = [];

  function bindGallery(gallery) {
    var track = gallery.querySelector('[data-gallery-track]');
    var controls = gallery.querySelector('[data-gallery-controls]');
    var previous = gallery.querySelector('[data-gallery-previous]');
    var next = gallery.querySelector('[data-gallery-next]');
    if (!track || !controls || !previous || !next) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var frame = null;

    function updateControls() {
      frame = null;
      var maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      previous.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= maxScroll - 2;
      controls.hidden = maxScroll <= 2;
    }

    function scheduleUpdate() {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(updateControls);
    }

    function scrollTo(left) {
      track.scrollTo({
        left: Math.max(0, Math.min(left, track.scrollWidth - track.clientWidth)),
        behavior: reduceMotion.matches ? 'instant' : 'smooth'
      });
    }

    function move(direction) {
      var items = track.children;
      var step = items.length > 1
        ? items[1].getBoundingClientRect().left - items[0].getBoundingClientRect().left
        : track.clientWidth;
      scrollTo(track.scrollLeft + direction * step);
    }

    previous.addEventListener('click', function () { move(-1); });
    next.addEventListener('click', function () { move(1); });
    track.addEventListener('scroll', scheduleUpdate, { passive: true });
    track.addEventListener('keydown', function (event) {
      if (event.target !== track || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === 'ArrowLeft') move(-1);
      else if (event.key === 'ArrowRight') move(1);
      else if (event.key === 'Home') scrollTo(0);
      else if (event.key === 'End') scrollTo(track.scrollWidth);
      else return;
      event.preventDefault();
    });

    var observer;
    if ('ResizeObserver' in window) {
      observer = new ResizeObserver(scheduleUpdate);
      observer.observe(track);
    } else {
      window.addEventListener('resize', scheduleUpdate, { passive: true });
    }
    updateControls();

    cleanups.push(function () {
      if (observer) observer.disconnect();
      else window.removeEventListener('resize', scheduleUpdate);
      if (frame !== null) window.cancelAnimationFrame(frame);
    });
  }

  function init() {
    cleanups.forEach(function (cleanup) { cleanup(); });
    cleanups = [];
    document.querySelectorAll('[data-case-gallery]').forEach(bindGallery);
  }

  init();
  document.addEventListener('transcribe:contentchange', init);
})();
