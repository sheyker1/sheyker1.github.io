(function () {
  var isHome = document.body.classList.contains("home-page");
  var selector = ".page > main > .page__container.card, .page > main > .page__container.projects-grid";
  if (!isHome) selector += ", .page > footer.page__container.card";
  var pending = new Set();
  var observer = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      if (entry.intersectionRatio === 0 && entry.target.hasAttribute("data-reveal-near-achievements-end")) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
      pending.delete(entry.target);
    });
  }, { threshold: 0.01 }) : null;

  function observeCard(card, showImmediately) {
    if (!observer || showImmediately) {
      card.classList.add("is-visible");
    } else {
      pending.add(card);
      observer.observe(card);
    }
  }

  function observeNearAchievementsEnd(card) {
    var achievements = document.querySelector(".card--hero .achievements");
    var entrance = achievements?.getAnimations?.().find(function (animation) {
      return animation.animationName === "hero-section-enter";
    });
    function observe() { observeCard(card); }
    if (!entrance) {
      observe();
      return;
    }

    var beforeEnd = entrance.ready.then(function () {
      var remaining = entrance.effect.getComputedTiming().endTime - entrance.currentTime;
      return new Promise(function (resolve) {
        window.setTimeout(resolve, Math.max(0, remaining - 700));
      });
    });
    Promise.race([beforeEnd, entrance.finished]).then(observe, observe);
  }

  function observeCards(afterNavigation) {
    pending.forEach(function (card) {
      if (card.isConnected) return;
      observer.unobserve(card);
      pending.delete(card);
    });

    var cards = Array.prototype.slice.call(document.querySelectorAll(selector));
    var cardsToReveal = isHome ? cards.filter(function (card) {
      return !card.matches(".card--hero");
    }) : cards;
    cardsToReveal.forEach(function (card) {
      if (card.classList.contains("reveal-card")) return;
      card.classList.add("reveal-card");
      if (card.hasAttribute("data-reveal-near-achievements-end")) {
        observeNearAchievementsEnd(card);
        return;
      }
      var bounds = afterNavigation ? card.getBoundingClientRect() : null;
      observeCard(card, bounds && bounds.top < window.innerHeight && bounds.bottom > 0);
    });
  }

  observeCards(false);
  document.addEventListener("transcribe:contentchange", function () { observeCards(true); });
})();
