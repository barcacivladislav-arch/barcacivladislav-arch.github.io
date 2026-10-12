(() => {
  const hero = document.querySelector('[data-clarity-hero]');
  const stage = hero?.querySelector('[data-compiler-stage]');
  if (!stage) return;

  const tiles = [...stage.querySelectorAll('.compiler-tile')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const columns = () => matchMedia('(max-width: 760px)').matches ? 3 : 4;
  let active = 0;
  let timer = 0;

  const feature = (index) => {
    active = (index + tiles.length) % tiles.length;
    const columnCount = columns();
    const activeRow = Math.floor(active / columnCount);
    const activeColumn = active % columnCount;
    tiles.forEach((tile, tileIndex) => {
      const row = Math.floor(tileIndex / columnCount);
      const column = tileIndex % columnCount;
      const neighbor = Math.abs(row - activeRow) + Math.abs(column - activeColumn) === 1;
      tile.classList.toggle('is-featured', tileIndex === active);
      tile.classList.toggle('is-neighbor', neighbor);
    });
    stage.style.setProperty('--focus-x', `${((activeColumn + .5) / columnCount) * 100}%`);
    stage.style.setProperty('--focus-y', `${((activeRow + .5) / Math.ceil(tiles.length / columnCount)) * 100}%`);
  };

  const startLoop = () => {
    clearInterval(timer);
    if (!reduced && !document.hidden) timer = setInterval(() => feature(active + 1), 4200);
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

  addEventListener('resize', () => feature(active), { passive: true });
  document.addEventListener('visibilitychange', () => document.hidden ? clearInterval(timer) : startLoop());

  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) startLoop();
    else clearInterval(timer);
  }, { threshold: .15 }).observe(hero);
})();
