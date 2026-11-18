/* NEPTUS SOUND DIRECTOR · núcleo compartilhado */
(() => {
  const state = {
    db: null, sessions: [], library: [], effects: [], active: new Map(),
    currentSession: null, modules: [], ready: false
  };
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const makeId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const persist = () => localStorage.setItem('nsd_sessions', JSON.stringify(state.sessions));
  function loadMeta(){
    try {
      const saved = JSON.parse(localStorage.getItem('nsd_sessions') || '[]');
      state.sessions = Array.isArray(saved) ? saved.map(s => ({...s, scenes:Array.isArray(s.scenes)?s.scenes.map(sc=>({...sc,tracks:Array.isArray(sc.tracks)?sc.tracks:[]})):[]})) : [];
    } catch { state.sessions = []; }
  }
  function openDB(){
    return new Promise((resolve,reject)=>{
      const request = indexedDB.open('neptus-sound-director',1);
      request.onupgradeneeded = () => { if(!request.result.objectStoreNames.contains('audio')) request.result.createObjectStore('audio',{keyPath:'id'}); };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  function getAudios(){
    return new Promise((resolve,reject)=>{
      const request=state.db.transaction('audio').objectStore('audio').getAll();
      request.onsuccess=()=>resolve(request.result||[]); request.onerror=()=>reject(request.error);
    });
  }
  function saveAudio(item){
    return new Promise((resolve,reject)=>{
      const tx=state.db.transaction('audio','readwrite'); tx.objectStore('audio').put(item);
      tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error);
    });
  }
  function deleteAudio(id){
    return new Promise((resolve,reject)=>{
      const tx=state.db.transaction('audio','readwrite'); tx.objectStore('audio').delete(id);
      tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error);
    });
  }
  function updateHome(){
    const put=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
    put('homeSessions',state.sessions.length); put('homeMusic',state.library.length);
    put('homeEffects',state.effects.length); put('homeActive',state.active.size);
  }
  function page(name){
    $$('.page').forEach(p=>p.classList.toggle('active',p.id===name));
    $$('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===name));
    if(name==='inicio') updateHome();
  }
  function findAudio(id){return [...state.library,...state.effects].find(a=>a.id===id);}
  async function playAudio(id, loop=false){
    const item=findAudio(id); if(!item) return;
    const existing=state.active.get(id);
    if(existing){ if(existing.audio.paused) await existing.audio.play().catch(()=>{}); renderMixer(); return; }
    const url=URL.createObjectURL(item.blob), audio=new Audio(url);
    audio.loop=loop; audio.volume=.8;
    const entry={id,name:item.name,audio,loop,url}; state.active.set(id,entry);
    audio.onended=()=>{if(!audio.loop){state.active.delete(id);URL.revokeObjectURL(url);renderMixer();}};
    audio.onerror=()=>{state.active.delete(id);URL.revokeObjectURL(url);renderMixer();alert('Não foi possível reproduzir este arquivo.');};
    try { await audio.play(); } catch { state.active.delete(id);URL.revokeObjectURL(url);alert('O navegador não conseguiu iniciar o áudio. Toque novamente para tentar.'); }
    renderMixer();
  }
  function stopAudio(id){
    const entry=state.active.get(id); if(!entry)return;
    entry.audio.pause(); entry.audio.currentTime=0; state.active.delete(id);
    URL.revokeObjectURL(entry.url); renderMixer();
  }
  function renderMixer(){
    updateHome(); const root=$('#activeAudios'), expanded=$('#expandedMixer'), count=$('#activeCount');
    if(!root||!expanded||!count)return;
    count.textContent=state.active.size; root.innerHTML=''; expanded.innerHTML='';
    if(!state.active.size) root.innerHTML='<span class="sub">Nenhum áudio tocando.</span>';
    state.active.forEach(entry=>{
      const chip=document.createElement('div'); chip.className='audiochip';
      chip.innerHTML=`<button type="button" data-toggle="${esc(entry.id)}" aria-label="Pausar ou retomar">${entry.audio.paused?'▶':'Ⅱ'}</button><span class="chipname" title="${esc(entry.name)}">${esc(entry.name)}</span><input type="range" min="0" max="1" step=".01" value="${entry.audio.volume}" aria-label="Volume de ${esc(entry.name)}"><button type="button" data-stop="${esc(entry.id)}" aria-label="Parar">×</button>`;
      chip.querySelector('input').oninput=e=>{entry.audio.volume=Number(e.target.value);const other=expanded.querySelector(`[data-volume="${CSS.escape(entry.id)}"]`);if(other)other.value=e.target.value;};
      root.append(chip);
      const row=document.createElement('div'); row.className='mixrow';
      row.innerHTML=`<span>${esc(entry.name)}${entry.audio.paused?' · pausado':' · tocando'}</span><button class="danger" data-stop="${esc(entry.id)}">Parar</button><input data-volume="${esc(entry.id)}" type="range" min="0" max="1" step=".01" value="${entry.audio.volume}" aria-label="Volume de ${esc(entry.name)}">`;
      row.querySelector('input').oninput=e=>{entry.audio.volume=Number(e.target.value);const other=chip.querySelector('input');if(other)other.value=e.target.value;};
      expanded.append(row);
    });
    $$('[data-toggle]',root).forEach(b=>b.onclick=()=>{const a=state.active.get(b.dataset.toggle);if(!a)return;if(a.audio.paused)a.audio.play().catch(()=>{});else a.audio.pause();renderMixer();});
    $$('[data-stop]',root).concat($$('[data-stop]',expanded)).forEach(b=>b.onclick=()=>stopAudio(b.dataset.stop));
  }
  function register(name, init){state.modules.push({name,init});}
  function refresh(name){const mod=state.modules.find(m=>m.name===name);if(mod&&mod.refresh)mod.refresh();}
  document.addEventListener('click',e=>{
    const nav=e.target.closest('#nav button[data-page]'); if(nav)page(nav.dataset.page);
    const go=e.target.closest('[data-go]'); if(go)page(go.dataset.go);
  });
  document.addEventListener('DOMContentLoaded',async()=>{
    try {
      state.db=await openDB(); loadMeta();
      const all=await getAudios(); state.library=all.filter(x=>x.type==='music'); state.effects=all.filter(x=>x.type==='effect');
      state.modules.forEach(m=>{try{m.init();}catch(err){console.error('Módulo '+m.name,err);}});
      state.ready=true; updateHome(); renderMixer();
    } catch(error) { alert('Não foi possível iniciar o armazenamento local: '+error.message); }
  });
  window.NSD={state,$,$$,esc,id:makeId,persist,saveAudio,deleteAudio,updateHome,page,playAudio,stopAudio,renderMixer,findAudio,register};
})();
