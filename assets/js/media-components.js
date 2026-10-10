(() => {
  const textFromPath = (value = "") => {
    const name = value.replace(/\\/g, "/").split("/").pop().replace(/\.[^.]+$/, "");
    return name.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim() || "Selected work";
  };

  const ratioClass = (asset) => {
    const ratio = asset.aspectRatio || (asset.width && asset.height ? asset.width / asset.height : 1);
    return ratio > 1.25 ? "landscape" : ratio < .8 ? "portrait" : "square";
  };

  const createMedia = (asset, index = 0, root = "", options = {}) => {
    const figure = document.createElement("figure");
    const ratio = asset.aspectRatio || (asset.width && asset.height ? asset.width / asset.height : 1);
    figure.className = `project-media project-media--${asset.kind} project-media--${ratioClass(asset)}`;
    figure.style.setProperty("--asset-ratio", String(Math.max(.12, Math.min(4, ratio))));
    figure.dataset.fit = asset.fit || "contain";
    figure.dataset.role = asset.role || "media";
    figure.dataset.category = asset.category || asset.group || "project";
    if (asset.canonicalHash) figure.dataset.assetHash = asset.canonicalHash.slice(0, 12);

    if (asset.kind === "video") {
      const video = document.createElement("video");
      video.src = root + asset.src;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.controls = options.controls !== false;
      const eager = options.eager || asset.loadingPriority === "high" || index < 2;
      video.preload = eager ? "metadata" : "none";
      if (asset.motionPoster) video.poster = root + asset.motionPoster;
      video.setAttribute("aria-label", asset.alt || textFromPath(asset.source));
      figure.append(video);
    } else {
      const image = document.createElement("img");
      image.src = root + asset.src;
      if (asset.width) image.width = asset.width;
      if (asset.height) image.height = asset.height;
      const eager = options.eager || asset.loadingPriority === "high" || index < 2;
      image.loading = eager ? "eager" : "lazy";
      if (asset.loadingPriority === "high") image.fetchPriority = "high";
      image.decoding = "async";
      image.alt = asset.alt || textFromPath(asset.source);
      image.style.objectFit = asset.fit || "contain";
      image.style.objectPosition = asset.focalPosition || "50% 50%";
      if (options.lightbox !== false) image.dataset.lightbox = "true";
      figure.append(image);
    }
    return figure;
  };

  const makeHead = (title, note, description = "") => {
    const head = document.createElement("div");
    head.className = "media-component__head";
    const copy = document.createElement("div");
    const heading = document.createElement("h4");
    heading.textContent = title;
    copy.append(heading);
    if (description) {
      const paragraph = document.createElement("p");
      paragraph.textContent = description;
      copy.append(paragraph);
    }
    head.append(copy);
    if (note) {
      const meta = document.createElement("span");
      meta.textContent = note;
      head.append(meta);
    }
    return head;
  };

  const createTabs = (items, onSelect, label, duration = 8000) => {
    const shell = document.createElement("div");
    shell.className = "media-tabs-shell";
    const tabs = document.createElement("div");
    tabs.className = "media-tabs";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", label);
    let activeIndex = 0;
    let timer = 0;
    let isVisible = true;
    let isPaused = false;
    const durationSeconds = Math.round(duration / 1000);
    shell.style.setProperty("--media-tab-duration", `${duration}ms`);
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stopRotation = () => window.clearInterval(timer);
    const startRotation = () => {
      stopRotation();
      if (reducedMotion || items.length < 2 || !isVisible || isPaused) return;
      timer = window.setInterval(() => {
        activeIndex = (activeIndex + 1) % items.length;
        buttons[activeIndex].click();
      }, duration);
    };
    const buttons = items.map((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(index === 0));
      button.tabIndex = index === 0 ? 0 : -1;
      button.textContent = item.label;
      const select = () => {
        activeIndex = index;
        buttons.forEach((candidate) => {
          const active = candidate === button;
          candidate.setAttribute("aria-selected", String(active));
          candidate.tabIndex = active ? 0 : -1;
        });
        onSelect(item, index);
        progressFill.style.animation = "none";
        requestAnimationFrame(() => {
          progressFill.style.animation = "";
        });
        startRotation();
      };
      button.addEventListener("click", select);
      button.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const nextIndex = (index + (event.key === "ArrowLeft" ? -1 : 1) + items.length) % items.length;
        buttons[nextIndex].focus();
        buttons[nextIndex].click();
      });
      tabs.append(button);
      return button;
    });
    const controls = document.createElement("div");
    controls.className = "media-tabs__controls";
    const previous = document.createElement("button");
    previous.type = "button";
    previous.textContent = "←";
    previous.setAttribute("aria-label", `Previous ${label.toLowerCase()}`);
    const playPause = document.createElement("button");
    playPause.type = "button";
    playPause.className = "media-tabs__toggle";
    playPause.textContent = reducedMotion ? "Play" : "Pause";
    playPause.setAttribute("aria-label", reducedMotion ? `Play ${label.toLowerCase()}` : `Pause ${label.toLowerCase()}`);
    const next = document.createElement("button");
    next.type = "button";
    next.textContent = "→";
    next.setAttribute("aria-label", `Next ${label.toLowerCase()}`);
    const timing = document.createElement("span");
    timing.className = "media-tabs__timing";
    timing.setAttribute("aria-label", `Automatic selection time: ${durationSeconds} seconds`);
    timing.innerHTML = `<span class="media-tabs__time">${durationSeconds}s</span><span class="media-tabs__progress"><span></span></span>`;
    const progressFill = timing.querySelector(".media-tabs__progress span");
    controls.append(previous, playPause, next, timing);
    shell.append(tabs, controls);
    const selectOffset = (offset) => buttons[(activeIndex + offset + buttons.length) % buttons.length].click();
    previous.addEventListener("click", () => selectOffset(-1));
    next.addEventListener("click", () => selectOffset(1));
    const pause = () => {
      isPaused = true;
      shell.dataset.paused = "true";
      playPause.textContent = "Play";
      playPause.setAttribute("aria-label", `Play ${label.toLowerCase()}`);
      stopRotation();
    };
    const resume = () => {
      isPaused = false;
      delete shell.dataset.paused;
      playPause.textContent = "Pause";
      playPause.setAttribute("aria-label", `Pause ${label.toLowerCase()}`);
      startRotation();
    };
    playPause.addEventListener("click", () => isPaused ? resume() : pause());
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
        startRotation();
      }, { threshold: .2 }).observe(tabs);
    }
    if (reducedMotion) pause();
    startRotation();
    return shell;
  };

  const createScroller = (track, label) => {
    const shell = document.createElement("div");
    shell.className = "media-scroller";
    track.classList.add("media-scroller__track");
    track.tabIndex = 0;
    track.setAttribute("aria-label", label);
    const controls = document.createElement("div");
    controls.className = "media-scroller__controls";
    const cue = document.createElement("span");
    cue.className = "media-scroller__cue";
    cue.textContent = "Scroll or use arrow keys";
    const meter = document.createElement("span");
    meter.className = "media-scroller__meter";
    meter.setAttribute("role", "progressbar");
    meter.setAttribute("aria-label", `${label} progress`);
    meter.setAttribute("aria-valuemin", "0");
    meter.setAttribute("aria-valuemax", "100");
    const fill = document.createElement("span");
    meter.append(fill);
    const previous = document.createElement("button");
    previous.type = "button";
    previous.textContent = "←";
    previous.setAttribute("aria-label", `Previous in ${label}`);
    const next = document.createElement("button");
    next.type = "button";
    next.textContent = "→";
    next.setAttribute("aria-label", `Next in ${label}`);
    controls.append(cue, meter, previous, next);
    shell.append(track, controls);

    const step = () => Math.max(240, track.clientWidth * .82);
    const update = () => {
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      const value = max ? Math.round(track.scrollLeft / max * 100) : 100;
      fill.style.width = `${value}%`;
      meter.setAttribute("aria-valuenow", String(value));
      previous.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max - 2;
      cue.hidden = max <= 2;
      controls.hidden = max <= 2;
    };
    const move = (direction) => track.scrollBy({ left: direction * step(), behavior: "smooth" });
    previous.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));
    track.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      move(event.key === "ArrowLeft" ? -1 : 1);
    });
    track.addEventListener("scroll", update, { passive: true });
    new ResizeObserver(update).observe(track);
    requestAnimationFrame(update);
    return shell;
  };

  const isMobileScreen = (asset) => /mobile|390w|phone/i.test(asset.source || "") || (asset.width > 0 && asset.width < 1000);
  const sectionTitle = (asset) => {
    const parts = (asset.source || "").replace(/\\/g, "/").split("/");
    return (parts.at(-2) || "Website").replace(/[-_]/g, " ");
  };

  const labelCase = (value) => value.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  const isBannerAsset = (asset) => /(?:^|[\\/\s_-])banners?(?:[\\/\s_.-]|$)|announcement|top[ -]?bar/i.test(`${asset.source || ""} ${asset.role || ""}`);

  const renderWebsiteViewer = (gallery, assets, { root = "", pages = null } = {}) => {
    gallery.classList.add("website-viewer-library");
    const eligible = assets.filter((asset) => !isBannerAsset(asset));
    const families = pages?.length
      ? pages.map((page) => ({ label: page.label, assets: [page.desktop, page.mobile].filter(Boolean), desktop: page.desktop, mobile: page.mobile })).filter((page) => page.assets.length)
      : [...eligible.reduce((map, asset) => {
          const family = labelCase(sectionTitle(asset));
          if (!map.has(family)) map.set(family, []);
          map.get(family).push(asset);
          return map;
        }, new Map())].map(([label, familyAssets]) => ({ label, assets: familyAssets }))
          .sort((a, b) => {
            const priority = (label) => /home/i.test(label) ? 0 : /collection|category|listing/i.test(label) ? 1 : /product/i.test(label) ? 2 : 3;
            return priority(a.label) - priority(b.label);
          });
    if (!families.length) {
      gallery.hidden = true;
      const section = gallery.closest(".case-section, .project-chapter");
      if (section && section.querySelectorAll("[data-asset-group], [data-gallery], [data-commerce-experience]").length === 1) section.hidden = true;
      return;
    }
    const stage = document.createElement("div");
    stage.className = "media-switcher__stage";
    const renderFamily = ({ label: family, assets: familyAssets, desktop, mobile }) => {
      stage.replaceChildren();
      const section = document.createElement("section");
      section.className = "website-viewer";
      section.append(makeHead(family, "Desktop + mobile", "Scroll inside either screen to inspect the complete page."));
      const desktops = desktop ? [desktop] : familyAssets.filter((asset) => !isMobileScreen(asset));
      const mobiles = mobile ? [mobile] : familyAssets.filter(isMobileScreen);
      const count = desktops.length && mobiles.length
        ? Math.min(desktops.length, mobiles.length)
        : Math.max(desktops.length, mobiles.length, 1);
      const pairs = document.createElement("div");
      pairs.className = "website-viewer__pairs";
      for (let index = 0; index < count; index += 1) {
        const pair = document.createElement("div");
        pair.className = "website-viewer__pair";
        const pairAssets = [desktops[index], mobiles[index]].filter(Boolean);
        if (pairAssets.length === 1) pair.classList.add("website-viewer__pair--single");
        [desktops[index], mobiles[index]].forEach((asset, deviceIndex) => {
          if (!asset) return;
          const screen = document.createElement("div");
          screen.className = `website-screen website-screen--${deviceIndex ? "mobile" : "desktop"}`;
          screen.tabIndex = 0;
          screen.setAttribute("role", "region");
          screen.setAttribute("aria-label", `${family} ${deviceIndex ? "mobile" : "desktop"} screenshot. Scroll to inspect.`);
          const label = document.createElement("span");
          label.className = "website-screen__label";
          label.textContent = deviceIndex ? "Mobile" : "Desktop";
          const cue = document.createElement("span");
          cue.className = "website-screen__cue";
          cue.textContent = "Scroll page ↓";
          const media = createMedia(asset, index, root, { lightbox: false });
          screen.append(label, media, cue);
          screen.addEventListener("scroll", () => {
            const max = screen.scrollHeight - screen.clientHeight;
            screen.classList.toggle("is-scrolled", screen.scrollTop > 20);
            screen.classList.toggle("is-at-end", max - screen.scrollTop < 20);
          }, { passive: true });
          pair.append(screen);
        });
        pairs.append(pair);
      }
      section.append(pairs);
      stage.append(section);
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
        section.animate([
          { opacity: .35, transform: "translateY(4px)" },
          { opacity: 1, transform: "translateY(0)" }
        ], { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" });
      }
      document.dispatchEvent(new Event("portfolio:media-ready"));
    };
    if (families.length > 1) gallery.append(createTabs(families, renderFamily, "Website pages", 12000));
    gallery.append(stage);
    renderFamily(families[0]);
  };

  const formatFor = (asset) => ratioClass(asset);
  const objectiveFor = (name) => {
    const value = name.toLowerCase();
    if (/top funnel|awareness|launch|introduc/.test(value)) return ["Awareness", "Introduce the campaign idea quickly and build recognition."];
    if (/middle|consider|problem|education|benefit/.test(value)) return ["Consideration", "Explain the value and make the product relevant to a specific need."];
    if (/bottom|sale|offer|conversion|buy|bundle/.test(value)) return ["Conversion", "Turn existing interest into a clear, timely action."];
    if (/review|proof|testimonial/.test(value)) return ["Proof", "Reduce uncertainty with a visible reason to trust the offer."];
    if (/search/.test(value)) return ["Intent", "Meet an active need with direct, legible product communication."];
    return ["Campaign system", "Extend one campaign idea across the formats and placements it needs."];
  };

  const renderAdvertisingSystem = (gallery, assets, { root = "", familyFromPath = sectionTitle, groups = null } = {}) => {
    gallery.classList.add("advertising-system");
    const families = groups?.filter((group) => group.assets?.length) || [...assets.reduce((map, asset) => {
      const family = familyFromPath(asset);
      if (!map.has(family)) map.set(family, []);
      map.get(family).push(asset);
      return map;
    }, new Map())].map(([label, familyAssets]) => ({ label, assets: familyAssets }));
    if (!families.length) {
      gallery.hidden = true;
      return;
    }
    const stage = document.createElement("div");
    stage.className = "media-switcher__stage";
    const renderFamily = (familyGroup) => {
      stage.replaceChildren();
      const family = familyGroup.label;
      const familyAssets = familyGroup.assets;
      const [defaultPurpose, defaultExplanation] = objectiveFor(family);
      const section = document.createElement("section");
      section.className = "ad-category";
      section.append(makeHead(familyGroup.title || family, familyGroup.purpose || defaultPurpose, familyGroup.copy || defaultExplanation));
      ["landscape", "square", "portrait"].forEach((format) => {
        const items = familyAssets.filter((asset) => formatFor(asset) === format);
        if (!items.length) return;
        const group = document.createElement("div");
        group.className = `ad-format ad-format--${format}`;
        const title = document.createElement("h5");
        title.textContent = `${format} format`;
        const track = document.createElement("div");
        track.className = "ad-track";
        items.forEach((asset, index) => track.append(createMedia(asset, index, root)));
        group.append(title, createScroller(track, `${family}, ${format} ads`));
        section.append(group);
      });
      stage.append(section);
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
        section.animate([
          { opacity: .35, transform: "translateY(4px)" },
          { opacity: 1, transform: "translateY(0)" }
        ], { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" });
      }
      document.dispatchEvent(new Event("portfolio:media-ready"));
    };
    if (families.length > 1) gallery.append(createTabs(families, renderFamily, "Advertising categories", 12000));
    gallery.append(stage);
    renderFamily(families[0]);
  };

  const newsletterFamily = (asset) => {
    const parts = (asset.source || "").replace(/\\/g, "/").split("/");
    const marker = parts.findIndex((part) => /newsletters?/i.test(part));
    const candidate = marker >= 0 ? parts[marker + 1] : "";
    return candidate && !/\.[a-z0-9]+$/i.test(candidate) ? labelCase(candidate) : "All Issues";
  };

  const renderNewsletterLibrary = (gallery, assets, { root = "", groups = null } = {}) => {
    gallery.classList.add("newsletter-library");
    const inbox = gallery.closest(".campaign-inbox");
    inbox?.classList.add("campaign-inbox--shared");
    if (!inbox) gallery.classList.add("newsletter-library--standalone");
    const families = groups?.filter((group) => group.assets?.length) || [...assets.reduce((map, asset) => {
      const family = newsletterFamily(asset);
      if (!map.has(family)) map.set(family, []);
      map.get(family).push(asset);
      return map;
    }, new Map())].map(([label, familyAssets]) => ({ label, assets: familyAssets }));
    if (!families.length) {
      gallery.hidden = true;
      return;
    }
    const grid = document.createElement("div");
    grid.className = "newsletter-library__grid";
    const scroller = createScroller(grid, "Newsletter issues");
    const dialog = document.createElement("dialog");
    dialog.className = "media-reader";
    dialog.setAttribute("aria-label", "Newsletter reader");
    const header = document.createElement("div");
    header.className = "media-reader__head";
    const title = document.createElement("p");
    const progress = document.createElement("span");
    const previous = document.createElement("button");
    previous.type = "button";
    previous.textContent = "←";
    previous.setAttribute("aria-label", "Previous newsletter");
    const next = document.createElement("button");
    next.type = "button";
    next.textContent = "→";
    next.setAttribute("aria-label", "Next newsletter");
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "Close";
    const viewport = document.createElement("div");
    viewport.className = "media-reader__viewport";
    viewport.tabIndex = 0;
    header.append(title, progress, previous, next, close);
    dialog.append(header, viewport);
    let intro = inbox?.querySelector(".inbox-head") || null;
    if (!intro) {
      intro = document.createElement("div");
      intro.className = "inbox-head inbox-head--shared";
      if (inbox) inbox.insertBefore(intro, inbox.firstChild);
      else gallery.append(intro);
    }
    intro.classList.add("inbox-head--shared");
    let introTitle = intro.querySelector("h3");
    if (!introTitle) {
      introTitle = document.createElement("h3");
      intro.prepend(introTitle);
    }
    let introCopy = intro.querySelector("p");
    if (!introCopy) {
      introCopy = document.createElement("p");
      intro.append(introCopy);
    }
    introTitle.textContent = "Campaign inbox.";
    introCopy.textContent = "Hover to follow each email at a calm pace, or scroll directly to inspect any part of it.";
    if (families.length > 1) gallery.append(createTabs(families, renderGroup, "Newsletter campaigns", 16000));
    gallery.append(scroller, dialog);

    let selected = 0;
    let activeAssets = families[0].assets;
    let buttons = [];
    const open = (index) => {
      selected = (index + activeAssets.length) % activeAssets.length;
      const asset = activeAssets[selected];
      title.textContent = asset.alt || textFromPath(asset.source);
      progress.textContent = `${selected + 1} / ${activeAssets.length}`;
      viewport.replaceChildren(createMedia(asset, 0, root, { lightbox: false, controls: true }));
      buttons.forEach((button, buttonIndex) => {
        const isSelected = buttonIndex === selected;
        button.classList.toggle("is-selected", isSelected);
        button.closest(".newsletter-card")?.classList.toggle("is-selected", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
      });
      if (!dialog.open) dialog.showModal();
      requestAnimationFrame(() => viewport.focus());
    };
    function renderGroup(group) {
      activeAssets = group.assets;
      selected = 0;
      buttons = [];
      if (dialog.open) dialog.close();
      grid.replaceChildren();
      activeAssets.forEach((asset, index) => {
        const card = document.createElement("article");
        card.className = "newsletter-card";
        const preview = document.createElement("span");
        preview.className = "newsletter-card__viewport";
        preview.tabIndex = 0;
        preview.setAttribute("role", "region");
        preview.setAttribute("aria-label", `Scrollable preview: ${asset.alt || `Issue ${index + 1}`}`);
        preview.append(createMedia(asset, index, root, { lightbox: false, controls: false, eager: index < 4 }));
        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.className = "newsletter-card__open";
        openButton.setAttribute("aria-pressed", "false");
        const label = document.createElement("span");
        label.textContent = (asset.alt || `Issue ${index + 1}`).replace(/\s+[—-]\s+Newsletters?.*$/i, "");
        const count = document.createElement("small");
        count.textContent = String(index + 1).padStart(2, "0");
        openButton.append(label, count);
        card.append(preview, openButton);
        openButton.addEventListener("click", () => open(index));
        const scrollPreview = (direction) => {
          const target = Math.max(0, Math.min(
            preview.scrollHeight - preview.clientHeight,
            preview.scrollTop + direction * Math.max(180, preview.clientHeight * .72)
          ));
          preview.scrollTo({
            top: target,
            behavior: "auto"
          });
        };
        preview.addEventListener("keydown", (event) => {
          const direction = event.key === "ArrowUp" || event.key === "PageUp" ? -1
            : event.key === "ArrowDown" || event.key === "PageDown" ? 1 : 0;
          if (!direction) return;
          event.preventDefault();
          scrollPreview(direction);
        });
        if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
          let animationFrame = 0;
          let previousTime = 0;
          const stopPreview = () => {
            cancelAnimationFrame(animationFrame);
            animationFrame = 0;
            previousTime = 0;
          };
          const advancePreview = (time) => {
            if (!previousTime) previousTime = time;
            const elapsed = Math.min(40, time - previousTime);
            previousTime = time;
            const max = preview.scrollHeight - preview.clientHeight;
            if (preview.scrollTop < max - 1) {
              preview.scrollTop += elapsed * .032;
              animationFrame = requestAnimationFrame(advancePreview);
            } else {
              stopPreview();
            }
          };
          const startPreview = () => {
            if (!animationFrame && preview.scrollHeight > preview.clientHeight) animationFrame = requestAnimationFrame(advancePreview);
          };
          card.addEventListener("pointerenter", startPreview);
          card.addEventListener("pointerleave", stopPreview);
          preview.addEventListener("focus", startPreview);
          preview.addEventListener("blur", stopPreview);
          preview.addEventListener("wheel", stopPreview, { passive: true });
          preview.addEventListener("pointerdown", stopPreview);
        }
        buttons.push(openButton);
        grid.append(card);
      });
      grid.scrollLeft = 0;
      grid.dispatchEvent(new Event("scroll"));
      document.dispatchEvent(new Event("portfolio:media-ready"));
    }
    previous.addEventListener("click", () => open(selected - 1));
    next.addEventListener("click", () => open(selected + 1));
    close.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        open(selected + (event.key === "ArrowLeft" ? -1 : 1));
      }
    });
    renderGroup(families[0]);
  };

  const layoutPlans = {
    "ark-capital": ["full"],
    "ark-development": ["full"],
    bioc: ["full"],
    comod: ["full"],
    coreleaf: ["full"],
    "intergasses-story": ["full"],
    "snus-behance": [
      "full", "full", "full", "full", "full", "three-up", "full", "two-up", "full", "two-up",
      "full", "two-up", "full", "full", "three-up", "full", "two-up", "full", "full", "full",
      "full", "full", "full", "full", "full", "full", "full", "full", "full", "full", "two-up"
    ],
    "elite-brand": ["full"],
    "elite-homes": ["full"],
    "emma-red": ["full"],
    "like-coffee": ["full"]
  };
  const slotCounts = { full: 1, inset: 1, "two-up": 2, "three-up": 3, "motion-pair": 2 };

  // The contents rail describes the authored story, rather than exposing
  // internal layout names such as “Full board” or “Paired boards”.
  const contentsPlans = {
    "ark-capital": [[1, "Introduction"], [2, "Brand idea"], [4, "Logo system"], [7, "Typography & colour"], [10, "Corporate applications"], [14, "Environmental graphics"], [17, "Closing"]],
    "ark-development": [[1, "Introduction"], [3, "Brand concept"], [6, "Logo construction"], [10, "Typography & colour"], [14, "Graphic system"], [19, "Brand applications"], [24, "Property communication"], [29, "Digital direction"], [31, "Closing"]],
    bioc: [[1, "Introduction"], [2, "Logo system"], [5, "Corporate identity"], [6, "Operational applications"], [9, "Printed communication"], [10, "Outdoor campaign"], [13, "Social & advertising"], [14, "Infrastructure"]],
    comod: [[1, "Introduction"], [2, "Brand idea"], [3, "Logo system"], [4, "Typography & colour"], [6, "Graphic language"], [8, "Applications"], [10, "Brand in use"]],
    coreleaf: [[1, "Introduction"], [2, "Brand concept"], [4, "Logo system"], [7, "Typography & colour"], [10, "Identity applications"], [15, "Packaging introduction"], [17, "Packaging architecture"], [20, "Product family"], [24, "Format adaptations"], [29, "Packaging details"], [36, "Range in use"], [41, "Closing"]],
    "intergasses-story": [[1, "Introduction"], [3, "Research & direction"], [6, "Logo system"], [9, "Typography & colour"], [12, "Visual language"], [15, "Brand applications"], [18, "Digital experience"], [20, "Closing"]],
    "elite-brand": [[1, "Introduction"], [3, "Hospitality idea"], [5, "Logo system"], [8, "Typography & colour"], [11, "Patterns"], [14, "Brand applications"], [17, "Digital touchpoints"], [20, "Property experience"]],
    "elite-homes": [[1, "Introduction"], [3, "Hospitality idea"], [5, "Logo system"], [8, "Typography & colour"], [11, "Patterns"], [14, "Brand applications"], [17, "Digital touchpoints"], [20, "Property experience"]],
    "emma-red": [[1, "Introduction"], [2, "Brand concept"], [4, "Logo system"], [6, "Typography & colour"], [8, "Graphic language"], [10, "Applications"], [12, "Closing"]],
    "like-coffee": [[1, "Introduction"], [2, "Brand concept"], [3, "Logo system"], [4, "Typography & colour"], [6, "Packaging"], [8, "Brand in use"], [9, "Closing"]],
    "snus-behance": [[1, "Introduction"], [3, "Brand idea"], [5, "Logo & typography"], [8, "Packaging architecture"], [12, "Flavour system"], [16, "Product family"], [20, "Packaging details"], [24, "Campaign world"], [28, "Applications"], [31, "Closing"]]
  };

  const renderBehanceComposition = (gallery, assets, key, { root = "", pairs = [], storyShell = true } = {}) => {
    if (storyShell) document.body.classList.add("behance-project");
    gallery.classList.add("behance-composition");
    const contents = document.createElement("nav");
    contents.className = "behance-contents";
    contents.setAttribute("aria-label", "Project contents");
    const contentsLabel = document.createElement("p");
    contentsLabel.className = "behance-contents__label";
    contentsLabel.textContent = "Contents";
    const contentsList = document.createElement("ol");
    contents.append(contentsLabel, contentsList);
    if (storyShell) {
      const shell = document.createElement("div");
      shell.className = "behance-story-shell";
      gallery.before(shell);
      shell.append(contents, gallery);
    } else {
      gallery.classList.add("behance-composition--embedded");
    }
    const plan = layoutPlans[key] || ["full", "two-up", "inset", "three-up"];
    const tokenFor = (asset) => (asset.source || "").replace(/\\/g, "/").split("/").pop().toLowerCase();
    const consumed = new Set();
    let cursor = 0;
    let planIndex = 0;

    while (cursor < assets.length) {
      while (consumed.has(assets[cursor])) cursor += 1;
      if (cursor >= assets.length) break;
      const asset = assets[cursor];
      const pairTokens = pairs.find((tokens) => tokens.some((token) => tokenFor(asset).startsWith(token.toLowerCase())));
      let rowAssets = [];
      let layout = plan[planIndex % plan.length];
      if (pairTokens) {
        rowAssets = pairTokens.map((token) => assets.find((candidate) => tokenFor(candidate).startsWith(token.toLowerCase()))).filter(Boolean);
        layout = rowAssets.some((item) => item.kind === "video") ? "motion-pair" : "two-up";
      } else {
        const count = slotCounts[layout] || 1;
        for (let offset = cursor; offset < assets.length && rowAssets.length < count; offset += 1) {
          // Stop before an explicit pair so a generic row cannot consume its
          // first item and then duplicate it when the second item is reached.
          if (offset > cursor && pairs.some((tokens) => tokens.some((token) => tokenFor(assets[offset]).startsWith(token.toLowerCase())))) break;
          if (!consumed.has(assets[offset])) rowAssets.push(assets[offset]);
        }
      }
      if (!rowAssets.length) break;
      if (rowAssets.length === 1 && (layout === "two-up" || layout === "three-up" || layout === "motion-pair")) layout = "inset";
      const textHeavy = rowAssets.some((item) => (item.aspectRatio || item.width / item.height) < .72 && item.height > 3000);
      if (textHeavy && rowAssets.length === 1) layout = "inset";
      const row = document.createElement("div");
      row.className = `behance-layout behance-layout--${layout}${textHeavy ? " is-text-heavy" : ""}`;
      // Multi-asset modules are authored as a single row in the Figma and
      // Behance compositions. Keep their two- or three-column structure.
      if (rowAssets.length > 1) {
        row.dataset.authoredPair = "true";
        row.dataset.authoredGroup = String(rowAssets.length);
      }
      const rowNumber = planIndex + 1;
      const rowId = `project-board-${rowNumber}`;
      row.id = rowId;
      const contentsPlan = contentsPlans[key];
      const plannedEntry = contentsPlan?.find(([start]) => start === rowNumber);
      if (!contentsPlan || plannedEntry) {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.href = `#${rowId}`;
        link.dataset.rowIndex = String(planIndex);
        const label = plannedEntry?.[1] || `Project section ${String(rowNumber).padStart(2, "0")}`;
        const contentsNumber = contentsPlan ? contentsPlan.indexOf(plannedEntry) + 1 : rowNumber;
        link.innerHTML = `<span>${String(contentsNumber).padStart(2, "0")}</span><strong>${label}</strong>`;
        item.append(link);
        contentsList.append(item);
      }
      rowAssets.forEach((item) => {
        consumed.add(item);
        row.append(createMedia(item, assets.indexOf(item), root));
      });
      gallery.append(row);
      while (cursor < assets.length && consumed.has(assets[cursor])) cursor += 1;
      planIndex += 1;
    }
    const links = [...contentsList.querySelectorAll("a")];
    const rows = [...gallery.querySelectorAll(".behance-layout")];
    const setActive = (row) => {
      const rowIndex = rows.indexOf(row);
      const activeLink = links.filter((link) => Number(link.dataset.rowIndex || 0) <= rowIndex).at(-1) || links[0];
      links.forEach((link) => {
        const active = link === activeLink;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    };
    if (rows[0]) setActive(rows[0]);
    if ("IntersectionObserver" in window) {
      const visibility = new Map();
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => visibility.set(entry.target, entry.intersectionRatio));
        const visible = rows.filter((row) => (visibility.get(row) || 0) > 0)
          .sort((a, b) => (visibility.get(b) || 0) - (visibility.get(a) || 0));
        if (visible[0]) setActive(visible[0]);
      }, { rootMargin: "-18% 0px -55%", threshold: [0, .15, .35, .65] });
      rows.forEach((row) => observer.observe(row));
    }
  };

  window.PortfolioMediaComponents = {
    createMedia,
    createScroller,
    makeHead,
    renderWebsiteViewer,
    renderAdvertisingSystem,
    renderNewsletterLibrary,
    renderBehanceComposition
  };
})();
