// Shared PDF reader. Zoom changes the page itself, then rerenders visible canvases.
const root = document.querySelector('[data-pdf-viewer]');
if (root) startReader(root);
async function startReader(root) {
  const url = root.dataset.pdf;
  const steps = [80,90,100,110,125,150,175,200];
  let pdf, scale = 1, current = 1, busy = false, revision = 0, raf = 0;
  const pages = [];
  root.classList.add('pdf-viewer');
  root.innerHTML = `<div class="viewer-toolbar" role="toolbar" aria-label="PDF controls">
    <button data-action="outline" aria-label="Toggle document outline" aria-expanded="false" title="Contents">☰</button>
    <div class="toolbar-group"><button data-action="previous" aria-label="Previous page">←</button><label>Page <input data-page type="number" min="1" value="1" aria-label="Page number"></label><span>/ <span data-total>—</span></span><button data-action="next" aria-label="Next page">→</button></div>
    <div class="toolbar-group"><button data-action="out" aria-label="Zoom out">−</button><select data-zoom aria-label="Zoom percentage">${steps.map(n=>`<option value="${n}" ${n===100?'selected':''}>${n}%</option>`).join('')}</select><button data-action="in" aria-label="Zoom in">+</button></div>
    <button data-action="width">Fit width</button><button data-action="fit">Fit page</button>
    <div class="toolbar-group toolbar-end"><button data-action="fullscreen">Fullscreen</button><a data-open target="_blank" rel="noopener">Open PDF ↗</a><a data-download download>Download ↓</a></div>
    </div><div class="viewer-body"><nav class="pdf-outline" hidden aria-label="Document outline"></nav><div class="pdf-document" tabindex="0" aria-label="Scrollable PDF pages"><div class="viewer-status" role="status">Loading PDF…</div><div class="pdf-stack"></div></div></div><div class="reader-help">← → pages · Ctrl / ⌘ + wheel to zoom · Open PDF for search, text selection and printing</div>`;
  root.querySelector('[data-open]').href=url;root.querySelector('[data-download]').href=url;
  const doc=root.querySelector('.pdf-document'),stack=root.querySelector('.pdf-stack'),status=root.querySelector('.viewer-status'),outline=root.querySelector('.pdf-outline');
  const input=root.querySelector('[data-page]'),select=root.querySelector('[data-zoom]');
  const action=name=>root.querySelector(`[data-action="${name}"]`);
  function sync(){input.value=current;action('previous').disabled=!pdf||current===1;action('next').disabled=!pdf||current===pdf.numPages;action('out').disabled=scale<=.8;action('in').disabled=scale>=2;}
  function updateCurrent(){const top=doc.scrollTop+doc.clientHeight*.25;let best=0;for(let i=0;i<pages.length;i++){if(pages[i].el.offsetTop<=top)best=i;else break}current=best+1;sync();}
  function go(n){if(!pdf)return;current=Math.max(1,Math.min(pdf.numPages,Math.round(Number(n)||1)));doc.scrollTop=pages[current-1].el.offsetTop-24;sync();pump();}
  function setZoom(percent){if(!pdf)return;const p=pages[current-1],fraction=(doc.scrollTop-p.el.offsetTop)/Math.max(1,p.el.offsetHeight);scale=Math.max(.8,Math.min(2,Number(percent)/100));revision++;
    pages.forEach(p=>{p.el.style.width=`${p.width*scale}px`;p.el.style.height=`${p.height*scale}px`;});
    select.querySelector('option[data-custom]')?.remove();const n=Math.round(scale*100);if(!steps.includes(n)){const o=new Option(`${n}%`,String(n));o.dataset.custom='true';select.add(o)}select.value=String(n);
    doc.scrollTop=p.el.offsetTop+fraction*p.el.offsetHeight;sync();pump();
  }
  function stepZoom(direction){const n=Math.round(scale*100);setZoom(direction>0?(steps.find(v=>v>n)||200):([...steps].reverse().find(v=>v<n)||80));}
  function nearby(p){return p.el.offsetTop+p.el.offsetHeight>doc.scrollTop-500&&p.el.offsetTop<doc.scrollTop+doc.clientHeight+500;}
  async function pump(){if(busy||!pdf)return;busy=true;try{for(;;){const p=pages.find(p=>nearby(p)&&p.revision!==revision&&!p.failed);if(!p)break;const rev=revision;const page=await pdf.getPage(p.n);const ratio=Math.min(devicePixelRatio||1,2);const viewport=page.getViewport({scale:scale*96/72});const pixels=Math.min(ratio,Math.sqrt(12000000/(viewport.width*viewport.height)));const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width*pixels);canvas.height=Math.ceil(viewport.height*pixels);await page.render({canvasContext:canvas.getContext('2d'),viewport,transform:[pixels,0,0,pixels,0,0]}).promise;
      if(rev===revision){p.el.replaceChildren(canvas);p.revision=rev;p.el.setAttribute('aria-label',`Page ${p.n}`)}
    }
    // Keep only nearby canvases in memory; white page dimensions remain stable.
    pages.forEach(p=>{if(Math.abs(p.el.offsetTop-doc.scrollTop)>doc.clientHeight*5&&p.el.querySelector('canvas')){p.el.replaceChildren();p.revision=-1;}});
  }catch(e){status.hidden=false;status.textContent='A page could not render. Use Open PDF to continue reading.';console.error(e)}finally{busy=false}}
  root.querySelector('.viewer-toolbar').addEventListener('click',async e=>{const a=e.target.closest('[data-action]')?.dataset.action;if(!a)return;if(a==='fullscreen'){try{if(document.fullscreenElement)await document.exitFullscreen();else await root.requestFullscreen()}catch{status.hidden=false;status.textContent='Fullscreen is unavailable in this browser. Use Open PDF instead.'}return}if(!pdf)return;
    if(a==='previous')go(current-1);if(a==='next')go(current+1);if(a==='in')stepZoom(1);if(a==='out')stepZoom(-1);
    if(a==='width')setZoom((doc.clientWidth-48)/pages[current-1].width*100);
    if(a==='fit')setZoom(Math.min((doc.clientWidth-48)/pages[current-1].width,(doc.clientHeight-48)/pages[current-1].height)*100);
    if(a==='outline'){outline.hidden=!outline.hidden;action('outline').setAttribute('aria-expanded',String(!outline.hidden));pump();}
  });
  select.addEventListener('change',()=>setZoom(select.value));input.addEventListener('change',()=>go(input.value));
  doc.addEventListener('scroll',()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{updateCurrent();pump()})},{passive:true});
  doc.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();stepZoom(e.deltaY<0?1:-1)}},{passive:false});
  doc.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();go(current+1)}if(e.key==='ArrowLeft'){e.preventDefault();go(current-1)}});
  document.addEventListener('fullscreenchange',()=>{action('fullscreen').textContent=document.fullscreenElement?'Exit fullscreen':'Fullscreen';pump()});
  try{
    const lib=await import('./assets/pdfjs/pdf.min.mjs');
    lib.GlobalWorkerOptions.workerSrc=new URL('./assets/pdfjs/pdf.worker.min.mjs',import.meta.url).href;
    const assets=new URL('./assets/pdfjs/',import.meta.url).href;
    pdf=await lib.getDocument({url,standardFontDataUrl:assets+'standard_fonts/',cMapUrl:assets+'cmaps/',cMapPacked:true,wasmUrl:assets+'wasm/'}).promise;root.querySelector('[data-total]').textContent=pdf.numPages;input.max=pdf.numPages;
    const first=await pdf.getPage(1),natural=first.getViewport({scale:96/72});
    for(let n=1;n<=pdf.numPages;n++){const el=document.createElement('div');el.className='pdf-page';el.setAttribute('role','img');el.setAttribute('aria-label',`Page ${n}, loading`);el.style.width=`${natural.width}px`;el.style.height=`${natural.height}px`;stack.append(el);pages.push({n,el,width:natural.width,height:natural.height,revision:-1})}
    status.hidden=true;await pump();sync();
    // Resolve every page's own size (landscape and mixed-size documents included).
    for(const p of pages){const page=await pdf.getPage(p.n),v=page.getViewport({scale:96/72});p.width=v.width;p.height=v.height;p.el.style.width=`${p.width*scale}px`;p.el.style.height=`${p.height*scale}px`}
    const items=await pdf.getOutline();
    async function destination(dest){try{const d=typeof dest==='string'?await pdf.getDestination(dest):dest;if(!d)return;const n=typeof d[0]==='number'?d[0]:await pdf.getPageIndex(d[0]);go(n+1)}catch{}}
    function tree(items){const ul=document.createElement('ul');for(const item of items){const li=document.createElement('li'),b=document.createElement('button');b.textContent=item.title;b.onclick=()=>destination(item.dest);li.append(b);if(item.items?.length)li.append(tree(item.items));ul.append(li)}return ul}
    if(items?.length)outline.append(tree(items));else{const p=document.createElement('p');p.textContent='Pages';outline.append(p);for(let n=1;n<=pdf.numPages;n++){const b=document.createElement('button');b.textContent=`${n} `;b.onclick=()=>go(n);outline.append(b)}}
    new ResizeObserver(()=>pump()).observe(doc);
  }catch(e){status.hidden=false;status.textContent='The reader could not load. Open or download the PDF using the links above.';console.error(e)}
}
