(() => {
  const root = () => document.body.dataset.assetRoot || "";
  const fileName = (asset) => asset.source.replace(/\\/g, "/").split("/").pop().replace(/\.[^.]+$/, "");
  const image = (asset, eager = false) => {
    if (asset.kind === "video" || /\.(mp4|webm)$/i.test(asset.src)) {
      const element = document.createElement("video");
      element.src = root() + asset.src;
      element.muted = true;
      element.loop = true;
      element.autoplay = eager;
      element.playsInline = true;
      element.preload = eager ? "metadata" : "none";
      element.setAttribute("aria-label", fileName(asset).replace(/[-_]/g, " "));
      return element;
    }
    const element = new Image();
    element.src = root() + asset.src;
    element.alt = fileName(asset).replace(/[-_]/g, " ");
    element.loading = eager ? "eager" : "lazy";
    element.decoding = "async";
    if (asset.width) element.width = asset.width;
    if (asset.height) element.height = asset.height;
    return element;
  };
  const tabs = (items, select, className) => {
    const host = document.createElement("div");
    host.className = className;
    host.setAttribute("role", "tablist");
    items.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = item.label;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(index === 0));
      button.addEventListener("click", () => {
        host.querySelectorAll("button").forEach((tab) => tab.setAttribute("aria-selected", String(tab === button)));
        select(item);
      });
      host.append(button);
    });
    return host;
  };
  const drag = (track) => {
    let active = false, start = 0, scroll = 0;
    track.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") return;
      active = true; start = event.clientX; scroll = track.scrollLeft;
      track.setPointerCapture(event.pointerId);
    });
    track.addEventListener("pointermove", (event) => { if (active) track.scrollLeft = scroll - (event.clientX - start); });
    ["pointerup", "pointercancel"].forEach((name) => track.addEventListener(name, () => { active = false; }));
    track.addEventListener("wheel", (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) || track.scrollWidth <= track.clientWidth) return;
      event.preventDefault(); track.scrollLeft += event.deltaY;
    }, { passive: false });
  };
  const reel = (host, groups) => {
    const shared = window.PortfolioMediaComponents;
    if (shared) {
      host.replaceChildren();
      shared.renderAdvertisingSystem(host, groups.flatMap((group) => group.assets), { root: root(), groups });
      return;
    }
    const head = document.createElement("div"); head.className = "reel-head";
    const copy = document.createElement("div"); copy.className = "reel-copy";
    const track = document.createElement("div"); track.className = "reel-track"; track.tabIndex = 0;
    const progress = document.createElement("div"); progress.className = "reel-progress";
    const note = document.createElement("p"); note.className = "reel-instruction"; note.textContent = "Drag or scroll horizontally";
    const render = (group) => {
      copy.innerHTML = `<h3>${group.title}</h3><p>${group.copy}</p>`;
      track.replaceChildren(...group.assets.map((asset, index) => {
        const figure = document.createElement("figure"); figure.className = "reel-card";
        const media = image(asset, index < 4); if (media.tagName === "IMG") media.dataset.lightbox = "true"; figure.append(media); return figure;
      }));
      track.scrollLeft = 0; host.style.setProperty("--reel-progress", "0%");
      document.dispatchEvent(new Event("portfolio:media-ready"));
    };
    head.append(copy, tabs(groups, render, "reel-tabs"));
    track.addEventListener("scroll", () => {
      const range = track.scrollWidth - track.clientWidth;
      host.style.setProperty("--reel-progress", `${range > 0 ? Math.min(100, track.scrollLeft / range * 100) : 100}%`);
    }, { passive: true });
    host.append(head, track, progress, note); drag(track); render(groups[0]);
  };
  const website = (host, pages) => {
    const shared = window.PortfolioMediaComponents;
    if (shared) {
      const assets = pages.flatMap((page) => [page.desktop, page.mobile].filter(Boolean));
      host.replaceChildren();
      shared.renderWebsiteViewer(host, assets, { root: root(), pages });
      return;
    }
    const bar = document.createElement("div"); bar.className = "commerce-stage__bar";
    const tabHost = document.createElement("div");
    const controls = document.createElement("div"); controls.className = "commerce-stage__controls";
    const hint = document.createElement("p"); hint.className = "commerce-stage__hint"; hint.textContent = "Hover, then scroll inside either screen";
    const tour = document.createElement("button"); tour.type = "button"; tour.className = "experience-tour"; tour.textContent = "Auto tour";
    controls.append(hint, tour); bar.append(tabHost, controls);
    const stage = document.createElement("div"); stage.className = "device-stage";
    const viewports = ["desktop", "mobile"].map((type) => {
      const device = document.createElement("div"); device.className = `device device--${type === "mobile" ? "phone" : "desktop"}`;
      device.innerHTML = `<div class="device__chrome">${type === "desktop" ? `<i></i><i></i><i></i><span>${host.dataset.siteLabel || "Website"}</span>` : ""}</div><div class="device__viewport"></div>`;
      stage.append(device); return device.querySelector(".device__viewport");
    });
    const render = (page) => viewports.forEach((viewport, index) => { viewport.replaceChildren(image(index ? page.mobile : page.desktop, true)); viewport.scrollTop = 0; });
    tabHost.append(tabs(pages, render, "experience-tabs")); host.append(bar, stage); render(pages[0]);
    let frame = 0;
    tour.addEventListener("click", () => {
      if (frame) { cancelAnimationFrame(frame); frame = 0; tour.textContent = "Auto tour"; return; }
      viewports.forEach((viewport) => { viewport.scrollTop = 0; }); tour.textContent = "Stop tour";
      let last = performance.now();
      const step = (now) => {
        const delta = now - last; last = now; let active = false;
        viewports.forEach((viewport) => { if (viewport.scrollTop + viewport.clientHeight < viewport.scrollHeight - 2) { viewport.scrollTop += delta * .12; active = true; } });
        if (active) frame = requestAnimationFrame(step); else { frame = 0; tour.textContent = "Auto tour"; }
      };
      frame = requestAnimationFrame(step);
    });
  };
  const inbox = (host, groups, reader) => {
    const shared = window.PortfolioMediaComponents;
    if (shared) {
      const assets = groups.flatMap((group) => group.assets);
      host.replaceChildren();
      shared.renderNewsletterLibrary(host, assets, { root: root(), groups });
      if (reader) reader.remove();
      return;
    }
    const rail = document.createElement("div"); rail.className = "newsletter-rail";
    const readerTitle = reader.querySelector("[data-reader-title]");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frames = new WeakMap();
    const stop = (viewport) => cancelAnimationFrame(frames.get(viewport));
    const play = (viewport) => {
      if (reduced) return; stop(viewport);
      const distance = viewport.scrollHeight - viewport.clientHeight;
      if (distance <= 0) return;
      const from = viewport.scrollTop, started = performance.now(), duration = Math.max(5000, (distance - from) * 7);
      const step = (now) => { const amount = Math.min(1, (now - started) / duration); viewport.scrollTop = from + (distance - from) * amount; if (amount < 1) frames.set(viewport, requestAnimationFrame(step)); };
      frames.set(viewport, requestAnimationFrame(step));
    };
    const open = (asset) => {
      readerTitle.textContent = fileName(asset);
      reader.querySelector(".reader-scroll").replaceChildren(image(asset, true));
      reader.querySelector(".reader-scroll").scrollTop = 0; reader.showModal();
    };
    const render = (group) => {
      rail.replaceChildren(...group.assets.map((asset) => {
        const card = document.createElement("button"); card.type = "button"; card.className = "newsletter-card";
        const viewport = document.createElement("span"); viewport.className = "newsletter-card__viewport"; viewport.append(image(asset));
        const label = document.createElement("span"); label.textContent = fileName(asset); card.append(viewport, label);
        card.addEventListener("pointerenter", () => play(viewport)); card.addEventListener("pointerleave", () => stop(viewport));
        card.addEventListener("focus", () => play(viewport)); card.addEventListener("blur", () => stop(viewport)); card.addEventListener("click", () => open(asset));
        return card;
      })); rail.scrollLeft = 0;
    };
    host.append(tabs(groups, render, "inbox-tabs"), rail); drag(rail); render(groups[0]);
    reader.querySelector(".reader-close").addEventListener("click", () => reader.close());
    reader.addEventListener("click", (event) => { if (event.target === reader) reader.close(); });
  };
  window.PortfolioExperience = { image, reel, website, inbox };
})();
