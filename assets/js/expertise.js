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
