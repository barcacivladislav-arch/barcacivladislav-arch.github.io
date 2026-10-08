(() => {
 const hero=document.querySelector('[data-clarity-hero]');
 const canvas=hero?.querySelector('[data-growth-canvas]');
 if(!canvas) return;
 const ctx=canvas.getContext('2d'), buttons=[...hero.querySelectorAll('[data-growth]')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let w=0,h=0,progress=1,target=1,lastInput=performance.now(),visible=true,frame=0;
 const start=performance.now();
 const random=i=>{const n=Math.sin(i*127.1+31.7)*43758.5453;return n-Math.floor(n);};
 const ease=t=>t*t*(3-2*t), clamp=n=>Math.max(0,Math.min(1,n));
 function resize(){
  hero.style.setProperty('--hero-header',`${document.querySelector('.site-header').getBoundingClientRect().height}px`);
  w=hero.clientWidth;h=hero.clientHeight;
  const d=Math.min(devicePixelRatio||1,2);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);
 }
 function render(now){
  frame=0;if(!visible)return;
  if(!reduced&&now-lastInput>5000)target=1;
  progress+= (target-progress)*.045;
  const s=ease(clamp(progress*2)),g=ease(clamp((progress-.5)*2));
  const mobile=w<761,cx=mobile?w*.53:w*.77,cy=mobile?h*.48:h*.42;
  const unit=Math.min(mobile?w*.068:w*.029,h*.06);
  ctx.clearRect(0,0,w,h);
  const points=[];
  for(let i=0;i<64;i++){
   const col=i%8,row=Math.floor(i/8),angle=Math.atan2(row-3.5,col-3.5);
   const expansion=1+g*.62;
   const gx=cx+(col-3.5)*unit*expansion,gy=cy+(row-3.5)*unit*expansion;
   const drift=reduced?0:Math.sin(now*.0004+i)*unit*.22;
   const nx=cx+(random(i)-.5)*unit*11+drift,ny=cy+(random(i+81)-.5)*unit*9;
   points.push({x:nx+(gx-nx)*s,y:ny+(gy-ny)*s,angle});
  }
  points.forEach((p,i)=>{
   if(s>.05){
    [i%8<7?i+1:-1,i<56?i+8:-1].filter(j=>j>=0).forEach(j=>{
     const q=points[j];ctx.strokeStyle=`rgba(174,167,151,${s*.22})`;ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
    });
   }
   const active=i%9===0||i%11===0;
   ctx.fillStyle=active&&g>.04?`rgba(115,102,255,${.35+g*.65})`:`rgba(237,228,211,${.35+s*.4})`;
   const size=2.3+g*(active?10:1.5);
   ctx.save();ctx.translate(p.x,p.y);ctx.rotate((1-s)*p.angle);ctx.fillRect(-size/2,-size/2,size,size);ctx.restore();
   if(g>.01&&active){
    const dx=Math.cos(p.angle)*unit*1.4*g,dy=Math.sin(p.angle)*unit*1.4*g;
    ctx.strokeStyle=`rgba(115,102,255,${g*.8})`;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+dx,p.y+dy);ctx.stroke();
    ctx.fillRect(p.x+dx-2,p.y+dy-2,4,4);
    for(const turn of [-.6,.6]){
     const length=unit*.7*g*g,ex=p.x+dx+Math.cos(p.angle+turn)*length,ey=p.y+dy+Math.sin(p.angle+turn)*length;
     ctx.beginPath();ctx.moveTo(p.x+dx,p.y+dy);ctx.lineTo(ex,ey);ctx.stroke();ctx.fillRect(ex-2,ey-2,4,4);
    }
   }
  });
  if(g>.45){
   ctx.font=`${mobile?10:12}px 'Portfolio Sans',sans-serif`;ctx.fillStyle=`rgba(229,222,208,${(g-.45)/.55})`;
   ['Brand','Web','Packaging','Campaigns'].forEach((label,i)=>{const p=points[[7,23,47,63][i]];ctx.fillText(label,p.x+15,p.y-10);});
  }
  const stage=progress<.28?0:progress<.76?1:2;
  buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===stage)));
  hero.dataset.growthStage=['chaos','structure','growth'][stage];
  if(!reduced)frame=requestAnimationFrame(render);
 }
 function set(value){target=value;lastInput=performance.now();if(reduced){progress=target;render(lastInput);}else if(!frame)frame=requestAnimationFrame(render);}
 buttons.forEach(b=>b.addEventListener('click',()=>set(Number(b.dataset.growth))));
 hero.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&!e.target.closest('button,a')){const r=hero.getBoundingClientRect();set(clamp((e.clientX-r.left)/r.width));}});
 addEventListener('scroll',()=>{if(w<761){const r=hero.getBoundingClientRect();set(clamp(-r.top/(h*.48)));}},{passive:true});
 new ResizeObserver(resize).observe(hero);
 new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible&&!frame)render(performance.now());else if(!visible){cancelAnimationFrame(frame);frame=0;}}).observe(hero);
 document.addEventListener('visibilitychange',()=>{visible=!document.hidden;if(visible&&!frame)render(performance.now());});
 resize();render(start);
})();
