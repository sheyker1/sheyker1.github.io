/* Keep the current case visible in the horizontally scrollable navigation. */
(function () {
  function revealCurrentPage() {
    document.querySelectorAll('.project-nav').forEach(function (nav) {
      if (nav.hasAttribute('data-smooth-tabs') && window.matchMedia('(max-width: 767px)').matches) return;
      var current = nav.querySelector('[aria-current="page"]');
      if (!current || nav.scrollWidth <= nav.clientWidth) return;

      var bounds = nav.getBoundingClientRect();
      var currentBounds = current.getBoundingClientRect();
      var styles = window.getComputedStyle(nav);
      var leftInset = parseFloat(styles.paddingLeft) || 0;
      var rightInset = parseFloat(styles.paddingRight) || 0;

      if (currentBounds.right > bounds.right - rightInset) {
        nav.scrollLeft += currentBounds.right - bounds.right + rightInset;
      } else if (currentBounds.left < bounds.left + leftInset) {
        nav.scrollLeft -= bounds.left + leftInset - currentBounds.left;
      }
    });
  }

  revealCurrentPage();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(revealCurrentPage);
  }

  document.querySelectorAll('.project-nav').forEach(function (nav) {
    var floatingNav = nav.cloneNode(true);
    var isFloating = false;
    var isPastNavigation = false;
    var isAtPageEnd = false;
    var isScrollingUp = false;
    var lastScrollY = getScrollY();
    var page = nav.closest('.page');
    var mobileHeader = document.querySelector('[data-mobile-floating-header]');
    var mobileViewport = window.matchMedia('(max-width: 767.98px)');
    var isHeaderMenuOpen = false;
    floatingNav.classList.add('project-nav--floating');
    floatingNav.removeAttribute('tabindex');
    floatingNav.setAttribute('aria-hidden', 'true');
    floatingNav.querySelectorAll('a').forEach(function (link) {
      link.setAttribute('tabindex', '-1');
    });
    document.body.appendChild(floatingNav);

    function updateEdgeFades(scrollNav) {
      var hasMoreToShow = scrollNav.scrollWidth - scrollNav.clientWidth - scrollNav.scrollLeft > 2;
      var hasPrevious = scrollNav.scrollLeft > 2;
      scrollNav.classList.toggle('project-nav--fade-right', hasMoreToShow);
      scrollNav.classList.toggle('project-nav--fade-left', hasPrevious);
    }

    [nav, floatingNav].forEach(function (scrollNav) {
      var update = function () { updateEdgeFades(scrollNav); };
      scrollNav.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    });

    function updateFloatingNav() {
      var followMobileHeader = mobileHeader && mobileViewport.matches;
      var showRequested = followMobileHeader
        ? mobileHeader.classList.contains('mobile-header--visible')
        : isScrollingUp;
      var shouldFloat = isPastNavigation && !isAtPageEnd && showRequested && !isHeaderMenuOpen;

      if (shouldFloat === isFloating) return;

      isFloating = shouldFloat;
      if (shouldFloat) floatingNav.classList.remove('project-nav--handoff');
      floatingNav.classList.toggle('project-nav--visible', shouldFloat);
      nav.classList.toggle('project-nav--replaced', shouldFloat);
    }

    document.addEventListener('transcribe:contentchange', function () {
      if (!nav.hasAttribute('data-smooth-tabs') || nav.getBoundingClientRect().bottom <= 0) return;
      // Hand back to the inline row in the same frame as a case jump.
      isPastNavigation = false;
      floatingNav.classList.add('project-nav--handoff');
      updateFloatingNav();
    });

    function syncMobileHeader() {
      isHeaderMenuOpen = !!(mobileHeader && mobileViewport.matches &&
        mobileHeader.classList.contains('mobile-header--menu-open'));
      // Keep the gradient at the viewport top, but place tabs below the header.
      // Retain the inset during slide-out so the tabs do not jump upward.
      if (!isHeaderMenuOpen) {
        var inset = mobileHeader && mobileViewport.matches ? mobileHeader.offsetHeight + 20 : 28;
        floatingNav.style.setProperty('--project-nav-top-inset', inset + 'px');
      }
      updateFloatingNav();
    }

    if (mobileHeader) {
      new MutationObserver(syncMobileHeader).observe(mobileHeader, {
        attributes: true, attributeFilter: ['class']
      });
      if ('ResizeObserver' in window) {
        new ResizeObserver(syncMobileHeader).observe(mobileHeader);
      }
      window.addEventListener('resize', syncMobileHeader);
      syncMobileHeader();
    }

    function getScrollY() {
      var maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      return Math.min(maxScrollY, Math.max(0, window.scrollY));
    }

    window.addEventListener('scroll', function () {
      var scrollY = getScrollY();
      if (scrollY === lastScrollY) return;
      isScrollingUp = scrollY < lastScrollY;
      lastScrollY = scrollY;
      updateFloatingNav();
    }, { passive: true });

    if ('IntersectionObserver' in window) {
      var pageEnd = document.createElement('span');
      pageEnd.className = 'project-nav__page-end';
      pageEnd.setAttribute('aria-hidden', 'true');
      page.appendChild(pageEnd);

      new IntersectionObserver(function (entries) {
        var entry = entries[0];
        isPastNavigation = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0;
        updateFloatingNav();
      }).observe(nav);

      new IntersectionObserver(function (entries) {
        isAtPageEnd = entries[0].isIntersecting;
        updateFloatingNav();
      }).observe(pageEnd);
    } else {
      function updateFloatingNavOnScroll() {
        var navBounds = nav.getBoundingClientRect();
        isPastNavigation = navBounds.bottom <= 0;
        isAtPageEnd = page.getBoundingClientRect().bottom <= window.innerHeight;
        updateFloatingNav();
      }

      window.addEventListener('scroll', updateFloatingNavOnScroll, { passive: true });
      window.addEventListener('resize', updateFloatingNavOnScroll);
      updateFloatingNavOnScroll();
    }
  });
})();
