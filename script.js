
const filters = {daylight:'none',warm:'saturate(1.05) hue-rotate(10deg)',cool:'saturate(1.05) hue-rotate(-10deg)',dim:'brightness(0.9) contrast(0.95)'};
function setLighting(mode){document.documentElement.style.setProperty('--light-filter', filters[mode] || 'none');for (const b of document.querySelectorAll('[data-light]')){b.classList.toggle('active', b.dataset.light===mode);}}

// Conversions
// --- sRGB -> XYZ -> xyY & Lab (D65) ---
function srgbToLinear(u){ return (u <= 0.04045) ? (u/12.92) : Math.pow((u+0.055)/1.055, 2.4); }

function rgb255ToXyz(r,g,b){
  const R=srgbToLinear(r/255), G=srgbToLinear(g/255), B=srgbToLinear(b/255);
  const X = 0.4124564*R + 0.3575761*G + 0.1804375*B;
  const Y = 0.2126729*R + 0.7151522*G + 0.0721750*B;
  const Z = 0.0193339*R + 0.1191920*G + 0.9503041*B;
  return {X:X*100, Y:Y*100, Z:Z*100}; // scale 0..100
}

function xyzToXyY({X,Y,Z}){ const sum=X+Y+Z; return sum===0?{x:0,y:0,Y}:{x:X/sum,y:Y/sum,Y}; }

function xyzToLab({X,Y,Z}){
  const Xn=95.047, Yn=100.000, Zn=108.883;
  const f=(t)=> (t>0.008856)?Math.cbrt(t):(7.787*t + 16/116);
  const x=f(X/Xn), y=f(Y/Yn), z=f(Z/Zn);
  return {L:116*y-16, a:500*(x-y), b:200*(y-z)};
}

function rgbToXyLab(r,g,b){ const xyz=rgb255ToXyz(r,g,b); return { xyY: xyzToXyY(xyz), Lab: xyzToLab(xyz) }; }

// --- ΔE*ab (CIE76) ---
function deltaE76(L1,a1,b1,L2,a2,b2){
  const dL=L1-L2, da=a1-a2, db=b1-b2;
  return Math.sqrt(dL*dL + da*da + db*db);
}

function hexToRgb(hex){
  const h = hex.replace('#','').trim();
  const n = parseInt(h, 16);
  return [ (n>>16)&255, (n>>8)&255, n&255 ];
}
function rgbToHex([r,g,b]){
  return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function normFinish(f){
  if (!f) return 'unknown';
  if (Array.isArray(f) && f.length) return String(f[0]).toLowerCase();
  return String(f).toLowerCase();
}


const COLORS = [
  {name:'Black',               code:'BL',  rgb:[0,0,0], finish:['Gloss']},
  {name:'White',               code:'WH',  rgb:[248,245,241], finish:['Gloss']},
  {name:'Brilliant White',     code:'BW', rgb:[246,243,238], finish:['Satin']},
  {name:'Glacier White',       code:'GL', rgb:[239,238,233], finish:['Satin']},
  {name:'Snow',                code:'SW',  rgb:[250,248,243], finish:['Satin']},
  {name:'Light Almond',        code:'LA',  rgb:[240,233,215], finish:['Gloss']},
  {name:'Biscuit',             code:'BI',  rgb:[248,240,222], finish:['Satin']},
  {name:'Architectural White', code:'RW', rgb:[237,236,231], finish:['Satin']},
  {name:'Almond',              code:'AL',  rgb:[241,232,202], finish:['Gloss']},
  {name:'Luna Gray',           code:'LG', rgb:[228,227,222], finish:['Satin']},
  {name:'Mist',                code:'MI',  rgb:[217,218,220], finish:['Satin']},
  {name:'Pumice',              code:'PM',  rgb:[227,221,207], finish:['Satin']},
  {name:'Sand',                code:'SD',  rgb:[228,218,193], finish:['Satin']},
  {name:'Stone',               code:'ST',  rgb:[226,219,201], finish:['Satin']},
  {name:'Clay',                code:'CY',  rgb:[201,196,176], finish:['Satin']},
  {name:'Taupe',               code:'TP',  rgb:[194,185,170], finish:['Satin']},
  {name:'Sage',                code:'SA',  rgb:[208,203,171], finish:['Satin']},
  {name:'Gray',                code:'GR',  rgb:[163,160,159], finish:['Gloss']},
  {name:'Pebble',              code:'PB',  rgb:[181,180,175], finish:['Satin']},
  {name:'Cobblestone',        code:'CS',  rgb:[147,146,141], finish:['Satin']},
  {name:'Slate',               code:'SL',  rgb:[119,123,124], finish:['Satin']},
  {name:'Signal Red',          code:'SR',  rgb:[176,53,48], finish:['Satin']},
  {name:'Espresso',            code:'EP',  rgb:[107,89,75], finish:['Satin']},
  {name:'Truffle',             code:'TF',  rgb:[96,91,85], finish:['Satin']},
  {name:'Deep Sea',            code:'DE',  rgb:[50,60,72], finish:['Satin']},
  {name:'Midnight',            code:'MN',  rgb:[34,34,36], finish:['Satin']},
  {name:'Brown',               code:'BR',  rgb:[74,49,35], finish:['Gloss']}
];

let currentFinish = 'all';
function setFinish(mode){
  currentFinish = mode;                   // 'all' | 'gloss' | 'satin' | 'metal'
  document.querySelectorAll('[data-finish]').forEach(b=>{
    b.classList.toggle('active', b.dataset.finish === mode);
  });
  renderGrid();
}

// function enrichColors(cols){
//   return cols.map(c=>{const rgb=c.rgb?c.rgb:hexToRgb(c.hex||'#cccccc'); const {xyY,Lab}=rgbToXyLab(rgb[0],rgb[1],rgb[2]); return {...c,rgb,xy:[xyY.x,xyY.y],Lab};});
// }
// const ENRICHED=enrichColors(COLORS);

function enrichColors(cols){
  return cols.map(c=>{
    const rgb = c.rgb ? c.rgb : hexToRgb(c.hex || '#cccccc');
    const hex = c.hex || rgbToHex(rgb);
    const {xyY, Lab} = rgbToXyLab(rgb[0], rgb[1], rgb[2]);
    return {
      ...c,
      rgb,
      hex,
      xy:[xyY.x, xyY.y],
      Lab,
      finishNorm: normFinish(c.finish) // 'gloss' | 'satin' | 'metal' | 'unknown'
    };
  });
}
const ENRICHED = enrichColors(COLORS);

// Compare state
const compare={a:null,b:null};
function addToCompare(i){const c=ENRICHED[i]; if(!compare.a){compare.a=c}else if(!compare.b){compare.b=c}else{compare.a=c; compare.b=null} renderCompare();}
function renderCompare(){
  const a=document.getElementById('cmpA'), b=document.getElementById('cmpB'), al=document.getElementById('cmpALabel'), bl=document.getElementById('cmpBLabel'), dEl=document.getElementById('cmpDeltaE');
  if(a){ a.style.background = compare.a ? (compare.a.hex || `rgb(${compare.a.rgb.join(',')})`) : '#fff'; al.textContent = compare.a ? `${compare.a.name} (${compare.a.code})` : '—'; }
  if(b){ b.style.background = compare.b ? (compare.b.hex || `rgb(${compare.b.rgb.join(',')})`) : '#fff'; bl.textContent = compare.b ? `${compare.b.name} (${compare.b.code})` : '—'; }
  if(compare.a && compare.b){
    const dE = deltaE76(compare.a.Lab.L,compare.a.Lab.a,compare.a.Lab.b,compare.b.Lab.L,compare.b.Lab.a,compare.b.Lab.b);
    const verdict = (dE<=2) ? "very close (≤2)" : (dE<=5) ? "close (≤5)" : "visibly different (>5)";
    dEl.textContent = `ΔE*ab = ${dE.toFixed(2)} • ${verdict}`;
  }else{ dEl.textContent='ΔE*ab = —'; }
}

// function renderGrid(){
//   const grid=document.getElementById('grid'); if(!grid) return; grid.innerHTML='';
//   ENRICHED.forEach((c,i)=>{
//     const el=document.createElement('div'); el.className='swatch'; const bg=c.hex || `rgb(${c.rgb.join(',')})`;
//     const xy=`x=${c.xy[0].toFixed(4)}, y=${c.xy[1].toFixed(4)}`; const lab=`L*=${c.Lab.L.toFixed(1)}, a*=${c.Lab.a.toFixed(1)}, b*=${c.Lab.b.toFixed(1)}`;
//     const tinyId=`tiny_${i}`;
//     el.innerHTML=`<div class="chip" style="background:${bg}"></div>
//       <div class="meta">
//         <div class="name">${c.name}</div>
//         <div class="sku">${c.code} • <span class="badge">${c.hex ? c.hex.toUpperCase() : 'rgb('+c.rgb.join(', ')+')'}</span></div>
//         <div class="controls">
//           <button class="button ghost" aria-label="Add ${c.name} to compare" data-idx="${i}">Compare</button>
//           <button class="button" aria-label="Show info" onclick="document.getElementById('${tinyId}').classList.toggle('show')">ⓘ Info</button>
//         </div>
//         <div id="${tinyId}" class="tiny">xy: ${xy}<br>Lab: ${lab}</div>
//       </div>`;
//     el.querySelector('button[data-idx]').addEventListener('click',()=>addToCompare(i));
//     grid.appendChild(el);
//   });
// }
// function goBack(){ history.length>1 ? history.back() : location.href='source.html'; }
// document.addEventListener('DOMContentLoaded', ()=>{ if(document.getElementById('grid')) renderGrid(); setLighting('daylight'); for(const b of document.querySelectorAll('[data-light]')){ b.addEventListener('click', ()=> setLighting(b.dataset.light)); } renderCompare(); });
function renderGrid(){
  const grid = document.getElementById('grid');
  if(!grid) return;
  grid.innerHTML = '';

  // apply finish filter
  const list = ENRICHED.filter(c => currentFinish === 'all' ? true : (c.finishNorm === currentFinish));

  list.forEach((c,i)=>{
    const el = document.createElement('div');
    el.className='swatch';
    const bg = c.hex || `rgb(${c.rgb.join(',')})`;
    const xy = `x=${c.xy[0].toFixed(4)}, y=${c.xy[1].toFixed(4)}`;
    const lab = `L*=${c.Lab.L.toFixed(1)}, a*=${c.Lab.a.toFixed(1)}, b*=${c.Lab.b.toFixed(1)}`;
    const tinyId = `tiny_${c.name.replace(/\s+/g,'_')}_${i}`;

    el.innerHTML = `
      <div class="chip" style="background:${bg}"></div>
      <div class="meta">
        <div class="name">${c.name}</div>
        <div class="sku">${c.code ? c.code + ' • ' : ''}<span class="badge">${(c.hex || '').toUpperCase() || 'rgb('+c.rgb.join(', ')+')'}</span></div>
        <div class="badges"><span class="badge finish ${c.finishNorm}">${c.finishNorm}</span></div>
        <div class="controls">
          <button class="button ghost" aria-label="Add ${c.name} to compare" data-idx="${i}">Compare</button>
          <button class="button" aria-label="Show info" onclick="document.getElementById('${tinyId}').classList.toggle('show')">ⓘ Info</button>
        </div>
        <div id="${tinyId}" class="tiny">xy: ${xy}<br>Lab: ${lab}</div>
      </div>`;

    // IMPORTANT: since we're iterating a filtered list, map back to the original index
    el.querySelector('button[data-idx]').addEventListener('click',()=>{
      const originalIndex = ENRICHED.findIndex(x => x.name===c.name && x.code===c.code);
      addToCompare(originalIndex);
    });

    grid.appendChild(el);
  });
}
document.addEventListener('DOMContentLoaded', ()=>{
  if(document.getElementById('grid')) renderGrid();

  setLighting('daylight');
  document.querySelectorAll('[data-light]').forEach(b=>{
    b.addEventListener('click', ()=> setLighting(b.dataset.light));
  });

  // NEW: finish filter
  document.querySelectorAll('[data-finish]').forEach(b=>{
    b.addEventListener('click', ()=> setFinish(b.dataset.finish));
  });
  setFinish('all');

  renderCompare();
});
if(compare.a && compare.b){
  const dE = deltaE76(compare.a.Lab.L,compare.a.Lab.a,compare.a.Lab.b,
                      compare.b.Lab.L,compare.b.Lab.a,compare.b.Lab.b);
  const verdict = (dE<=2) ? "very close (≤2)" : (dE<=5) ? "close (≤5)" : "visibly different (>5)";
  const finishHint = (compare.a.finishNorm !== compare.b.finishNorm)
    ? " • Note: finishes differ; surface reflectance can change appearance. Consider a swatch."
    : "";
  dEl.textContent = `ΔE*ab = ${dE.toFixed(2)} • ${verdict}${finishHint}`;
} else {
  dEl.textContent='ΔE*ab = —';
}

