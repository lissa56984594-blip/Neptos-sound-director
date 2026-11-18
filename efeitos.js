/* MÓDULO EFEITOS SONOROS */
NSD.register('efeitos',()=>{
  const {state,$,esc,saveAudio,deleteAudio,playAudio,updateHome}=NSD;
  const root=$('#effectsList'),input=$('#effectFiles');
  async function importFiles(files){for(const file of [...files]){const item={id:NSD.id(),name:file.name.replace(/\.[^.]+$/,''),fileName:file.name,type:'effect',blob:file,added:Date.now()};await saveAudio(item);state.effects.push(item);}render();}
  function render(){updateHome();root.innerHTML='';if(!state.effects.length){root.innerHTML='<div class="empty">Nenhum efeito importado ainda. Importe seus sons para deixá-los prontos durante a sessão.</div>';return;}state.effects.forEach(effect=>{const row=document.createElement('div');row.className='item';row.innerHTML=`<div class="info"><strong>${esc(effect.name)}</strong><small>Efeito sonoro · ${esc(effect.fileName||'')}</small></div><button class="secondary" data-effect-play="${esc(effect.id)}">▶ Tocar</button><button class="secondary" data-effect-loop="${esc(effect.id)}">↻ Loop</button><button class="danger" data-effect-delete="${esc(effect.id)}">Excluir</button>`;root.append(row);});}
  input.onchange=async e=>{try{await importFiles(e.target.files);}catch(err){alert('Não foi possível importar o efeito: '+err.message);}input.value='';};
  root.addEventListener('click',async e=>{const play=e.target.closest('[data-effect-play]');if(play){playAudio(play.dataset.effectPlay);return;}const loop=e.target.closest('[data-effect-loop]');if(loop){playAudio(loop.dataset.effectLoop,true);return;}const del=e.target.closest('[data-effect-delete]');if(del&&confirm('Excluir este efeito sonoro?')){await deleteAudio(del.dataset.effectDelete);state.effects=state.effects.filter(a=>a.id!==del.dataset.effectDelete);render();}});
  render();NSD.efeitos={render,refresh:render};
});
