(() => {
  const textFromPath = (value = "") => {
    const name = value.replace(/\\/g, "/").split("/").pop().replace(/\.[^.]+$/, "");
    return name.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim() || "Selected work";
  };

  const slug = (value = "") => String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || "work";
  const fingerprint = (value = "") => {
    let hash = 2166136261;
    for (const character of String(value)) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    return (hash >>> 0).toString(36);
  };
  const assetKey = (asset) => fingerprint(asset.src || asset.source || asset.canonicalHash || "");
  const genericTitle = (value = "") => /^(?:frame(?:\s*id)?\s*\d+|background\s*\+?\s*shadow(?:[\s-]*\d+)?|image\s*\d*|untitled(?:\s*\d+)?)$/i.test(value.trim());
  // Presentation labels are separate from immutable filenames and inventory data.
  const displayTitle = (asset, index = 0, family = "") => {
    let title = String(asset.displayTitle || asset.alt || textFromPath(asset.source || asset.src))
      .replace(/\s+[—–-]\s+Newsletters?.*$/i, "").trim();
    title = title.replace(/\bBoundle\b/gi, "Bundle").replace(/\bLast\s*Chnace\b/gi, "Last chance")
      .replace(/\bFire\s*Day\s*Lounch\b/gi, "Launch email");
    if (!title || genericTitle(title)) {
      const context = String(family || "Newsletter").replace(/\bAll Issues\b/i, "Newsletter");
      return `${context} · issue ${String(index + 1).padStart(2, "0")}`;
    }
    return title;
  };
  const accessibleNewsletterTitle = (asset, index, family) => {
    const original = String(asset.alt || "");
    const firstPart = original.replace(/\s+[—–-]\s+Newsletters?.*$/i, "").trim();
    return original && !genericTitle(firstPart) ? original : `${displayTitle(asset, index, family)} newsletter`;
  };
  const componentKey = (gallery, kind, assets = []) => {
    if (!gallery.id) {
      const context = gallery.dataset.primaryCategory || gallery.dataset.gallery || gallery.getAttribute("aria-label") || kind;
      gallery.id = `media-${slug(context)}-${fingerprint(`${kind}:${assets.map((asset) => asset.src || asset.source).join("|")}`)}`;
    }
    gallery.dataset.mediaComponentKey = gallery.id;
    return gallery.id;
  };
  const selectionURL = (key, kind, value) => {
    const url = new URL(location.href);
    url.searchParams.set("component", key);
    url.searchParams.delete("page");
    url.searchParams.delete("issue");
    url.searchParams.set(kind, value);
    url.hash = key;
    return url;
  };
  const writeSelection = (key, kind, value) => {
    const url = selectionURL(key, kind, value);
    if (url.href !== location.href) history.replaceState(history.state, "", url);
    return url.href;
  };
  const selectionReaders = new Map();
  const restoreSelections = (initial = false) => {
    const url = new URL(location.href);
    selectionReaders.forEach(({ gallery, restore }, key) => {
      if (!gallery.isConnected) return;
      restore(url.searchParams.get("component") === key ? url : null, initial);
    });
  };
  window.addEventListener("popstate", () => restoreSelections(false));
  const registerSelection = (gallery, key, restore) => {
    selectionReaders.set(key, { gallery, restore });
    requestAnimationFrame(() => {
      if (gallery.isConnected && new URL(location.href).searchParams.get("component") === key) restore(new URL(location.href), true);
    });
  };
  const addShareControl = (container, getURL, label = "Copy link") => {
    const group = document.createElement("div");
    group.className = "media-share";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "media-share__button";
    button.textContent = label;
    const status = document.createElement("span");
    status.className = "media-share__status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    button.addEventListener("click", async () => {
      const url = getURL();
      group.querySelector("input")?.remove();
      try {
        if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(url);
        status.textContent = "Link copied";
      } catch {
        status.textContent = "Select and copy this link:";
        const field = document.createElement("input");
        field.className = "media-share__fallback";
        field.readOnly = true;
        field.value = url;
        field.setAttribute("aria-label", "Shareable media link");
        group.append(field);
        field.focus();
        field.select();
      }
    });
    group.append(button, status);
    container.append(group);
    return group;
  };
  const headingLevelFor = (gallery) => gallery.closest("[data-primary-category]") ? 4 : 3;

  const ratioClass = (asset) => {
    const ratio = asset.aspectRatio || (asset.width && asset.height ? asset.width / asset.height : 1);
    return ratio > 1.25 ? "landscape" : ratio < .8 ? "portrait" : "square";
  };

  const createMedia = (asset, index = 0, root = "", options = {}) => {
    const figure = document.createElement("figure");
    const ratio = asset.aspectRatio || (asset.width && asset.height ? asset.width / asset.height : 1);
    figure.className = `project-media project-media--${asset.kind} project-media--${ratioClass(asset)}`;
    figure.style.setProperty("--asset-ratio", String(Math.max(.12, Math.min(4, ratio))));
    figure.dataset.fit = "contain";
    figure.dataset.role = asset.role || "media";
    figure.dataset.category = asset.category || asset.group || "project";
    if (asset.canonicalHash) figure.dataset.assetHash = asset.canonicalHash.slice(0, 12);

    if (asset.kind === "video") {
      const video = document.createElement("video");
      video.src = root + asset.src;
      if (asset.width) video.width = asset.width;
      if (asset.height) video.height = asset.height;
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
      image.src = window.PortfolioArtworkMotion?.prepare(image, root + asset.src) || root + asset.src;
      if (asset.width) image.width = asset.width;
      if (asset.height) image.height = asset.height;
      const eager = options.eager || asset.loadingPriority === "high" || index < 2;
      image.loading = eager ? "eager" : "lazy";
      if (asset.loadingPriority === "high") image.fetchPriority = "high";
      image.decoding = "async";
      image.alt = options.displayAlt || asset.alt || textFromPath(asset.source);
      // Shared presentation owns fit: natural media defaults to contain, while
      // authored paired boards can use their original equal-height crop.
      image.style.objectPosition = asset.focalPosition || "50% 50%";
      if (options.lightbox !== false) image.dataset.lightbox = "true";
      figure.append(image);
    }
    return figure;
  };

  const makeHead = (title, note, description = "", level = 3) => {
    const head = document.createElement("div");
    head.className = "media-component__head";
    const copy = document.createElement("div");
    const heading = document.createElement(`h${Math.max(2, Math.min(6, level))}`);
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

  let tabSetCount = 0;
  const createTabs = (items, onSelect, label, duration = 8000, panel = null) => {
    const shell = document.createElement("div");
    shell.className = "media-tabs-shell";
    const tabs = document.createElement("div");
    tabs.className = "media-tabs";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", label);
    const hasVariants = items.some((item) => item.variant || /\bvariant\b/i.test(item.label));
    const tabGroups = new Map();
    if (hasVariants) {
      shell.classList.add("media-tabs-shell--grouped");
      tabs.classList.add("media-tabs--grouped");
      [["primary", "Primary pages"], ["variants", "Variants"]].forEach(([key, title]) => {
        const group = document.createElement("div");
        group.className = `media-tabs__group media-tabs__group--${key}`;
        group.setAttribute("role", "presentation");
        const groupLabel = document.createElement("span");
        groupLabel.className = "media-tabs__group-label";
        groupLabel.textContent = title;
        group.append(groupLabel);
        tabs.append(group);
        tabGroups.set(key, group);
      });
    }
    let activeIndex = 0;
    let timer = 0;
    let isVisible = true;
    let isPaused = true;
    const tabSetId = `media-tabs-${++tabSetCount}`;
    shell.dataset.paused = "true";
    if (panel) {
      panel.id = `${tabSetId}-panel`;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", `${tabSetId}-0`);
      panel.tabIndex = 0;
    }
    const durationSeconds = Math.round(duration / 1000);
    shell.style.setProperty("--media-tab-duration", `${duration}ms`);
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stopRotation = () => window.clearInterval(timer);
    const startRotation = () => {
      stopRotation();
      if (reducedMotion || items.length < 2 || !isVisible || isPaused) return;
      timer = window.setInterval(() => {
        selectIndex((activeIndex + 1) % items.length, false);
      }, duration);
    };
    const buttons = items.map((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "tab");
      button.id = `${tabSetId}-${index}`;
      if (panel) button.setAttribute("aria-controls", panel.id);
      button.setAttribute("aria-selected", String(index === 0));
      button.tabIndex = index === 0 ? 0 : -1;
      button.textContent = item.label;
      const variant = Boolean(item.variant || /\bvariant\b/i.test(item.label));
      button.dataset.mediaVariant = String(variant);
      button.addEventListener("click", () => selectIndex(index, true));
      button.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
          : (index + (event.key === "ArrowLeft" ? -1 : 1) + items.length) % items.length;
        buttons[nextIndex].focus();
        selectIndex(nextIndex, true);
      });
      (hasVariants ? tabGroups.get(variant ? "variants" : "primary") : tabs).append(button);
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
    playPause.textContent = "Play";
    playPause.setAttribute("aria-label", `Play ${label.toLowerCase()}`);
    playPause.setAttribute("aria-pressed", "false");
    playPause.hidden = reducedMotion;
    const next = document.createElement("button");
    next.type = "button";
    next.textContent = "→";
    next.setAttribute("aria-label", `Next ${label.toLowerCase()}`);
    const timing = document.createElement("span");
    timing.className = "media-tabs__timing";
    timing.hidden = reducedMotion;
    timing.setAttribute("aria-label", `Automatic selection time: ${durationSeconds} seconds`);
    timing.innerHTML = `<span class="media-tabs__time">${durationSeconds}s</span><span class="media-tabs__progress"><span></span></span>`;
    const progressFill = timing.querySelector(".media-tabs__progress span");
    controls.append(previous, playPause, next, timing);
    shell.append(tabs, controls);
    const selectIndex = (index, userInitiated = false) => {
      activeIndex = Math.max(0, Math.min(items.length - 1, index));
      const button = buttons[activeIndex];
      buttons.forEach((candidate) => {
        const active = candidate === button;
        candidate.setAttribute("aria-selected", String(active));
        candidate.tabIndex = active ? 0 : -1;
      });
      onSelect(items[activeIndex], activeIndex, { userInitiated });
      if (panel) panel.setAttribute("aria-labelledby", button.id);
      progressFill.style.animation = "none";
      requestAnimationFrame(() => { progressFill.style.animation = ""; });
      startRotation();
    };
    shell.selectTab = (index) => selectIndex(index, false);
    const selectOffset = (offset) => selectIndex((activeIndex + offset + buttons.length) % buttons.length, true);
    previous.addEventListener("click", () => selectOffset(-1));
    next.addEventListener("click", () => selectOffset(1));
    const pause = () => {
      isPaused = true;
      shell.dataset.paused = "true";
      playPause.textContent = "Play";
      playPause.setAttribute("aria-label", `Play ${label.toLowerCase()}`);
      playPause.setAttribute("aria-pressed", "false");
      stopRotation();
    };
    const resume = () => {
      isPaused = false;
      delete shell.dataset.paused;
      playPause.textContent = "Pause";
      playPause.setAttribute("aria-label", `Pause ${label.toLowerCase()}`);
      playPause.setAttribute("aria-pressed", "true");
      startRotation();
    };
    playPause.addEventListener("click", () => isPaused ? resume() : pause());
    tabs.addEventListener("focusin", pause);
    document.addEventListener("visibilitychange", () => {
      isVisible = !document.hidden;
      startRotation();
    });
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
    track.setAttribute("role", "region");
    track.setAttribute("aria-label", label);
    const controls = document.createElement("div");
    controls.className = "media-scroller__controls";
    const cue = document.createElement("span");
    cue.className = "media-scroller__cue";
    cue.textContent = "";
    track.setAttribute("aria-description", "Use the previous and next buttons, swipe, or focus this gallery and use the arrow keys.");
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
      const value = max ? Math.max(0, Math.min(100, Math.round(track.scrollLeft / max * 100))) : 100;
      fill.style.width = `${value}%`;
      meter.setAttribute("aria-valuenow", String(value));
      const items = [...track.children];
      const origin = items[0]?.offsetLeft || 0;
      const visible = items.map((item, index) => ({ index, start: item.offsetLeft - origin, width: item.offsetWidth }))
        .filter((item) => item.start + item.width > track.scrollLeft + 2 && item.start < track.scrollLeft + track.clientWidth - 2);
      const first = (visible[0]?.index || 0) + 1;
      const last = (visible.at(-1)?.index ?? first - 1) + 1;
      const range = first === last ? String(first) : `${first}–${last}`;
      cue.textContent = `${range} / ${items.length} ${/newsletter/i.test(label) ? "issues" : "assets"}`;
      shell.dataset.assetCount = String(items.length);
      previous.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max - 2;
      cue.hidden = max <= 2;
      controls.hidden = max <= 2;
    };
    const move = (direction) => track.scrollBy({ left: direction * step(), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    previous.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));
    track.addEventListener("keydown", (event) => {
      if (event.target !== track) return;
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "Home" || event.key === "End") {
        track.scrollTo({ left: event.key === "Home" ? 0 : track.scrollWidth, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      } else move(event.key === "ArrowLeft" ? -1 : 1);
    });
    track.addEventListener("scroll", update, { passive: true });
    track.addEventListener("load", update, true);
    new ResizeObserver(update).observe(track);
    requestAnimationFrame(update);
    return shell;
  };

  const isMobileScreen = (asset) => {
    if (asset.role === "desktop-screen") return false;
    if (asset.role === "mobile-screen") return true;
    return /mobile|390w|phone/i.test(asset.source || "") || (asset.width > 0 && asset.width < 1000);
  };
  const sectionTitle = (asset) => {
    const parts = (asset.source || "").replace(/\\/g, "/").split("/");
    return (parts.at(-2) || "Website").replace(/[-_]/g, " ");
  };

  const labelCase = (value) => value.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  const isBannerAsset = (asset) => {
    const source = (asset.source || asset.src || "").replace(/\\/g, "/");
    if (/(?:^|\/)(?:website[ _-]+)?banners?(?:\/|$)/i.test(source)) return true;
    if (asset.group === "website" && /^(?:desktop|mobile)-screen$/.test(asset.role || "")) return false;
    return /(?:^|[\/\s_-])banners?(?:[\/\s_.-]|$)|announcement|top[ -]?bar/i.test(`${source} ${asset.role || ""}`);
  };

  const renderWebsiteViewer = (gallery, assets, { root = "", pages = null } = {}) => {
    gallery.classList.add("website-viewer-library");
    const eligible = assets.filter((asset) => !isBannerAsset(asset));
    const families = pages?.length
      ? pages.map((page) => ({ ...page, assets: [page.desktop, page.mobile].filter(Boolean) })).filter((page) => page.assets.length)
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
    const key = componentKey(gallery, "website", families.flatMap((family) => family.assets));
    families.forEach((family) => {
      family.key = family.key || `${slug(family.label)}-${assetKey(family.assets[0])}`;
      family.variant = Boolean(family.variant || /\bvariant\b/i.test(family.label));
    });
    let activeFamily = families[0];
    const stage = document.createElement("div");
    stage.className = "media-switcher__stage";
    const renderFamily = (familyGroup, index = 0, { userInitiated = false } = {}) => {
      const { label: family, assets: familyAssets, desktop, mobile } = familyGroup;
      activeFamily = familyGroup;
      stage.replaceChildren();
      const section = document.createElement("section");
      section.className = "website-viewer";
      section.dataset.mediaPageKey = familyGroup.key;
      const desktops = desktop ? [desktop] : familyAssets.filter((asset) => !isMobileScreen(asset));
      const mobiles = mobile ? [mobile] : familyAssets.filter(isMobileScreen);
      const devices = desktops.length && mobiles.length ? "Desktop + mobile" : mobiles.length ? "Mobile" : "Desktop";
      section.append(makeHead(family, devices, "Scroll inside each screen to inspect the complete page.", headingLevelFor(gallery)));
      const count = Math.max(desktops.length, mobiles.length, 1);
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
      if (userInitiated) writeSelection(key, "page", familyGroup.key);
      document.dispatchEvent(new Event("portfolio:media-ready"));
    };
    const tabs = families.length > 1 ? createTabs(families, renderFamily, "Website pages", 12000, stage) : null;
    if (tabs) gallery.append(tabs);
    gallery.append(stage);
    addShareControl(gallery, () => writeSelection(key, "page", activeFamily.key), "Copy page link");
    renderFamily(families[0]);
    registerSelection(gallery, key, (url, initial) => {
      const index = url ? families.findIndex((family) => family.key === url.searchParams.get("page")) : -1;
      if (index < 0) return;
      if (tabs) tabs.selectTab(index);
      else renderFamily(families[index]);
      if (initial) gallery.scrollIntoView({ block: "start", behavior: "auto" });
    });
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

  const renderAdvertisingSystem = (gallery, assets, { root = "", familyFromPath = sectionTitle, groups = null, expanded = false } = {}) => {
    gallery.classList.add("advertising-system");
    gallery.classList.toggle("advertising-system--expanded", expanded);
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
    const key = componentKey(gallery, "advertising", families.flatMap((family) => family.assets));
    const stage = document.createElement("div");
    stage.className = `media-switcher__stage${expanded ? " media-family-stack" : ""}`;
    const buildFamily = (familyGroup) => {
      const family = familyGroup.label;
      const familyAssets = familyGroup.assets;
      const [defaultPurpose, defaultExplanation] = objectiveFor(family);
      const section = document.createElement("section");
      section.className = "ad-category";
      section.id = `${key}-${slug(family)}-${assetKey(familyAssets[0])}`;
      section.dataset.mediaFamilyKey = section.id;
      section.dataset.mediaFamilyLabel = familyGroup.title || family;
      section.dataset.mediaKind = "advertising";
      section.dataset.assetCount = String(familyAssets.length);
      section.setAttribute("aria-label", family);
      const purpose = familyGroup.purpose || defaultPurpose;
      const note = `${familyAssets.length} ${familyAssets.length === 1 ? "asset" : "assets"}${purpose === "Campaign system" ? "" : ` · ${purpose}`}`;
      section.append(makeHead(familyGroup.title || family, note, familyGroup.copy ?? defaultExplanation, headingLevelFor(gallery)));
      ["landscape", "square", "portrait"].forEach((format) => {
        const items = familyAssets.filter((asset) => formatFor(asset) === format);
        if (!items.length) return;
        const group = document.createElement("div");
        group.className = `ad-format ad-format--${format}`;
        const title = document.createElement("p");
        title.className = "media-format-label";
        title.textContent = `${labelCase(format)} · ${items.length} ${items.length === 1 ? "asset" : "assets"}`;
        const track = document.createElement("div");
        track.className = "ad-track";
        items.forEach((asset, index) => track.append(createMedia(asset, index, root)));
        group.append(title, createScroller(track, `${family}, ${format} ads`));
        section.append(group);
      });
      return section;
    };
    const renderFamily = (familyGroup) => {
      stage.replaceChildren(buildFamily(familyGroup));
      document.dispatchEvent(new Event("portfolio:media-ready"));
    };
    if (expanded) {
      stage.append(...families.map(buildFamily));
      gallery.append(stage);
      document.dispatchEvent(new Event("portfolio:media-ready"));
      return;
    }
    if (families.length > 1) gallery.append(createTabs(families, renderFamily, "Advertising categories", 12000, stage));
    gallery.append(stage);
    renderFamily(families[0]);
  };

  const newsletterFamily = (asset) => {
    const parts = (asset.source || "").replace(/\\/g, "/").split("/");
    const marker = parts.findIndex((part) => /newsletters?/i.test(part));
    const candidate = marker >= 0 ? parts[marker + 1] : "";
    return candidate && !/\.[a-z0-9]+$/i.test(candidate) ? labelCase(candidate) : "All Issues";
  };

  const renderNewsletterLibrary = (gallery, assets, { root = "", groups = null, expanded = false, showIntro = true } = {}) => {
    gallery.classList.add("newsletter-library");
    gallery.classList.toggle("newsletter-library--expanded", expanded);
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
    const key = componentKey(gallery, "newsletters", families.flatMap((family) => family.assets));
    if (expanded) {
      families.forEach((family) => {
        const section = document.createElement("section");
        section.className = "newsletter-campaign";
        section.id = `${key}-${slug(family.label)}-${assetKey(family.assets[0])}`;
        section.dataset.mediaFamilyKey = section.id;
        section.dataset.mediaFamilyLabel = family.title || family.label;
        section.dataset.mediaKind = "newsletter";
        section.dataset.assetCount = String(family.assets.length);
        section.setAttribute("aria-label", family.label);
        section.append(makeHead(family.title || family.label, `${family.assets.length} ${family.assets.length === 1 ? "newsletter" : "newsletters"}`, family.copy ?? "", headingLevelFor(gallery)));
        const library = document.createElement("div");
        library.className = "newsletter-campaign__library";
        library.id = `${section.id}-issues`;
        section.append(library);
        gallery.append(section);
        renderNewsletterLibrary(library, family.assets, { root, groups: [family], showIntro: false });
      });
      document.dispatchEvent(new Event("portfolio:media-ready"));
      return;
    }
    const grid = document.createElement("div");
    grid.className = "newsletter-library__grid";
    const scroller = createScroller(grid, "Newsletter issues");
    const dialog = document.createElement("dialog");
    dialog.className = "media-reader";
    dialog.id = `newsletter-reader-${++tabSetCount}`;
    dialog.setAttribute("aria-label", "Newsletter reader");
    const header = document.createElement("div");
    header.className = "media-reader__head";
    const title = document.createElement("p");
    const progress = document.createElement("span");
    progress.setAttribute("aria-live", "polite");
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
    viewport.setAttribute("role", "region");
    viewport.setAttribute("aria-label", "Expanded newsletter. Scroll to read the complete email.");
    header.append(title, progress, previous, next, close);
    dialog.append(header, viewport);
    if (showIntro) {
      let intro = inbox?.querySelector(".inbox-head") || null;
      if (!intro) {
        intro = document.createElement("div");
        intro.className = "inbox-head inbox-head--shared";
        if (inbox) inbox.insertBefore(intro, inbox.firstChild);
        else gallery.append(intro);
      }
      intro.classList.add("inbox-head--shared");
      let introTitle = intro.querySelector("h2, h3, h4, h5, h6");
      if (!introTitle) {
        introTitle = document.createElement(`h${headingLevelFor(gallery)}`);
        intro.prepend(introTitle);
      }
      let introCopy = intro.querySelector("p");
      if (!introCopy) {
        introCopy = document.createElement("p");
        intro.append(introCopy);
      }
      introTitle.textContent = "Campaign inbox.";
      introCopy.textContent = "Scroll each email preview, or open it to read the complete newsletter.";
    }
    const tabs = families.length > 1 ? createTabs(families, renderGroup, "Newsletter campaigns", 16000, scroller) : null;
    if (tabs) gallery.append(tabs);
    gallery.append(scroller, dialog);

    let selected = 0;
    let activeFamily = families[0];
    let activeAssets = families[0].assets;
    let buttons = [];
    let returnFocus = null;
    const open = (index, userInitiated = true) => {
      if (!dialog.open) returnFocus = document.activeElement;
      selected = (index + activeAssets.length) % activeAssets.length;
      const asset = activeAssets[selected];
      title.textContent = displayTitle(asset, selected, activeFamily.title || activeFamily.label);
      progress.textContent = `${selected + 1} / ${activeAssets.length}`;
      viewport.replaceChildren(createMedia(asset, 0, root, { lightbox: false, controls: true, displayAlt: accessibleNewsletterTitle(asset, selected, activeFamily.title || activeFamily.label) }));
      viewport.scrollTop = 0;
      buttons.forEach((button, buttonIndex) => {
        const isSelected = buttonIndex === selected;
        button.classList.toggle("is-selected", isSelected);
        button.closest(".newsletter-card")?.classList.toggle("is-selected", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
      });
      if (!dialog.open) dialog.showModal();
      if (userInitiated) writeSelection(key, "issue", assetKey(asset));
      requestAnimationFrame(() => viewport.focus());
    };
    addShareControl(header, () => writeSelection(key, "issue", assetKey(activeAssets[selected])), "Copy issue link");
    function renderGroup(group) {
      activeFamily = group;
      activeAssets = group.assets;
      selected = 0;
      buttons = [];
      if (dialog.open) dialog.close();
      grid.replaceChildren();
      activeAssets.forEach((asset, index) => {
        const card = document.createElement("article");
        card.className = "newsletter-card";
        card.dataset.mediaIssueKey = assetKey(asset);
        card.dataset.mediaTitle = displayTitle(asset, index, group.title || group.label);
        const preview = document.createElement("span");
        preview.className = "newsletter-card__viewport";
        preview.tabIndex = 0;
        preview.setAttribute("role", "region");
        preview.setAttribute("aria-label", `Scrollable preview: ${displayTitle(asset, index, group.title || group.label)}`);
        preview.append(createMedia(asset, index, root, { lightbox: false, controls: false, eager: index < 4, displayAlt: accessibleNewsletterTitle(asset, index, group.title || group.label) }));
        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.className = "newsletter-card__open";
        openButton.setAttribute("aria-pressed", "false");
        openButton.setAttribute("aria-haspopup", "dialog");
        openButton.setAttribute("aria-controls", dialog.id);
        openButton.setAttribute("aria-label", `Open expanded newsletter: ${displayTitle(asset, index, group.title || group.label)}`);
        const label = document.createElement("span");
        label.textContent = displayTitle(asset, index, group.title || group.label);
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
    dialog.addEventListener("close", () => {
      if (dialog.open) return;
      const url = new URL(location.href);
      if (url.searchParams.get("component") === key && url.searchParams.has("issue")) {
        url.searchParams.delete("component");
        url.searchParams.delete("issue");
        history.replaceState(history.state, "", url);
      }
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    });
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener("keydown", (event) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        open(selected + (event.key === "ArrowLeft" ? -1 : 1));
      }
    });
    renderGroup(families[0]);
    registerSelection(gallery, key, (url, initial) => {
      if (!url) {
        if (dialog.open) dialog.close();
        return;
      }
      const issue = url.searchParams.get("issue");
      const groupIndex = families.findIndex((family) => family.assets.some((asset) => assetKey(asset) === issue));
      if (groupIndex < 0) return;
      const group = families[groupIndex];
      if (activeFamily !== group) {
        if (tabs) tabs.selectTab(groupIndex);
        else renderGroup(group);
      }
      open(group.assets.findIndex((asset) => assetKey(asset) === issue), false);
      if (initial) gallery.scrollIntoView({ block: "start", behavior: "auto" });
    });
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
        layout = rowAssets.length === 3 ? "three-up" : rowAssets.some((item) => item.kind === "video") ? "motion-pair" : "two-up";
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
    displayTitle,
    restoreURLState: () => restoreSelections(false),
    createMedia,
    createScroller,
    makeHead,
    renderWebsiteViewer,
    renderAdvertisingSystem,
    renderNewsletterLibrary,
    renderBehanceComposition
  };
})();
