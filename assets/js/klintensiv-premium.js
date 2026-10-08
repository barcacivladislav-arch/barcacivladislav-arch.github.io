(() => {
  const api = window.PortfolioExperience;
  const assets = window.PROJECT_MANIFEST?.assets || [];
  if (!api) return;
  const legacyCampaign = document.querySelector(".case-section.klint-curated");
  const legacyBanners = legacyCampaign?.nextElementSibling;
  const legacyNewsletters = legacyBanners?.nextElementSibling;
  if (legacyCampaign) {
    const replacement = document.createElement("div");
    replacement.innerHTML = `
      <section class="case-section wrap reveal" id="campaigns">
        <div class="case-section__head"><span class="case-section__number">01</span><div><h2>From professional trust to product choice.</h2></div><div class="case-section__copy"><h3>Campaign architecture</h3><p>Each category answers a different buying question. The approved selection now moves between professional credibility, category use cases, funnel stages and seasonal conversion without stacking every family vertically.</p></div></div>
        <div class="campaign-reel" data-klintensiv-campaigns aria-label="Klintensiv campaign categories"></div>
      </section>
      <section class="case-section education-stage reveal">
        <div class="case-section__head"><span class="case-section__number">02</span><div><h2>A separate voice for prevention.</h2></div><div class="case-section__copy"><h3>Healthcare education</h3><p>The final poster series uses illustration, metaphor and direct instruction to communicate hygiene and prevention. All eight approved final designs remain available.</p></div></div>
        <div class="campaign-reel" data-klintensiv-posters aria-label="Eight final healthcare posters"></div>
      </section>
      <section class="case-section wrap reveal">
        <div class="case-section__head"><span class="case-section__number">03</span><div><h2>Carry the campaign onto the storefront.</h2></div><div class="case-section__copy"><h3>Website banners</h3><p>Desktop and mobile banner families keep the spring and summer campaigns legible across very different proportions. Each family remains browsable as a campaign system rather than a Behance-style image sequence.</p></div></div>
        <div data-klintensiv-banners aria-label="Klintensiv website banner families"></div>
      </section>
      <section class="case-section wrap reveal">
        <div class="case-section__head"><span class="case-section__number">04</span><div><h2>Campaign thinking continued into the inbox.</h2></div><div class="case-section__copy"><h3>Newsletters</h3><p>Three long-form newsletters extend the same hierarchy into retention while remaining compact to browse and available for focused reading.</p></div></div>
        <div class="campaign-inbox"><div class="inbox-head"><h3>Campaign inbox.</h3><p>Hover to follow the hierarchy through each email, or open one for a focused full-length view.</p></div><div data-klintensiv-inbox></div></div>
      </section>`;
    legacyCampaign.before(...replacement.children);
    legacyCampaign.remove();
    legacyBanners?.remove();
    legacyNewsletters?.remove();
  }
  const group = (name) => assets.filter((asset) => asset.group === name);
  const campaignGroups = [
    { label: "Credibility", title: "Make professional proof visible", copy: "Manufacturing, laboratory and clinical imagery establish the credibility that later promotional messages depend on.", assets: group("credibility") },
    { label: "Categories", title: "One framework across four professional uses", copy: "Colour and application imagery distinguish instruments, nebulisation, hand hygiene and surfaces without fragmenting the brand.", assets: group("categories") },
    { label: "Mouthwash awareness", title: "Introduce a specialist product with context", copy: "Product introduction, format and professional-use imagery establish relevance before the offer becomes direct.", assets: group("mouth-awareness") },
    { label: "Mouthwash conversion", title: "Answer the practical buying questions", copy: "Formats, applications and offer-led messages move the mouthwash campaign from consideration toward action.", assets: group("mouth-conversion") },
    { label: "Objections", title: "Address what sits behind a professional order", copy: "Cost, documentation and supply considerations are treated as distinct business arguments rather than repeated product promotions.", assets: group("objections") },
    { label: "Summer awareness", title: "Open the seasonal campaign broadly", copy: "Range, kits and last-call messaging establish one recognisable blue-and-yellow campaign world.", assets: group("summer-awareness") },
    { label: "Summer collections", title: "Organise the offer around product needs", copy: "Four collection ads make the promotion more useful by directing buyers toward relevant categories.", assets: group("summer-collections") },
    { label: "Summer conversion", title: "Finish with category-specific product choices", copy: "Air, instruments, hand hygiene and surface care demonstrate the conversion system without presenting every product variation.", assets: group("summer-conversion") }
  ];
  const campaignHost = document.querySelector("[data-klintensiv-campaigns]");
  if (campaignHost) api.reel(campaignHost, campaignGroups);
  const posterHost = document.querySelector("[data-klintensiv-posters]");
  if (posterHost) api.reel(posterHost, [{ label: "Final posters", title: "Eight final directions for prevention", copy: "Illustration, metaphor and direct instruction make hygiene risks understandable without turning the communication into a technical manual.", assets: group("posters-final") }]);
  const bannerHost = document.querySelector("[data-klintensiv-banners]");
  if (bannerHost) window.PortfolioMediaComponents?.renderAdvertisingSystem(bannerHost, [], {
    root: "../../",
    groups: [
      { label: "Spring", title: "Spring campaign and kits", purpose: "Website banners", copy: "Desktop and mobile formats carry the same spring offer with hierarchy adjusted for each placement.", assets: group("spring-web") },
      { label: "Summer", title: "Summer campaign adaptation", purpose: "Website banners", copy: "The seasonal campaign retains its blue-and-yellow recognition while changing density between wide and narrow placements.", assets: group("summer-web") }
    ]
  });
  const inbox = document.querySelector("[data-klintensiv-inbox]");
  const reader = document.querySelector("#newsletter-reader");
  if (inbox && reader) api.inbox(inbox, [{ label: "Newsletters", assets: group("newsletters") }], reader);
})();
