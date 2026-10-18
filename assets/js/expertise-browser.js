/* Six full disciplines, with shared website and newsletter readers. */
(() => {
  'use strict';
  const node=document.querySelector('#expertise-data'); if(!node)return;
  const data=JSON.parse(node.textContent),root=document.body.dataset.assetRoot||'../';
  const create=(tag,className='',text)=>{const el=document.createElement(tag);el.className=className;if(text!==undefined)el.textContent=text;return el;};

  const webHost=document.querySelector('[data-media-host="web"]');
  const renderWebsite=brand=>{
    const project=data.web[brand]||data.web.herbaris,focused=webHost.contains(document.activeElement)?document.activeElement.dataset.brand:null;
    const content=create('div'),picks=create('div','example-picks');picks.setAttribute('role','group');picks.setAttribute('aria-label','Website project');
    Object.entries(data.web).forEach(([slug,item])=>{
      const button=create('button','',item.name);button.type='button';button.dataset.brand=slug;button.setAttribute('aria-pressed',String(item===project));
      button.addEventListener('click',()=>{const url=new URL(location.href);url.searchParams.set('brand',slug);['component','page','issue'].forEach(key=>url.searchParams.delete(key));url.hash='web';history.replaceState(history.state,'',url);renderWebsite(slug);});picks.append(button);
    });
    const viewer=create('div');PortfolioMediaComponents.renderWebsiteViewer(viewer,project.assets,{root,pages:[{label:project.name,desktop:project.assets[0],mobile:project.assets[1]}]});
    const link=create('a','viewer-link','View the complete '+project.name+' project');link.href=root+'work/'+brand+'/';
    content.append(picks,viewer,link);webHost.replaceChildren(content);webHost.dataset.currentBrand=Object.entries(data.web).find(([,item])=>item===project)?.[0]||'herbaris';if(focused)webHost.querySelector('[data-brand="'+focused+'"]').focus({preventScroll:true});
  };
  renderWebsite(new URL(location.href).searchParams.get('brand')||'herbaris');
  const library=create('div');PortfolioMediaComponents.renderNewsletterLibrary(library,data.disciplines.newsletters.assets,{root,expanded:true,groups:[{label:'Selected newsletter work',assets:data.disciplines.newsletters.assets}]});
  document.querySelector('[data-media-host="newsletters"]').replaceChildren(library);
  const restore=()=>{const params=new URL(location.href).searchParams,brand=params.get('brand')||'herbaris';if(brand!==webHost.dataset.currentBrand)renderWebsite(brand);window.PortfolioMediaComponents?.restoreURLState();const key=params.get('discipline');if(key&&data.disciplines[key])document.getElementById(key)?.scrollIntoView({behavior:'instant'});};
  window.addEventListener('popstate',restore);document.fonts.ready.then(restore);
  document.dispatchEvent(new Event('portfolio:media-ready'));
})();
