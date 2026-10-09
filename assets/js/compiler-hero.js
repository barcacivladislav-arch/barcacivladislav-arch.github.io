(() => {
  const hero = document.querySelector('[data-clarity-hero]');
  const stage = hero?.querySelector('[data-compiler-stage]');
  if (!stage) return;

  const tiles = [...stage.querySelectorAll('.compiler-tile')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let active = 0;
  let timer = 0;

  const feature = (index) => {
    active = (index + tiles.length) % tiles.length;
    tiles.forEach((tile, tileIndex) => tile.classList.toggle('is-featured', tileIndex === active));
  };

  const startLoop = () => {
    clearInterval(timer);
    if (!reduced) timer = setInterval(() => feature(active + 1), 3400);
  };

  requestAnimationFrame(() => requestAnimationFrame(() => {
    stage.classList.add('is-assembled');
    feature(0);
    startLoop();
    if (!reduced) setTimeout(() => stage.classList.add('is-interactive'), 1900);
  }));

  tiles.forEach((tile, index) => {
    tile.addEventListener('pointerenter', () => { feature(index); clearInterval(timer); });
    tile.addEventListener('pointerleave', startLoop);
    tile.addEventListener('focus', () => { feature(index); clearInterval(timer); });
    tile.addEventListener('blur', startLoop);
  });

  hero.addEventListener('pointermove', (event) => {
    if (reduced || event.pointerType !== 'mouse') return;
    tiles.forEach((tile) => {
      const rect = tile.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const distance = Math.hypot(dx, dy);
      const reach = 270;
      const pull = Math.max(0, 1 - distance / reach);
      tile.style.setProperty('--pull-x', `${dx * pull * .035}px`);
      tile.style.setProperty('--pull-y', `${dy * pull * .035}px`);
    });
  });

  hero.addEventListener('pointerleave', () => {
    tiles.forEach((tile) => {
      tile.style.setProperty('--pull-x', '0px');
      tile.style.setProperty('--pull-y', '0px');
    });
  });

  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) startLoop();
    else clearInterval(timer);
  }, { threshold: .15 }).observe(hero);
})();
