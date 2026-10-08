(() => {
  const links = [...document.querySelectorAll('.expertise-index a')];
  const sections = links.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if (!links.length || !sections.length || !('IntersectionObserver' in window)) return;

  const setCurrent = (id) => {
    links.forEach((link) => {
      const active = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-current', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
    if (visible[0]) setCurrent(visible[0].target.id);
  }, { rootMargin: '-25% 0px -58% 0px', threshold: [0, .15, .5] });

  sections.forEach((section) => observer.observe(section));
  setCurrent(sections[0].id);
})();

(() => {
  const tiles = [...document.querySelectorAll('.ad-tile')];
  const gallery = document.querySelector('[data-ad-gallery]');
  if (!tiles.length || !gallery) return;

  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    tiles.forEach((tile) => tile.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting) return;
    tiles.forEach((tile) => tile.classList.add('is-visible'));
    observer.disconnect();
  }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });

  observer.observe(gallery);
})();

(() => {
  const showcase = document.querySelector('[data-newsletter-showcase]');
  const rail = showcase?.querySelector('[data-newsletter-rail]');
  const previous = showcase?.querySelector('[data-newsletter-prev]');
  const next = showcase?.querySelector('[data-newsletter-next]');
  const toggle = showcase?.querySelector('[data-newsletter-toggle]');
  if (!rail || !previous || !next || !toggle) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reducedMotion.matches;
  let timer;

  const step = () => {
    const card = rail.querySelector('.newsletter-hook');
    if (!card) return rail.clientWidth * .8;
    const gap = parseFloat(getComputedStyle(card.parentElement).gap) || 0;
    return card.getBoundingClientRect().width + gap;
  };

  const move = (direction) => {
    const atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - step() * .35;
    if (direction > 0 && atEnd) rail.scrollTo({ left: 0, behavior: 'smooth' });
    else rail.scrollBy({ left: step() * direction, behavior: 'smooth' });
  };

  const stopTimer = () => {
    if (timer) window.clearInterval(timer);
    timer = undefined;
  };

  const startTimer = () => {
    stopTimer();
    if (paused || reducedMotion.matches || document.hidden) return;
    timer = window.setInterval(() => move(1), 3200);
  };

  const setPaused = (value) => {
    paused = value;
    toggle.textContent = paused ? 'Play' : 'Pause';
    toggle.setAttribute('aria-pressed', String(paused));
    startTimer();
  };

  previous.addEventListener('click', () => { move(-1); startTimer(); });
  next.addEventListener('click', () => { move(1); startTimer(); });
  toggle.addEventListener('click', () => setPaused(!paused));
  showcase.addEventListener('mouseenter', stopTimer);
  showcase.addEventListener('mouseleave', startTimer);
  showcase.addEventListener('focusin', stopTimer);
  showcase.addEventListener('focusout', (event) => {
    if (!showcase.contains(event.relatedTarget)) startTimer();
  });
  document.addEventListener('visibilitychange', startTimer);
  reducedMotion.addEventListener?.('change', () => setPaused(reducedMotion.matches));

  setPaused(paused);
})();
