/* MÓDULO BIBLIOTECA */
NSD.register('biblioteca',()=>{
  const {state,$,esc,saveAudio,deleteAudio,playAudio,persist,updateHome}=NSD;
  const root=$('#musicList'), search=$('#musicSearch'), input=$('#musicFiles');
  async function importFiles(files){for(const file of [...files]){const item={id:NSD.id(),name:file.name.replace(/\.[^.]+$/,''),fileName:file.name,type:'music',blob:file,added:Date.now()};await saveAudio(item);state.library.push(item);}render();}
  function render(){updateHome();const q=(search.value||'').toLowerCase();const filtered=state.library.filter(a=>a.name.toLowerCase().includes(q));root.innerHTML='';if(!filtered.length){root.innerHTML='<div class="empty">Nenhuma música encontrada. Importe arquivos de áudio para começar.</div>';return;}filtered.forEach(track=>{const row=document.createElement('div');row.className='item';row.innerHTML=`<div class="info"><strong>${esc(track.name)}</strong><small>${esc(track.fileName||'Arquivo de áudio')}</small></div><button class="secondary" data-library-play="${esc(track.id)}">▶ Tocar</button><button class="danger" data-library-delete="${esc(track.id)}">Excluir</button>`;root.append(row);});}
  input.onchange=async e=>{try{await importFiles(e.target.files);}catch(err){alert('Não foi possível importar a música: '+err.message);}input.value='';};
  search.oninput=render;
  root.addEventListener('click',async e=>{const play=e.target.closest('[data-library-play]');if(play){playAudio(play.dataset.libraryPlay);return;}const del=e.target.closest('[data-library-delete]');if(del&&confirm('Excluir esta música da Biblioteca? Ela também será retirada das cenas em que estiver vinculada.')){await deleteAudio(del.dataset.libraryDelete);state.library=state.library.filter(a=>a.id!==del.dataset.libraryDelete);state.sessions.forEach(s=>s.scenes.forEach(sc=>sc.tracks=sc.tracks.filter(id=>id!==del.dataset.libraryDelete)));persist();render();NSD.cenas?.renderDetail?.();}});
  render(); NSD.biblioteca={render,refresh:render};
});
