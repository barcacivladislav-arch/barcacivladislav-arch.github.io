(() => {
  const rail = document.querySelector('[data-home-rail]');
  const section = document.querySelector('.capability-section--gateway');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.body.classList.add('home-motion-ready');

  section?.querySelectorAll('.capability-gateway__disciplines span').forEach((item, index) => {
    item.style.setProperty('--motion-order', index);
  });

  if ('IntersectionObserver' in window && section) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      section.classList.add('is-motion-visible');
      observer.disconnect();
    }, { rootMargin: '0px 0px -12% 0px', threshold: .12 });
    observer.observe(section);
  } else {
    section?.classList.add('is-motion-visible');
  }

  if (rail && !reducedMotion.matches) {
    const track = rail.firstElementChild;
    const originals = track ? [...track.children] : [];
    originals.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('tabindex', '-1');
      track.appendChild(clone);
    });

    let cycle = 0;
    let position = 0;
    let previousTime = performance.now();
    let visible = false;
    const speed = Number(rail.dataset.autoSpeed || 24);
    const measure = () => {
      const first = track?.children[0];
      const firstClone = track?.children[originals.length];
      cycle = first && firstClone ? firstClone.offsetLeft - first.offsetLeft : 0;
      if (cycle && position >= cycle) position %= cycle;
    };
    const visibility = new IntersectionObserver(([entry]) => { visible = Boolean(entry?.isIntersecting); }, { rootMargin: '20%' });
    visibility.observe(rail);
    new ResizeObserver(measure).observe(rail);
    measure();

    const animate = (time) => {
      const delta = Math.min((time - previousTime) / 1000, .05);
      previousTime = time;
      if (visible && !document.hidden && cycle > 0) {
        position = (position + speed * delta) % cycle;
        rail.scrollLeft = position;
      }
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  const portrait = document.querySelector('.thinking-portrait img');
  if (portrait && !reducedMotion.matches) {
    let frame = 0;
    const syncPortrait = () => {
      frame = 0;
      const bounds = portrait.parentElement.getBoundingClientRect();
      const progress = (bounds.top + bounds.height / 2 - innerHeight / 2) / Math.max(innerHeight, 1);
      portrait.style.setProperty('--home-parallax', `${Math.max(-18, Math.min(18, progress * -28)).toFixed(2)}px`);
    };
    const requestSync = () => { if (!frame) frame = requestAnimationFrame(syncPortrait); };
    syncPortrait();
    addEventListener('scroll', requestSync, { passive: true });
    addEventListener('resize', requestSync, { passive: true });
  }
})();
