(() => {
  const section = document.querySelector('[data-cta-field]');
  const canvas = section?.querySelector('.contact__field');
  if (!canvas) return;

  const context = canvas.getContext('2d');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = { x: 0, y: 0, active: false };
  let width = 0;
  let height = 0;
  let points = [];
  let frame = 0;
  let visible = false;

  const buildPoints = () => {
    const spacing = width < 700 ? 46 : 54;
    const columns = Math.ceil(width / spacing) + 1;
    const rows = Math.ceil(height / spacing) + 1;
    points = [];
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const offset = row % 2 ? spacing * .5 : 0;
        points.push({
          x: column * spacing + offset,
          y: row * spacing,
          phase: (column * 1.7 + row * 2.3) % 6.28
        });
      }
    }
  };

  const resize = () => {
    width = section.clientWidth;
    height = section.clientHeight;
    const density = Math.min(devicePixelRatio || 1, 2);
    canvas.width = width * density;
    canvas.height = height * density;
    context.setTransform(density, 0, 0, density, 0, 0);
    buildPoints();
    draw(performance.now());
  };

  const draw = now => {
    frame = 0;
    context.clearRect(0, 0, width, height);
    const radius = width < 700 ? 96 : 140;
    const displaced = points.map(point => {
      const dx = point.x - pointer.x;
      const dy = point.y - pointer.y;
      const distance = Math.hypot(dx, dy) || 1;
      const influence = pointer.active ? Math.max(0, 1 - distance / radius) : 0;
      const drift = reducedMotion ? 0 : Math.sin(now * .0012 + point.phase) * .6;
      return {
        x: point.x + (dx / distance) * influence * 10,
        y: point.y + (dy / distance) * influence * 10 + drift,
        influence
      };
    });

    displaced.forEach((point, index) => {
      if (point.influence > .2) {
        const neighbor = displaced[index + 1];
        if (neighbor && Math.abs(neighbor.y - point.y) < 30) {
          context.strokeStyle = `rgba(80,69,255,${point.influence * .18})`;
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(neighbor.x, neighbor.y);
          context.stroke();
        }
      }
      const sparkle = point.influence > .08;
      const size = sparkle ? 1.2 + point.influence * 2.4 : .8;
      context.fillStyle = sparkle
        ? `rgba(103,91,255,${.22 + point.influence * .4})`
        : 'rgba(243,234,223,.075)';
      context.fillRect(point.x - size / 2, point.y - size / 2, size, size);
    });

    if (visible && !reducedMotion) frame = requestAnimationFrame(draw);
  };

  const updatePointer = event => {
    const bounds = section.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
    pointer.active = true;
    if (!frame) frame = requestAnimationFrame(draw);
  };

  section.addEventListener('pointermove', updatePointer, { passive: true });
  section.addEventListener('pointerleave', () => { pointer.active = false; });
  new ResizeObserver(resize).observe(section);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !frame) frame = requestAnimationFrame(draw);
    if (!visible && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }).observe(section);
})();
