(() => {
  const api = window.PortfolioExperience;
  const assets = window.PROJECT_MANIFEST?.assets || [];
  if (!api) return;
  const from = (group, patterns) => patterns.flatMap((pattern) => assets.filter((asset) => asset.group === group && pattern.test(asset.source)));
  const unique = (items) => [...new Map(items.map((item) => [item.src, item])).values()];
  const evergreenGroups = [
    { label: "Animal care", title: "Build confidence around specialist care", copy: "An introductory creative and one motion-led consideration example establish the category without repeating funnel variations.", assets: from("evergreen-ads", [/Animal Care Top Funnel\/1080x1080/i, /Animal Middle Funnel Gif 1\/1080 X 1080/i]) },
    { label: "Bundles", title: "Turn product combinations into a clear proposition", copy: "The selected V2 direction communicates the bundle as one useful solution in two complementary brand treatments.", assets: from("evergreen-ads", [/Boundle V2\/1080x1080 cream/i, /Boundle V2\/1080x1080 green/i]) },
    { label: "Product education", title: "Use unexpected hooks to explain the product", copy: "The ‘Don’t buy this product’ and GPT families translate ingredients, use cases and objections into concise campaign stories.", assets: from("evergreen-ads", [/Don_t buy this product\/1080x1080/i, /GPT\/1080x1080/i]) },
    { label: "Problem → solution", title: "Make the benefit visible before the offer", copy: "Lavender and problem–solution creatives frame everyday frustrations before introducing the relevant Herbaris product.", assets: from("evergreen-ads", [/Lavanda\/1080x1080/i, /Lavanda 2\/1080x1080/i, /Problem - Solution V1\/1080x1080/i]) },
    { label: "Customer proof", title: "Let behaviour and reviews carry the argument", copy: "Review-led and search-bar concepts turn familiar digital behaviours into evidence and product discovery.", assets: from("evergreen-ads", [/Reviews Ads\/1080x1080/i, /Search Bars\/Artboard 1 copy 42/i, /Search Bars\/Artboard 1 copy 43/i, /Search Bars\/Artboard 1-1/i, /Search Bars\/Artboard 1-2/i]) },
    { label: "Personal care", title: "Extend the system beyond household care", copy: "A compact selection introduces shampoo, gifting and soap while retaining the same warm, benefit-led communication.", assets: from("evergreen-ads", [/Shampoo\/1080x1080/i, /Soap Gift\/1080x1080 cream/i, /Soaps V1\/1080x1080/i]) }
  ].map((group) => ({ ...group, assets: unique(group.assets) }));
  const summerGroups = [
    { label: "Awareness", title: "Open the campaign with one recognisable world", copy: "Two creative directions are shown in their Meta and Google formats to demonstrate adaptation without turning every resize into a separate deliverable.", assets: from("summer-campaign", [/Top Funnel\/Google 1200x628\/Artboard 2 copy@/i, /Top Funnel\/Google 1200x628\/Artboard 2@/i, /Top Funnel\/Meta 1080x1080\/Artboard 1 copy 2@/i, /Top Funnel\/Meta 1080x1080\/Artboard 4 copy 8@/i]) },
    { label: "Collections", title: "Move from campaign promise to category choice", copy: "Collection ads organise the sale around product needs, giving the middle of the funnel more relevance than a repeated generic discount message.", assets: from("summer-campaign", [/Middle Funnel\//i]) },
    { label: "Conversion", title: "Finish with three distinct product arguments", copy: "The final stage uses three visual directions rather than repeating every product and format variation.", assets: from("summer-campaign", [/Bottom Funnel\/1080x1080\/Artboard 12 copy 29/i, /Bottom Funnel\/1080x1080\/Artboard 4 copy 14/i, /Bottom Funnel\/1080x1080\/Artboard 4 copy 17/i]) }
  ].map((group) => ({ ...group, assets: unique(group.assets) }));
  const evergreenReel = document.querySelector("[data-herbaris-evergreen]");
  const summerReel = document.querySelector("[data-herbaris-summer]");
  if (evergreenReel) api.reel(evergreenReel, evergreenGroups);
  if (summerReel) api.reel(summerReel, summerGroups);

  const websiteAssets = assets.filter((asset) => asset.group === "website" && /evergreen\/website\//i.test(asset.source));
  const websitePages = [{
    label: "Homepage",
    desktop: websiteAssets.find((asset) => /1440w/i.test(asset.source)),
    mobile: websiteAssets.find((asset) => /390w/i.test(asset.source))
  }];
  const websiteHost = document.querySelector("[data-herbaris-website]");
  if (websiteHost && websitePages[0].desktop && websitePages[0].mobile) api.website(websiteHost, websitePages);

  const newsletterAssets = assets.filter((asset) => asset.group === "newsletters" && !/pop[ -]?up/i.test(asset.source));
  const newsletterGroups = [
    { label: "Evergreen", assets: newsletterAssets.filter((asset) => /herbaris\/evergreen\/newsletters\//i.test(asset.source)) },
    { label: "Summer Sale", assets: newsletterAssets.filter((asset) => /herbaris\/summer sale\/newsletters\//i.test(asset.source)) }
  ];
  const inbox = document.querySelector("[data-herbaris-inbox]");
  const reader = document.querySelector("#newsletter-reader");
  if (inbox && reader) api.inbox(inbox, newsletterGroups, reader);
})();
