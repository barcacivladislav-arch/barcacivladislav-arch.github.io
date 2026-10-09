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
    const track = rail.querySelector('.capability-gateway__track');
    const previousButton = document.querySelector('[data-home-rail-prev]');
    const nextButton = document.querySelector('[data-home-rail-next]');
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
    let pauseUntil = 0;
    let dragStartX = 0;
    let dragStartScroll = 0;
    let dragDistance = 0;
    let dragging = false;
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

    const pauseAuto = (duration = 3600) => { pauseUntil = performance.now() + duration; };
    const normalizeForBackwardTravel = (amount) => {
      if (cycle > 0 && amount < 0 && rail.scrollLeft < Math.abs(amount) + 20) {
        rail.scrollLeft += cycle;
        position = rail.scrollLeft;
      }
    };
    const moveRail = (direction) => {
      const amount = direction * Math.min(innerWidth * .72, 720);
      pauseAuto();
      normalizeForBackwardTravel(amount);
      rail.scrollBy({ left: amount, behavior: 'smooth' });
    };
    previousButton?.addEventListener('click', () => moveRail(-1));
    nextButton?.addEventListener('click', () => moveRail(1));
    rail.addEventListener('wheel', (event) => {
      const amount = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!amount) return;
      event.preventDefault();
      pauseAuto();
      normalizeForBackwardTravel(amount);
      rail.scrollLeft += amount;
      position = rail.scrollLeft;
    }, { passive: false });
    rail.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      dragging = true;
      dragDistance = 0;
      dragStartX = event.clientX;
      dragStartScroll = rail.scrollLeft;
      pauseAuto();
      rail.classList.add('is-dragging');
      rail.setPointerCapture(event.pointerId);
    });
    rail.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      dragDistance = event.clientX - dragStartX;
      rail.scrollLeft = dragStartScroll - dragDistance;
      position = rail.scrollLeft;
    });
    const endDrag = (event) => {
      if (!dragging) return;
      dragging = false;
      rail.classList.remove('is-dragging');
      if (rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
      pauseAuto();
    };
    rail.addEventListener('pointerup', endDrag);
    rail.addEventListener('pointercancel', endDrag);
    rail.addEventListener('click', (event) => {
      if (Math.abs(dragDistance) <= 7) return;
      event.preventDefault();
      event.stopPropagation();
      dragDistance = 0;
    }, true);
    rail.addEventListener('focusin', () => pauseAuto(5000));
    rail.addEventListener('scroll', () => {
      if (performance.now() < pauseUntil) position = rail.scrollLeft;
    }, { passive: true });

    const animate = (time) => {
      const delta = Math.min((time - previousTime) / 1000, .05);
      previousTime = time;
      if (visible && !document.hidden && cycle > 0 && time >= pauseUntil) {
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
