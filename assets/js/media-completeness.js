/* Load before media-components.js and all project renderers. Original sequences remain primary. */
(() => {
  const slug = location.pathname.match(/\/work\/([^/]+)/)?.[1];
  if (!slug) return;
  const root = document.body.dataset.assetRoot || '../../';
  const covered = new Map();
  const supplemental = new Set();
  const invocations = [];
  const interactiveStates = [];
  const categories = [];
  const transfers = [];
  let project = null;
  let inSupplement = false;
  let finishing = null;
  let api;
  const normalize = (value) => {
    if (!value) return '';
    let normalized = value;
    try { normalized = decodeURIComponent(new URL(value, location.href).pathname); } catch {}
    const index = normalized.indexOf('/assets/');
    return (index >= 0 ? normalized.slice(index + 1) : normalized.replace(/^(?:\.\.\/|\.\/|\/)+/, '')).split('?')[0];
  };
  const excluded = (asset) => {
    if (slug === 'klintensiv' && /(?:^|\/)(?:tofu|mofu|bofu) v1\.webp$/i.test(asset.src || '')) return true;
    return slug === 'herbaris' && /summer sale/i.test(`${asset.source} ${asset.src}`) && /pop[ -]?up/i.test(`${asset.source} ${asset.src}`);
  };
  const record = (assets, kind, host) => {
    assets.filter(Boolean).filter((asset) => !excluded(asset)).forEach((asset) => {
      const path = normalize(asset.src);
      if (!path) return;
      covered.set(path, kind);
      if (inSupplement) supplemental.add(path);
    });
  };
  const isBanner = (asset) => {
    const source = (asset.source || asset.src || '').replace(/\\/g, '/');
    if (/(?:^|\/)(?:website[ _-]+)?banners?(?:\/|$)/i.test(source)) return true;
    if (asset.group === 'website' && /^(?:desktop|mobile)-screen$/.test(asset.role || '')) return false;
    return /(?:^|[\/\s_-])banners?(?:[\/\s_.-]|$)|announcement|top[ -]?bar/i.test(`${source} ${asset.role || ''}`);
  };
  // These are redundant overview boards, not the original project modules or files.
  // Keep their inventory entries and distinguish this user-requested presentation decision.
  const intergassesAdditionalScreens = new Set([
    'Collection Pages/Shop Page - Grid View.webp',
    'Collection Pages/Shop Page.webp',
    'E-commerce Pages/Cart Preview.webp',
    'E-commerce Pages/Checkout-1.webp',
    'E-commerce Pages/Checkout.webp',
    'E-commerce Pages/Home Page.webp',
    'E-commerce Pages/Order Complete-1.webp',
    'E-commerce Pages/Order Complete.webp',
    'E-commerce Pages/Shopping Cart-1.webp',
    'E-commerce Pages/Shopping Cart.webp'
  ].map(file => 'assets/portfolio/intergasses/website/Website/' + file));
  const presentationReason = (asset) => {
    const src = normalize(asset.src);
    if (asset.group === 'direct-source' && /^assets\/work\/overview\//i.test(src)) return 'Redundant overview board omitted from presentation at the user’s request; original file retained.';
    if (slug === 'intergasses' && asset.group === 'website' && intergassesAdditionalScreens.has(src)) return 'Additional website screen omitted with the Intergasses “More from the project” section at the user’s request on 17 October 2026; original file retained.';
    return null;
  };
  const transferRoute = (asset) => slug === 'cdl' && asset.group === 'snus' ? '/work/snus/' : null;
  const mobileLike = (asset) => /mobile|390w|phone/i.test(asset.source || '') || (asset.width > 0 && asset.width < 1000);
  const websiteSelection = (assets, options) => {
    if (options?.pages?.length) return options.pages.flatMap((page) => [page.desktop, page.mobile].filter(Boolean));
    const groups = new Map();
    for (const asset of assets.filter((asset) => !isBanner(asset))) {
      const key = (asset.source || '').replace(/\\/g, '/').split('/').at(-2) || 'Website';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(asset);
    }
    return [...groups.values()].flatMap((group) => {
      const desktop = group.filter((asset) => !mobileLike(asset));
      const mobile = group.filter(mobileLike);
      const count = Math.max(desktop.length, mobile.length, 1);
      return [...desktop.slice(0, count), ...mobile.slice(0, count)];
    });
  };
  const wrap = (value) => {
    if (!value || value.__preservationWrapped) return value;
    const wrapMethod = (name, selection) => {
      const original = value[name];
      if (typeof original !== 'function') return;
      value[name] = function (host, assets, options, ...rest) {
        // Explicit exclusions must also be respected by original callers.
        const permitted = Array.isArray(assets) ? assets.filter((asset) => !excluded(asset)) : assets;
        let settings = options;
        if (options && typeof options === 'object') {
          settings = { ...options };
          if (options.groups) settings.groups = options.groups.map((group) => ({ ...group, assets: group.assets.filter((asset) => !excluded(asset)) }));
          if (options.pages) settings.pages = options.pages.map((page) => ({ ...page, desktop: page.desktop && !excluded(page.desktop) ? page.desktop : null, mobile: page.mobile && !excluded(page.mobile) ? page.mobile : null }));
        }
        const result = original.call(this, host, permitted, settings, ...rest);
        record(selection(permitted || [], settings), name, host);
        if (!inSupplement) {
          const previous = invocations.findIndex((call) => call.host === host && call.name === name);
          const call = { host, name, assets: permitted || [], selected: selection(permitted || [], settings), options: settings, rest };
          if (previous >= 0) invocations[previous] = call;
          else invocations.push(call);
        }
        return result;
      };
    };
    wrapMethod('renderAdvertisingSystem', (assets, options) => options?.groups ? options.groups.flatMap((group) => group.assets || []) : assets);
    wrapMethod('renderNewsletterLibrary', (assets, options) => options?.groups ? options.groups.flatMap((group) => group.assets || []) : assets);
    wrapMethod('renderWebsiteViewer', websiteSelection);
    // Behance's third argument is its key, followed by options. Asset inventory remains the full ordered list.
    wrapMethod('renderBehanceComposition', (assets) => assets);
    const create = value.createMedia;
    value.createMedia = function (asset, ...args) {
      const result = create.call(this, asset, ...args);
      record([asset], 'createMedia', null);
      return result;
    };
    Object.defineProperty(value, '__preservationWrapped', { value: true });
    return value;
  };
  api = wrap(window.PortfolioMediaComponents);
  Object.defineProperty(window, 'PortfolioMediaComponents', {
    configurable: true,
    enumerable: true,
    get: () => api,
    set: (value) => { api = wrap(value); }
  });
  const scanDOM = () => {
    document.querySelectorAll('main img[src], main video[src], main video[poster], main source[src]').forEach((element) => {
      if (element.closest('.preservation-library')) return;
      for (const attribute of ['src', 'poster', 'data-motion-original']) {
        const src = normalize(element.getAttribute(attribute));
        if (src) covered.set(src, 'direct DOM');
      }
    });
  };
  const titleCase = (value) => value.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const friendlyGroup = (value) => ({ other: 'Project artwork', identity: 'Identity', packaging: 'Packaging', 'direct-source': 'Project artwork', 'cover-source': 'Project cover', 'black-cobra': 'Black Cobra', 'sixth-wave': 'Sixth Wave', 'behance': 'Project sequence', graphics: 'Brand applications' }[value] || titleCase(value));
  const mediaType = (asset) => {
    const value = `${asset.group} ${asset.category} ${asset.role} ${asset.source}`;
    if (/newsletter|(?:^|\s)(?:campaign|flows)(?:\s|$)/i.test(value) && (slug === 'chariot' || /newsletter/i.test(value))) return 'newsletter';
    if (isBanner(asset)) return 'advertising';
    if (/website|landing.page/i.test(asset.group || '')) return 'website';
    if (/ads|advertis|campaign|awareness|conversion|credibility|objections|posters|social|categories|spring.web|summer.web/i.test(value)) return 'advertising';
    return 'artwork';
  };
  const sourceFamily = (asset) => {
    const parts = (asset.source || asset.src).replace(/\\/g, '/').split('/');
    const marker = parts.findIndex((part) => /^ads?$|^ad creatives$|^newsletters?$/i.test(part));
    let family = marker >= 0 ? parts[marker + 1] : parts.at(-2);
    if (!family || /\.[a-z0-9]+$/i.test(family)) family = friendlyGroup(asset.group);
    return titleCase(family);
  };
  const canonicalCoverage = () => {
    const hashes = new Set();
    project?.assets.forEach((asset) => { if (covered.has(normalize(asset.src)) && asset.canonicalHash) hashes.add(asset.canonicalHash); });
    return hashes;
  };
  const currentInvocations = () => invocations.filter((call) => !call.retired && call.host?.isConnected !== false);
  const currentInteractiveStates = () => interactiveStates.filter((state) => state.host?.isConnected !== false);
  const rebuildPrimaryCoverage = () => {
    covered.clear();
    for (const call of currentInvocations()) for (const asset of call.selected) covered.set(normalize(asset.src), call.name);
    for (const state of currentInteractiveStates()) for (const asset of state.assets) covered.set(normalize(asset.src), state.kind);
    scanDOM();
  };
  const report = () => {
    if (!project) return { slug, ready: false, remaining: null };
    scanDOM();
    const hashes = canonicalCoverage();
    const entries = project.assets.map((asset) => {
      const src = normalize(asset.src);
      const destination = transferRoute(asset);
      const omitted = presentationReason(asset);
      const status = asset.excluded ? 'excluded' : destination ? 'transferred' : supplemental.has(src) ? 'supplemental' : covered.has(src) ? 'primary' : asset.canonicalHash && hashes.has(asset.canonicalHash) ? 'duplicate' : omitted ? 'presentation-excluded' : 'remaining';
      return { src: asset.src, source: asset.source, group: asset.group, status, duplicateOf: asset.duplicateOf || null, excluded: asset.excluded || null, presentationReason: omitted, destinationRoute: destination, importedFrom: asset.importedFrom || null, copied: asset.copied, origins: asset.origins };
    });
    const summary = entries.reduce((counts, entry) => ({ ...counts, [entry.status]: (counts[entry.status] || 0) + 1 }), { primary: 0, supplemental: 0, duplicate: 0, excluded: 0, 'presentation-excluded': 0, transferred: 0, remaining: 0 });
    const calls = [...currentInvocations().map((call) => ({ renderer: call.name, host: call.host?.id || call.host?.dataset?.gallery || call.host?.getAttribute?.('aria-label') || call.host?.className || '', assets: call.selected.map((asset) => normalize(asset.src)) })), ...currentInteractiveStates().map((state) => ({ renderer: state.kind, host: state.host?.id || state.host?.getAttribute?.('aria-label') || state.host?.className || '', assets: state.assets.map((asset) => normalize(asset.src)) }))];
    return { slug, ready: true, manifestEntries: project.manifestEntries, sourceInventoryEntries: project.sourceInventoryEntries || project.assets.length, inventoryEntries: entries.length, summary, primaryCalls: calls, categories, transfers, entries };
  };
  const uniqueAssets = (assets) => {
    const seen = new Set();
    return assets.filter((asset) => {
      if (!asset || excluded(asset) || asset.excluded) return false;
      const key = asset.canonicalHash || normalize(asset.src);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  const groupAssets = (name) => uniqueAssets(project.assets.filter((asset) => asset.group === name));
  const lastCall = (host, name) => [...invocations].reverse().find((call) => call.host === host && call.name === name);
  const category = (name, host, assets) => {
    categories.push({ name, host: host?.dataset?.primaryCategory || host?.getAttribute?.('aria-label') || '', count: uniqueAssets(assets).length, assets: uniqueAssets(assets).map((asset) => normalize(asset.src)) });
  };
  const retainContext = (host, groups) => {
    for (const group of groups.filter(Boolean)) {
      const head = document.createElement('div');
      head.className = 'media-component__head';
      const copy = document.createElement('div');
      if (group.title) { const title = document.createElement('h4'); title.textContent = group.title; copy.append(title); }
      if (group.copy) { const paragraph = document.createElement('p'); paragraph.textContent = group.copy; copy.append(paragraph); }
      if (!copy.childElementCount) continue;
      head.append(copy); host.append(head);
    }
  };
  const primaryHost = (parent, key, label) => {
    let host = parent.querySelector(`[data-primary-category="${key}"]`);
    if (host) return host;
    host = document.createElement('div');
    host.className = 'primary-media-extension';
    host.dataset.primaryCategory = key;
    host.setAttribute('aria-label', label);
    parent.append(host);
    return host;
  };
  const renderAds = (host, groups, name, contexts = []) => {
    if (!host) return;
    const seen = new Set();
    const completeGroups = groups.map((group) => ({ ...group, assets: uniqueAssets(group.assets || []).filter((asset) => {
      const key = asset.canonicalHash || normalize(asset.src);
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }) })).filter((group) => group.assets.length);
    host.replaceChildren();
    api.renderAdvertisingSystem(host, completeGroups.flatMap((group) => group.assets), { root, groups: completeGroups, expanded: true });
    // Preserve authored introductory prose without repeating the overview's artwork.
    if (contexts.length) {
      const intro = document.createElement('div');
      retainContext(intro, contexts);
      host.prepend(intro);
    }
    if (host.dataset.primaryCategory && host.querySelector('h4')?.textContent !== name) {
      const heading = document.createElement('h3');
      heading.className = 'primary-media-extension__heading';
      heading.id = `primary-${slug}-${host.dataset.primaryCategory}-title`;
      heading.textContent = name;
      host.prepend(heading);
      host.setAttribute('role', 'region');
      host.setAttribute('aria-labelledby', heading.id);
    }
    category(name, host, completeGroups.flatMap((group) => group.assets));
  };
  const renderNewsletters = (call, groups) => {
    const authoredIntro = call.host.querySelector(':scope > .inbox-head');
    authoredIntro?.remove();
    call.host.replaceChildren();
    api.renderNewsletterLibrary(call.host, groups.flatMap((group) => group.assets), { ...(call.options || {}), root, groups, expanded: true });
    if (authoredIntro) call.host.prepend(authoredIntro);
    category('Newsletters', call.host, groups.flatMap((group) => group.assets));
  };
  const partition = (assets, definitions) => {
    const remaining = new Set(assets);
    const groups = definitions.map((definition) => {
      const selected = [...remaining].filter(definition.match);
      selected.forEach((asset) => remaining.delete(asset));
      const { match, ...metadata } = definition;
      return { ...metadata, assets: selected };
    });
    if (remaining.size) {
      const families = new Map();
      for (const asset of remaining) {
        const label = sourceFamily(asset);
        if (!families.has(label)) families.set(label, []);
        families.get(label).push(asset);
      }
      for (const [label, familyAssets] of families) groups.push({ label, title: label, copy: '', assets: familyAssets });
    }
    return groups;
  };
  const reorganizePrimary = (inventory) => {
    if (!project.assets.length) return;
    const originalCalls = [...invocations];
    const handled = new Set();
    if (slug === 'herbaris') {
      const evergreen = document.querySelector('[data-herbaris-evergreen]');
      const summer = document.querySelector('[data-herbaris-summer]');
      const previous = lastCall(evergreen, 'renderAdvertisingSystem')?.options?.groups || [];
      const metadata = (label) => previous.find((group) => group.label === label) || { label, title: label, copy: '' };
      const definitions = [
        ['Animal care', /\/Animal (?:Care|Middle)/i], ['Bundles', /\/Boundle V[12]\//i],
        ['Product education', /\/(?:Don_t buy this product|GPT)\//i], ['Problem → solution', /\/(?:Lavanda(?: 2)?|Problem - Solution V[12])\//i],
        ['Customer proof', /\/(?:Reviews Ads|Search Bars)\//i], ['Personal care', /\/(?:Shampoo|Soap Gift|Soaps V[12])\//i], ['Kits', /\/Kit Ads\//i]
      ].map(([label, pattern]) => ({ ...metadata(label), match: (asset) => pattern.test(asset.source) }));
      if (evergreen) {
        renderAds(evergreen, partition(groupAssets('evergreen-ads'), definitions), 'Evergreen advertising', previous.filter((group) => group.label === 'Campaign overview'));
        handled.add(evergreen);
      }
      const summerMetadata = lastCall(summer, 'renderAdvertisingSystem')?.options?.groups || [];
      const summerDefinition = (label, pattern) => ({ ...(summerMetadata.find((group) => group.label === label) || { label, title: label, copy: '' }), match: (asset) => pattern.test(asset.source) });
      if (summer) {
        renderAds(summer, partition(groupAssets('summer-campaign'), [summerDefinition('Awareness', /\/Top Funnel\//i), summerDefinition('Collections', /\/Middle Funnel\//i), summerDefinition('Conversion', /\/Bottom Funnel\//i), summerDefinition('Last days', /\/Last Days\//i)]), 'Summer Sale advertising');
        handled.add(summer);
      }
      const packaging = document.querySelector('[data-asset-group="packaging"]');
      if (packaging) {
        const hashes = canonicalCoverage();
        const additions = groupAssets('packaging').filter((asset) => !covered.has(normalize(asset.src)) && !hashes.has(asset.canonicalHash));
        additions.forEach((asset, index) => packaging.append(api.createMedia({ ...asset, fit: 'contain' }, index, root)));
        packaging.dataset.assetCount = String(packaging.querySelectorAll('.project-media').length);
        category('Packaging', packaging, groupAssets('packaging'));
      }
    }
    if (slug === 'klintensiv') {
      const campaign = document.querySelector('[data-klintensiv-campaigns]');
      const spring = document.querySelector('[data-klintensiv-spring]');
      const summer = document.querySelector('[data-klintensiv-summer]');
      const posters = document.querySelector('[data-klintensiv-posters]');
      const existing = lastCall(campaign, 'renderAdvertisingSystem')?.options?.groups || [];
      const old = (label) => existing.find((group) => group.label === label) || { label, title: label, copy: '' };
      const sourceMatches = (pattern) => (asset) => pattern.test((asset.source || '').replace(/\\/g, '/'));
      const communication = groupAssets('campaign-system');
      const educational = communication.filter(sourceMatches(/\/Level 4-Propaganda Posters\//i));
      const evergreenAssets = uniqueAssets([...groupAssets('category-campaign'), ...groupAssets('mouthwash-campaign'), ...communication.filter((asset) => !educational.includes(asset))]);
      if (campaign) {
        invocations.filter((call) => call.host === campaign).forEach((call) => { call.retired = true; });
        campaign.replaceChildren(); campaign.classList.remove('advertising-system', 'advertising-system--expanded'); campaign.classList.add('project-gallery--families');
        renderAds(campaign, [
          { label: 'Earlier brand positioning', assets: groupAssets('brand-positioning') },
          ...partition(evergreenAssets, [
            { label: 'Professional communication', match: sourceMatches(/\/Level 3-Ad Creatives\//i) },
            { ...old('Categories'), match: (asset) => asset.group === 'category-campaign' },
            { ...old('Mouthwash awareness'), match: (asset) => asset.group === 'mouthwash-campaign' && !/\/Bottom Funnel\//i.test(asset.source) },
            { ...old('Mouthwash conversion'), match: (asset) => asset.group === 'mouthwash-campaign' },
            { ...old('Objections'), match: sourceMatches(/\/Trust Crisis Based ads\//i) }
          ])
        ], 'Evergreen campaigns');
        handled.add(campaign);
      }
      if (posters) {
        const final = lastCall(posters, 'renderAdvertisingSystem')?.options?.groups?.[0] || { label: 'Final posters', title: 'Final posters', copy: '' };
        renderAds(posters, partition(educational, [
          { ...final, match: sourceMatches(/\/Finals\/Preview\//i) },
          { label: 'Round 1 concepts', title: 'Round 1 concepts', copy: '', match: sourceMatches(/\/Round 1 Concepts\//i) },
          { label: 'Round 2', title: 'Round 2', copy: '', match: sourceMatches(/\/Round 2\//i) },
          { label: 'Text edits', title: 'Text edits', copy: '', match: sourceMatches(/\/Text Edits\//i) }
        ]), 'Healthcare education');
        handled.add(posters);
      }
      if (spring) {
        const springAssets = uniqueAssets([...groupAssets('spring-campaign'), ...groupAssets('newsletters').filter(sourceMatches(/\/Spring Sale 2026\//i))]);
        renderAds(spring, partition(springAssets, [
          { label: 'Storefront and kit banners', purpose: 'Storefront', copy: 'Desktop and mobile variants keep the launch and kit offers legible at different sizes.', match: sourceMatches(/\/(?:General top funnel banners|Promotion page banner)\//i) },
          { label: 'Announcement bars', title: 'Announcement bars', copy: '', match: sourceMatches(/\/Announcment Bar\//i) },
          { label: 'Stickers', title: 'Stickers', copy: '', match: sourceMatches(/\/Sticker\//i) },
          { label: 'Newsletter covers', title: 'Newsletter covers', copy: '', match: sourceMatches(/\/Newsletter cover-Last day\//i) }
        ]), 'Spring campaign');
        handled.add(spring);
      }
      if (summer) {
        renderAds(summer, partition(groupAssets('summer-campaign'), [
          { label: 'Launch and awareness', match: sourceMatches(/\/Creative ads\/1\./i) },
          { label: 'Collection ads', match: sourceMatches(/\/Creative ads\/2\./i) },
          { label: 'Product conversion', match: sourceMatches(/\/Creative ads\/level 4\./i) },
          { label: 'Catalog ads', title: 'Catalog ads', copy: '', match: sourceMatches(/\/Creative ads\/3\./i) },
          { label: 'Storefront banners', match: sourceMatches(/\/Website Materials\//i) }
        ]), 'Summer campaign');
        handled.add(summer);
      }
    }
    if (slug === 'capodopera') {
      const host = document.querySelector('[data-campaign-reel]');
      const call = lastCall(host, 'renderAdvertisingSystem');
      if (host && call) {
        const groups = (call.options?.groups || []).map((group) => ({ ...group, assets: group.assets || [] }));
        const used = new Set(groups.flatMap((group) => group.assets).map((asset) => normalize(asset.src)));
        groups.unshift({ label: 'Campaign formats', title: 'Campaign formats', copy: '', assets: groupAssets('ads').filter((asset) => !used.has(normalize(asset.src))) });
        groups.push({ label: 'Website banners', title: 'Website banners', copy: '', assets: groupAssets('website').filter(isBanner) });
        renderAds(host, groups, 'Advertising and campaign banners'); handled.add(host);
      }
    }
    if (slug === 'elite-homes') {
      const identity = document.querySelector('[data-gallery="elite-brand"]');
      if (identity && groupAssets('social').length) {
        const parent = identity.closest('.behance-story-shell')?.parentElement || identity.parentElement;
        const host = primaryHost(parent, 'social', 'Elite Homes social and campaign work');
        renderAds(host, [{ label: 'Social and campaign work', title: 'Social and campaign work', copy: '', assets: groupAssets('social') }], 'Social and campaign work');
      }
    }
    if (slug === 'snus') {
      const imported = inventory.projects.cdl.assets.filter((asset) => asset.group === 'snus' && !asset.excluded).map((asset) => ({ ...asset, importedFrom: 'cdl' }));
      project.sourceInventoryEntries = project.assets.length;
      project.assets = [...project.assets, ...imported];
      const story = document.querySelector('[data-gallery="snus-behance"]');
      if (story && imported.length) {
        const parent = story.closest('.behance-story-shell')?.parentElement || story.parentElement;
        const host = primaryHost(parent, 'snus-applications', 'CDL SNUS digital and print applications');
        renderAds(host, partition(uniqueAssets(imported), [
          { label: 'Digital flyers', title: 'Digital flyers', copy: '', match: (asset) => /\/digital-flyers\//i.test(asset.source) },
          { label: 'Print flyers', title: 'Print flyers', copy: '', match: (asset) => /\/flyer-for-print\//i.test(asset.source) }
        ]), 'SNUS digital and print applications');
        transfers.push({ sourceProject: 'cdl', destinationRoute: '/work/snus/', assets: imported.map((asset) => normalize(asset.src)) });
      }
    }
    if (slug === 'cdl') transfers.push({ sourceProject: 'cdl', destinationRoute: '/work/snus/', assets: project.assets.filter((asset) => transferRoute(asset)).map((asset) => normalize(asset.src)) });
    // Existing specialised readers stay primary; all their campaigns become visible together.
    for (const call of originalCalls) {
      if (handled.has(call.host) || !call.host?.isConnected) continue;
      if (call.host.hasAttribute('data-klint-new-ads') || call.host.hasAttribute('data-herbaris-bf-ads')) continue;
      if (call.name === 'renderNewsletterLibrary' && !call.options?.renderIssue) {
        let assets = groupAssets('newsletters');
        if (slug === 'chariot') assets = uniqueAssets(project.assets.filter((asset) => call.assets.some((original) => original.group === asset.group)));
        if (slug === 'klintensiv') assets = assets.filter((asset) => /^klintensiv\/newsletters\//i.test(asset.source));
        const oldGroups = call.options?.groups;
        const groups = oldGroups?.length ? oldGroups.map((group) => ({ ...group, assets: assets.filter((asset) => group.assets.some((original) => normalize(original.src) === normalize(asset.src))) })) : partition(assets, []);
        const used = new Set(groups.flatMap((group) => group.assets).map((asset) => normalize(asset.src)));
        const remaining = assets.filter((asset) => !used.has(normalize(asset.src)));
        groups.push(...partition(remaining, []));
        renderNewsletters(call, groups);
      } else if (call.name === 'renderAdvertisingSystem') {
        renderAds(call.host, call.options?.groups || partition(call.assets, []), call.host.getAttribute('aria-label') || 'Advertising');
      }
    }
  };
  const makeWebsitePages = (assets) => {
    // Keep extra variants as single-device pages, preserving their source identity.
    // Explicit mobile tokens remain authoritative even when the source export is wider than 1000px.
    return assets.map((asset) => {
      const source = (asset.source || '').replace(/\\/g, '/');
      const file = source.split('/').pop().replace(/\.[^.]+$/, '');
      const intergassesMobile = slug === 'intergasses' && (/\-1$/.test(file) || /Shop Page$/.test(file) || /E-commerce Pages\/Home Page\./i.test(source) || /Product Page\/Home Page\./i.test(source));
      const mobile = mobileLike(asset) || intergassesMobile;
      return { label: `${sourceFamily(asset)} · ${file}`, desktop: mobile ? null : asset, mobile: mobile ? asset : null };
    });
  };
  const addSupplement = (missing) => {
    if (!missing.length || !api) return;
    const section = document.createElement('section');
    section.className = 'preservation-library wrap';
    section.id = 'complete-project-library';
    const heading = document.createElement('h2');
    heading.textContent = 'More from the project';
    const note = document.createElement('p');
    note.className = 'preservation-library__note';
    note.textContent = 'Explore additional artwork, campaign formats and screens.';
    section.append(heading, note);
    const groups = new Map();
    missing.forEach((asset) => {
      const type = mediaType(asset);
      const key = `${asset.group}|${type}`;
      if (!groups.has(key)) groups.set(key, { type, group: asset.group, assets: [] });
      groups.get(key).assets.push(asset);
    });
    for (const group of groups.values()) {
      const detail = document.createElement('details');
      detail.className = 'preservation-library__group';
      detail.open = true;
      const summary = document.createElement('summary');
      const title = document.createElement('span');
      title.textContent = friendlyGroup(group.group);
      const count = document.createElement('span');
      count.textContent = `${group.assets.length} ${group.assets.length === 1 ? 'item' : 'items'}`;
      summary.append(title, count);
      const body = document.createElement('div');
      body.className = 'preservation-library__body';
      detail.append(summary, body);
      section.append(detail);
      const render = () => {
        if (detail.dataset.rendered) return;
        detail.dataset.rendered = 'true';
        const familyMap = new Map();
        group.assets.forEach((asset) => {
          const key = sourceFamily(asset);
          if (!familyMap.has(key)) familyMap.set(key, []);
          familyMap.get(key).push(asset);
        });
        const families = [...familyMap].map(([label, assets]) => ({ label, title: label, purpose: `${assets.length} items`, copy: '', assets }));
        inSupplement = true;
        try {
          if (group.type === 'advertising') api.renderAdvertisingSystem(body, group.assets, { root, groups: families, expanded: true });
          else if (group.type === 'newsletter') api.renderNewsletterLibrary(body, group.assets, { root, groups: families, expanded: true });
          else if (group.type === 'website') api.renderWebsiteViewer(body, group.assets, { root, pages: makeWebsitePages(group.assets) });
          else {
            body.classList.add('preservation-artwork');
            group.assets.forEach((asset, index) => body.append(api.createMedia({ ...asset, fit: 'contain', loadingPriority: 'low' }, index, root)));
          }
        } finally { inSupplement = false; }
        document.dispatchEvent(new Event('portfolio:media-ready'));
      };
      recordSupplementalInventory(group.assets);
      // Remaining source groups start open, with their real readers already populated.
      render();
      detail.addEventListener('toggle', () => { if (detail.open) render(); });
      detail.addEventListener('click', () => { if (!detail.open) render(); });
    }
    const destination = document.querySelector('main .project-contact, main .project-switcher, main .next-project, main .project-pagination');
    if (destination) destination.before(section);
    else document.querySelector('main')?.append(section);
  };
  const recordSupplementalInventory = (assets) => {
    assets.forEach((asset) => {
      const path = normalize(asset.src);
      covered.set(path, 'supplemental library');
      supplemental.add(path);
    });
  };
  const finish = () => {
    if (finishing) return finishing;
    finishing = fetch(root + 'assets/data/preservation-ledger.json').then((response) => {
      if (!response.ok) throw new Error(`Preservation inventory failed (${response.status}).`);
      return response.json();
    }).then((inventory) => {
      project = inventory.projects[slug];
      if (!project) return;
      scanDOM();
      reorganizePrimary(inventory);
      rebuildPrimaryCoverage();
      const hashes = canonicalCoverage();
      const pending = new Set();
      const missing = project.assets.filter((asset) => {
        if (asset.excluded || presentationReason(asset) || transferRoute(asset) || !asset.sourceExists || !asset.copied || covered.has(normalize(asset.src))) return false;
        const key = asset.canonicalHash || asset.src;
        if (hashes.has(key) || pending.has(key)) return false;
        pending.add(key);
        return true;
      });
      addSupplement(missing);
      window.PORTFOLIO_MEDIA_REPORT = report();
      document.documentElement.classList.add('preservation-ready');
      document.dispatchEvent(new Event('portfolio:preservation-ready'));
    }).catch((error) => {
      console.error(error);
      window.PORTFOLIO_MEDIA_REPORT = { slug, ready: false, error: error.message };
      document.documentElement.classList.add('preservation-error');
    });
    return finishing;
  };
  // Interactive components register the actual arrays used by their controls, not inferred files.
  // In particular, each CDL flavour sequence supplies its fifteen real state paths here.
  const registerPrimaryAssets = (host, assets, kind = 'interactive state') => {
    if (!host || !Array.isArray(assets)) return;
    const previous = interactiveStates.findIndex((state) => state.host === host && state.kind === kind);
    const state = { host, assets, kind };
    if (previous >= 0) interactiveStates[previous] = state;
    else interactiveStates.push(state);
    record(assets, kind, host);
  };
  window.PortfolioPreservation = { report, finish, registerPrimaryAssets };
  // All authored script tags and their Promise microtasks run before this callback.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { setTimeout(finish, 0); }, { once: true });
  else setTimeout(finish, 0);
})();
