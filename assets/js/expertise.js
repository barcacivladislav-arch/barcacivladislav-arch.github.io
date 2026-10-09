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
      position: direction < 0 ? cycle : 0
    };
    rail.scrollLeft = state.position;
    return state;
  }).filter(Boolean);

  let previousTime = performance.now();
  const animate = (time) => {
    const delta = Math.min((time - previousTime) / 1000, .05);
    previousTime = time;
    if (!document.hidden) {
      states.forEach((state) => {
        if (state.cycle <= 0) return;
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
