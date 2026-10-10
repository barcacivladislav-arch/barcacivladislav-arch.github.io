(() => {
  const links = [...document.querySelectorAll('.expertise-index a')];
  const sections = links.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  const index = document.querySelector('.expertise-index');
  if (!links.length || !sections.length || !index) return;

  const setCurrent = (id) => {
    links.forEach((link) => {
      const active = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-current', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  let frame = 0;
  let lockedUntil = 0;
  const sync = () => {
    frame = 0;
    if (performance.now() < lockedUntil) return;
    const stickyIndex = getComputedStyle(index).position === 'sticky' ? index.offsetHeight : 0;
    const marker = (document.querySelector('.site-header')?.offsetHeight || 0) + stickyIndex + 28;
    let current = sections[0];
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= marker) current = section;
    });
    setCurrent(current.id);
  };
  links.forEach((link) => link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    lockedUntil = performance.now() + 3800;
    setCurrent(target.id);
    const positionTarget = () => {
      const headerHeight = document.querySelector('.site-header')?.offsetHeight || 0;
      const stickyIndex = getComputedStyle(index).position === 'sticky' ? index.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + scrollY - headerHeight - stickyIndex - 18;
      scrollTo({ top, behavior: 'auto' });
    };
    const correctionTimes = [0, 90, 220, 480, 850, 1400, 2200, 3200];
    correctionTimes.forEach((delay) => window.setTimeout(positionTarget, delay));
    const correctAfterAssetLoad = (loadEvent) => {
      if (loadEvent.target instanceof HTMLImageElement) positionTarget();
    };
    document.addEventListener('load', correctAfterAssetLoad, true);
    window.setTimeout(() => document.removeEventListener('load', correctAfterAssetLoad, true), 3800);
    history.replaceState(null, '', `#${target.id}`);
  }));
  const requestSync = () => { if (!frame) frame = requestAnimationFrame(sync); };
  addEventListener('scroll', requestSync, { passive: true });
  addEventListener('resize', requestSync, { passive: true });
  setCurrent(sections[0].id);
  sync();
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
  const rails = [...document.querySelectorAll('[data-auto-rail]')];
  if (!rails.length) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) return;

  const states = rails.map((rail) => {
    const track = rail.firstElementChild;
    if (!track) return null;
    const originals = [...track.children];
    if (!originals.length) return null;

    originals.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('a, button, [tabindex]').forEach((node) => node.setAttribute('tabindex', '-1'));
      if (clone.matches('a, button, [tabindex]')) clone.setAttribute('tabindex', '-1');
      track.appendChild(clone);
    });

    const first = originals[0];
    const firstClone = track.children[originals.length];
    const cycle = firstClone.offsetLeft - first.offsetLeft;
    const direction = Number(rail.dataset.autoDirection || 1);
    const state = {
      rail,
      cycle,
      direction,
      speed: Number(rail.dataset.autoSpeed || 26),
      position: direction < 0 ? cycle : 0,
      userUntil: 0
    };
    if (!rail.id) rail.id = `expertise-rail-${Math.random().toString(36).slice(2, 8)}`;
    const controls = document.createElement('div');
    controls.className = 'expertise-rail-control wrap';
    controls.innerHTML = `<span>Drag, scroll or use arrows to explore every work</span><div><button type="button" aria-label="Previous works" aria-controls="${rail.id}">←</button><button type="button" aria-label="Next works" aria-controls="${rail.id}">→</button></div>`;
    rail.before(controls);
    rail.scrollLeft = state.position;
    const pauseForInput = () => {
      state.userUntil = performance.now() + 4200;
      state.position = rail.scrollLeft;
    };
    rail.addEventListener('wheel', pauseForInput, { passive: true });
    rail.addEventListener('pointerdown', pauseForInput, { passive: true });
    rail.addEventListener('touchstart', pauseForInput, { passive: true });
    rail.addEventListener('focusin', pauseForInput);
    rail.addEventListener('mouseenter', pauseForInput);
    controls.querySelectorAll('button').forEach((button, buttonIndex) => button.addEventListener('click', () => {
      pauseForInput();
      rail.scrollBy({ left: rail.clientWidth * (buttonIndex ? .82 : -.82), behavior: 'smooth' });
      window.setTimeout(() => { state.position = rail.scrollLeft; }, 500);
    }));
    return state;
  }).filter(Boolean);

  let previousTime = performance.now();
  const animate = (time) => {
    const delta = Math.min((time - previousTime) / 1000, .05);
    previousTime = time;
    if (!document.hidden) {
      states.forEach((state) => {
        if (state.cycle <= 0 || time < state.userUntil) return;
        state.position += state.speed * state.direction * delta;
        if (state.direction > 0 && state.position >= state.cycle) state.position -= state.cycle;
        if (state.direction < 0 && state.position <= 0) state.position += state.cycle;
        state.rail.scrollLeft = state.position;
      });
    }
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
})();
