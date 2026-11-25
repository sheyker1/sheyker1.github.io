(() => {
  const caseSelector = 'main[data-project-case], main[data-transcribe-case]';
  const main = document.querySelector(caseSelector);
  const nav = main?.querySelector('.project-nav');
  if (!nav || !window.fetch || !history.pushState) return;

  const routes = [...nav.querySelectorAll('.project-nav__link')].map(link => link.pathname);
  const routeFor = pathname => routes.find(route =>
    route === pathname || route === pathname + '/' || route + 'index.html' === pathname);
  let currentRoute = routeFor(location.pathname);
  let intro = main.querySelector('.project-case-intro');
  if (!currentRoute || !intro) return;

  const navs = [nav, document.querySelector('.project-nav--floating')].filter(Boolean);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobileViewport = matchMedia('(max-width: 767px)');
  // Samples of Smooth tab's spring (stiffness 420, damping 38) over 400 ms.
  const spring = [0, .09596, .28299, .47423, .63538, .75817, .84576, .90521, .94392,
    .96819, .98286, .99137, .99609, .99857, .99976, 1.00026, 1];
  const indicatorDuration = 400;
  const appStoreClasses = ['app-store-case', 'app-store-case-v2'];
  const routeClasses = {
    '/transcribe-app-store/': appStoreClasses,
    '/transcribe-subscription/': [...appStoreClasses, 'subscription-case'],
    '/gmoji/': [...appStoreClasses, 'gmoji-case'],
    '/gmoji-loyalty/': [...appStoreClasses, 'gmoji-loyalty-case']
  };
  const caseClasses = new Set(Object.values(routeClasses).flat());
  const mobileMenuLinks = [...document.querySelectorAll('.mobile-header__menu-link')];
  const hasMobileCurrentPage = mobileMenuLinks.some(link => link.getAttribute('aria-current') === 'page');
  const cache = new Map();
  const warmedImages = new Map();
  const positions = new Map();
  const indicators = navs.map(list => {
    const plate = document.createElement('span');
    plate.className = 'project-nav__indicator';
    plate.setAttribute('aria-hidden', 'true');
    list.prepend(plate);
    list.setAttribute('data-smooth-tabs', '');
    return { list, plate, animationFrame: 0, desktopTarget: null, rowWidth: 0, tabWidth: 0 };
  });

  let request = 0;
  let mediaObserver = null;
  let activeEntry = history.state?.transcribeEntry || Date.now();
  let nextEntry = activeEntry;
  history.replaceState({ ...history.state, transcribeEntry: activeEntry }, '');
  history.scrollRestoration = 'manual';
  positions.set(activeEntry, window.scrollY);

  const lerp = (from, to, progress) => from + (to - from) * progress;
  const clamp = (value, max) => Math.min(Math.max(0, max), Math.max(0, value));

  function stopIndicator(item) {
    cancelAnimationFrame(item.animationFrame);
    item.animationFrame = 0;
  }

  function animateIndicator(item, animate, draw) {
    stopIndicator(item);
    if (!animate || reducedMotion.matches) {
      draw(1);
      return;
    }

    const start = performance.now();
    function tick(now) {
      const time = clamp((now - start) / indicatorDuration, 1);
      if (time === 1 || reducedMotion.matches) {
        item.animationFrame = 0;
        draw(1);
        return;
      }
      const sample = time * (spring.length - 1);
      const index = Math.floor(sample);
      draw(clamp(lerp(spring[index], spring[index + 1], sample - index), 1));
      item.animationFrame = requestAnimationFrame(tick);
    }

    draw(0);
    item.animationFrame = requestAnimationFrame(tick);
  }

  function syncFadeScroll(list) {
    list.style.setProperty('--project-nav-scroll-left', `${list.scrollLeft}px`);
  }

  function placeMobileIndicator(item, link, animate) {
    const { list, plate } = item;
    if (item.desktopTarget) {
      stopIndicator(item);
      item.desktopTarget = null;
    }
    const rowWidth = list.clientWidth;
    const active = link.getBoundingClientRect();
    if (!animate && item.animationFrame && rowWidth === item.rowWidth && active.width === item.tabWidth) return;
    item.rowWidth = rowWidth;
    item.tabWidth = active.width;

    const origin = list.getBoundingClientRect().left + list.clientLeft;
    const previous = plate.getBoundingClientRect();
    const fromScroll = list.scrollLeft;
    // Anchor each link's mask to the visible edges of the scrolling row.
    list.style.setProperty('--project-nav-visible-width', `${rowWidth}px`);
    for (const tab of list.querySelectorAll('.project-nav__link')) {
      const left = tab.getBoundingClientRect().left - origin + fromScroll;
      tab.style.setProperty('--project-nav-link-left', `${left}px`);
    }
    const toScroll = clamp(fromScroll + revealDelta(list, link), list.scrollWidth - rowWidth);
    const tabX = active.left - origin + fromScroll;
    const fromWidth = Math.min(previous.width || active.width, rowWidth);
    const toWidth = Math.min(active.width, rowWidth);
    const fromX = clamp(previous.left - origin, rowWidth - fromWidth);
    const toX = clamp(tabX - toScroll, rowWidth - toWidth);
    plate.style.height = `${active.height}px`;

    function draw(progress) {
      list.scrollLeft = lerp(fromScroll, toScroll, progress);
      syncFadeScroll(list);
      // The plate lives in the scrollable row. Convert its visible position back to row coordinates.
      const x = progress === 1
        ? clamp(tabX - list.scrollLeft, rowWidth - toWidth) + list.scrollLeft
        : lerp(fromX, toX, progress) + list.scrollLeft;
      plate.style.transform = `translate(${x}px, ${link.offsetTop}px)`;
      plate.style.width = `${lerp(fromWidth, toWidth, progress)}px`;
    }

    animateIndicator(item, animate && previous.width > 0, draw);
  }

  function placeDesktopIndicator(item, link, animate) {
    const { list, plate } = item;
    const bounds = link.getBoundingClientRect();
    const target = { x: link.offsetLeft, y: link.offsetTop, width: bounds.width, height: bounds.height };
    const previousTarget = item.desktopTarget;
    if (!animate && item.animationFrame && previousTarget &&
        Object.keys(target).every(key => target[key] === previousTarget[key])) return;
    item.desktopTarget = target;

    const row = list.getBoundingClientRect();
    const previous = plate.getBoundingClientRect();
    const x = previous.left - row.left - list.clientLeft + list.scrollLeft;
    const y = previous.top - row.top - list.clientTop + list.scrollTop;
    // Paint the same spring as mobile without handing the final position to Web Animations.
    animateIndicator(item, animate && previous.width > 0, progress => {
      plate.style.transform = `translate(${lerp(x, target.x, progress)}px, ${lerp(y, target.y, progress)}px)`;
      plate.style.width = `${lerp(previous.width, target.width, progress)}px`;
      plate.style.height = `${lerp(previous.height, target.height, progress)}px`;
    });
  }

  function placeIndicators(animate = false) {
    for (const item of indicators) {
      const link = item.list.querySelector('[aria-current="page"]');
      if (!link) continue;
      if (mobileViewport.matches) placeMobileIndicator(item, link, animate);
      else placeDesktopIndicator(item, link, animate);
    }
  }

  function revealDelta(list, link) {
    const bounds = list.getBoundingClientRect();
    const active = link.getBoundingClientRect();
    const style = getComputedStyle(list);
    const left = bounds.left + parseFloat(style.paddingLeft);
    const right = bounds.right - parseFloat(style.paddingRight);
    return active.right > right ? active.right - right : Math.min(0, active.left - left);
  }

  function setCurrentPage(link, route) {
    if (link.pathname === route) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }

  function setActiveRoute(route) {
    for (const list of navs) {
      for (const link of list.querySelectorAll('.project-nav__link')) {
        setCurrentPage(link, route);
      }
      if (!mobileViewport.matches) {
        const delta = revealDelta(list, list.querySelector('[aria-current="page"]'));
        if (delta) list.scrollBy({ left: delta, behavior: 'instant' });
      }
    }
    if (hasMobileCurrentPage) {
      for (const link of mobileMenuLinks) setCurrentPage(link, route);
    }
    placeIndicators(true);
  }

  function rememberPage(route, source, title, description, style, robots) {
    const sourceIntro = source?.querySelector('.project-case-intro');
    const cover = sourceIntro?.parentElement;
    if (!cover?.classList.contains('page-inner__cover')) throw new Error(`Invalid case page: ${route}`);
    return { intro: sourceIntro, sections: [...source.children].filter(node => node !== cover), title, description, style, robots };
  }

  // Keep each page's indexing policy when navigating without a full reload.
  function indexingPolicy(source) {
    return ['robots', 'googlebot'].map(name => ({
      name, content: source.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ?? null
    }));
  }

  const description = document.querySelector('meta[name="description"]');
  const initial = document.createElement('template');
  initial.innerHTML = main.innerHTML;
  for (const card of initial.content.querySelectorAll('.reveal-card')) {
    card.classList.remove('reveal-card', 'is-visible');
  }
  cache.set(currentRoute, Promise.resolve(rememberPage(currentRoute, initial.content,
    document.title, description?.content, document.querySelector('[data-transcribe-style]')?.textContent,
    indexingPolicy(document))));

  function loadPage(route, priority = 'auto') {
    if (cache.has(route)) return cache.get(route);
    const loading = fetch(route, { cache: 'no-cache', priority }).then(async response => {
      if (!response.ok) throw new Error(`Case request failed: ${response.status}`);
      // Template contents stay inert: prefetching markup must not fetch lower media.
      const template = document.createElement('template');
      template.innerHTML = await response.text();
      const page = template.content;
      return rememberPage(route, page.querySelector(caseSelector),
        page.querySelector('title')?.textContent, page.querySelector('meta[name="description"]')?.content,
        page.querySelector('[data-transcribe-style]')?.textContent, indexingPolicy(page));
    }).catch(error => {
      cache.delete(route);
      throw error;
    });
    cache.set(route, loading);
    return loading;
  }

  function warmPage(route, priority = 'low') {
    loadPage(route, priority).then(page => {
      if (route === currentRoute) return;
      const images = [...page.intro.querySelectorAll('img[src]'),
        ...[...(page.sections[0]?.querySelectorAll('img[src]') || [])].slice(0, 2)];
      for (const image of images) {
        const url = new URL(image.getAttribute('src'), location.origin);
        if (url.origin !== location.origin || warmedImages.has(url.href)) continue;
        const preload = new Image();
        preload.fetchPriority = priority;
        preload.src = url.href;
        warmedImages.set(url.href, preload);
      }
    }).catch(() => {});
  }

  function observeVideos() {
    mediaObserver?.disconnect();
    const videos = main.querySelectorAll('video[data-case-autoplay]');
    if (!videos.length || !('IntersectionObserver' in window) || reducedMotion.matches) return;
    mediaObserver = new IntersectionObserver(entries => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) continue;
        mediaObserver.unobserve(target);
        target.muted = target.defaultMuted;
        target.play().catch(() => {});
      }
    });
    for (const video of videos) mediaObserver.observe(video);
  }

  async function navigate(route, url, { entry, from } = {}) {
    const version = ++request;
    if (route === currentRoute) {
      main.removeAttribute('aria-busy');
      if (entry && entry !== activeEntry) {
        activeEntry = entry;
        window.scrollTo({ top: positions.get(entry) || 0, behavior: 'instant' });
      }
      return;
    }
    main.setAttribute('aria-busy', 'true');
    let page;
    try {
      page = await loadPage(route);
    } catch {
      if (version === request) location.assign(url);
      return;
    }
    if (version !== request) return;

    const oldURL = location.origin + currentRoute;
    const atTabs = from && nav.contains(from);
    const scrollTop = entry ? positions.get(entry) || 0 : atTabs ? window.scrollY : 0;
    positions.set(activeEntry, window.scrollY);
    if (entry) activeEntry = entry;
    else {
      activeEntry = ++nextEntry;
      history.pushState({ transcribeEntry: activeEntry }, '', url);
    }
    currentRoute = route;

    if (page.style && !document.querySelector('[data-transcribe-style]')) {
      const style = document.createElement('style');
      style.setAttribute('data-transcribe-style', '');
      style.textContent = page.style;
      document.head.append(style);
    }
    document.body.classList.remove(...caseClasses);
    document.body.classList.add(...(routeClasses[route] || []));
    if (page.title) document.title = page.title;
    if (description && page.description) description.content = page.description;
    for (const { name, content } of page.robots) {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (content === null) meta?.remove();
      else {
        if (!meta) {
          meta = document.createElement('meta');
          meta.name = name;
          document.head.append(meta);
        }
        meta.content = content;
      }
    }

    const incoming = page.intro.cloneNode(true);
    const sections = page.sections.map(section => section.cloneNode(true));
    intro.replaceWith(incoming);
    intro = incoming;
    while (main.lastElementChild !== incoming.parentElement) main.lastElementChild.remove();
    main.append(...sections);
    observeVideos();
    setActiveRoute(route);
    window.scrollTo({ top: scrollTop, behavior: 'instant' });
    if (from && !atTabs) {
      const heading = incoming.querySelector('h1');
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
    document.dispatchEvent(new Event('transcribe:contentchange'));
    if (!entry || incoming.getBoundingClientRect().bottom > 0) {
      incoming.classList.add('project-case-intro--entering');
    }
    main.removeAttribute('aria-busy');
    positions.set(activeEntry, window.scrollY);
    if (typeof window.ym === 'function') window.ym(114570812, 'hit', location.href, { title: document.title, referer: oldURL });
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
        event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
    if (!main.contains(link) && !navs.some(list => list.contains(link))) return;
    if (link.origin !== location.origin || link.search || link.hash) return;
    const route = routeFor(link.pathname);
    if (!route) return;
    event.preventDefault();
    navigate(route, link.href, { from: link });
  }, true);

  for (const list of navs) {
    const warmLink = event => {
      const link = event.target.closest('.project-nav__link');
      if (link && link.pathname !== currentRoute) warmPage(link.pathname, 'auto');
    };
    list.addEventListener('pointerover', warmLink, { passive: true });
    list.addEventListener('focusin', warmLink);
  }

  for (const item of indicators) {
    item.list.addEventListener('scroll', () => {
      if (mobileViewport.matches && !item.animationFrame) syncFadeScroll(item.list);
    }, { passive: true });
    const releaseScroll = () => {
      if (!mobileViewport.matches || !item.animationFrame) return;
      stopIndicator(item);
      const link = item.list.querySelector('[aria-current="page"]');
      const bounds = link.getBoundingClientRect();
      const x = bounds.left - item.list.getBoundingClientRect().left + item.list.scrollLeft;
      item.plate.style.transform = `translate(${x}px, ${link.offsetTop}px)`;
      item.plate.style.width = `${bounds.width}px`;
    };
    item.list.addEventListener('touchstart', releaseScroll, { passive: true });
    item.list.addEventListener('wheel', event => {
      if (event.deltaX || event.shiftKey) releaseScroll();
    }, { passive: true });
  }

  window.addEventListener('scroll', () => positions.set(activeEntry, window.scrollY), { passive: true });
  window.addEventListener('popstate', event => {
    const route = routeFor(location.pathname);
    if (route && event.state?.transcribeEntry) navigate(route, location.href, { entry: event.state.transcribeEntry });
    else location.reload();
  });
  window.addEventListener('resize', () => placeIndicators(), { passive: true });
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(() => placeIndicators());
    for (const list of navs) observer.observe(list);
  }
  document.fonts?.ready.then(() => placeIndicators());
  placeIndicators();
  observeVideos();

  const preload = () => routes.filter(route => route !== currentRoute).forEach(route => warmPage(route));
  if (!navigator.connection?.saveData) {
    if ('requestIdleCallback' in window) requestIdleCallback(preload, { timeout: 1200 });
    else window.setTimeout(preload, 450);
  }
})();
