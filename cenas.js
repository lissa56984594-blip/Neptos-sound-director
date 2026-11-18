/* MÓDULO CENAS · sessões, cenas e playlists */
NSD.register('cenas',()=>{
  const {state,$,esc,id,persist,updateHome,playAudio}=NSD;
  const sessionsRoot=$('#sessions'), detail=$('#sessionDetail');
  let expandedScenes=new Set(), pickerScene=null;
  const selected=()=>state.sessions.find(s=>s.id===state.currentSession);
  function renderSessions(){
    updateHome(); sessionsRoot.innerHTML=''; detail.innerHTML='';
    if(!state.sessions.length){sessionsRoot.innerHTML='<div class="empty">Você ainda não criou sessões.<br>Toque em “Nova sessão” para começar sua aventura.</div>';return;}
    state.sessions.forEach((session,index)=>{
      const card=document.createElement('article'); card.className='session-card';
      card.innerHTML=`<div class="session-mark">${String(index+1).padStart(2,'0')}</div><div class="session-copy"><span class="eyebrow">SESSÃO ${String(index+1).padStart(2,'0')}</span><h3>${esc(session.name)}</h3><p>${session.scenes.length} cena(s) · ${session.scenes.reduce((n,s)=>n+s.tracks.length,0)} faixa(s) vinculada(s)</p></div><div class="session-actions"><button class="primary" data-open-session="${esc(session.id)}">Abrir sessão →</button><button class="icon-action" title="Mais opções" data-session-menu="${esc(session.id)}">•••</button></div>`;
      sessionsRoot.append(card);
    });
  }
  function renderDetail(){
    const session=selected(); if(!session){renderSessions();return;}
    sessionsRoot.innerHTML='';
    detail.innerHTML=`<div class="session-detail-head"><button class="back-link" id="backSessions">← Todas as sessões</button><div class="detail-title"><div><span class="eyebrow">PREPARAÇÃO DA AVENTURA</span><h2>${esc(session.name)}</h2><p class="sub">Cada cena pode ter sua própria sequência de músicas. As faixas continuam guardadas na Biblioteca.</p></div><div class="actions"><button class="secondary" id="renameSession">Renomear sessão</button><button class="primary" id="addScene">＋ Criar nova cena</button></div></div></div><div class="scene-list" id="sceneList"></div>`;
    $('#backSessions').onclick=()=>{state.currentSession=null;renderSessions();};
    $('#renameSession').onclick=()=>{const value=prompt('Nome da sessão:',session.name);if(value?.trim()){session.name=value.trim();persist();renderDetail();}};
    $('#addScene').onclick=()=>{const value=prompt('Nome da nova cena:');if(value?.trim()){const scene={id:id(),name:value.trim(),tracks:[]};session.scenes.push(scene);expandedScenes.add(scene.id);persist();renderDetail();}};
    const root=$('#sceneList');
    if(!session.scenes.length){root.innerHTML='<div class="empty scene-empty">Sua sessão ainda não tem cenas.<br>Crie a primeira cena para começar a montar a trilha sonora.</div>';return;}
    session.scenes.forEach((scene,index)=>{
      const open=expandedScenes.has(scene.id) || expandedScenes.size===0;
      const card=document.createElement('article'); card.className='scene-card'+(open?' is-open':'');
      card.innerHTML=`<button class="scene-toggle" data-toggle-scene="${esc(scene.id)}" aria-expanded="${open}"><span class="scene-number">${String(index+1).padStart(2,'0')}</span><span class="scene-heading"><strong>${esc(scene.name)}</strong><small>${scene.tracks.length} música(s) nesta cena</small></span><span class="scene-chevron">${open?'⌃':'⌄'}</span></button><div class="scene-body" ${open?'':'hidden'}><div class="playlist-label"><span>♫ TRILHA SONORA DA CENA</span><span>${scene.tracks.length} faixa(s)</span></div><div class="scene-tracks" data-track-list="${esc(scene.id)}"></div><div class="scene-picker" data-picker="${esc(scene.id)}" hidden></div><div class="scene-footer"><button class="primary add-library-track" data-show-picker="${esc(scene.id)}">＋ Adicionar música da biblioteca</button><div class="scene-tools"><button class="secondary" data-rename-scene="${esc(scene.id)}">Renomear</button><button class="danger" data-delete-scene="${esc(scene.id)}">Excluir cena</button></div></div></div>`;
      root.append(card);
      const trackRoot=card.querySelector('[data-track-list]');
      if(!scene.tracks.length) trackRoot.innerHTML='<div class="playlist-empty">Nenhuma música adicionada ainda. Use o botão abaixo para escolher faixas da Biblioteca.</div>';
      scene.tracks.forEach((trackId,trackIndex)=>{
        const track=state.library.find(item=>item.id===trackId); if(!track)return;
        const line=document.createElement('div'); line.className='scene-track';
        line.innerHTML=`<span class="track-icon">♫</span><span class="track-meta"><strong>${esc(track.name)}</strong><small>Faixa da biblioteca · ${esc(track.fileName||'Áudio importado')}</small></span><button class="track-play" data-play-track="${esc(track.id)}" aria-label="Tocar ${esc(track.name)}">▶</button><div class="track-order"><button data-move-up="${trackIndex}" data-scene="${esc(scene.id)}" ${trackIndex===0?'disabled':''}>↑</button><button data-move-down="${trackIndex}" data-scene="${esc(scene.id)}" ${trackIndex===scene.tracks.length-1?'disabled':''}>↓</button></div><button class="track-remove" data-remove-track="${trackIndex}" data-scene="${esc(scene.id)}" title="Remover da cena">×</button>`;
        trackRoot.append(line);
      });
    });
  }
  function showPicker(sceneId){
    const scene=selected()?.scenes.find(s=>s.id===sceneId); if(!scene)return;
    const panel=$(`[data-picker="${CSS.escape(sceneId)}"]`); if(!panel)return;
    if(panel.hidden){
      pickerScene=sceneId;
      panel.hidden=false;
      if(!state.library.length){panel.innerHTML='<div class="picker-empty">Sua Biblioteca ainda está vazia. Importe músicas na aba Biblioteca e volte aqui.</div>';return;}
      panel.innerHTML=`<div class="picker-head"><strong>Escolher da Biblioteca</strong><button class="picker-close" data-close-picker="${esc(sceneId)}">Fechar ×</button></div><input class="picker-search" type="search" placeholder="Buscar música pelo nome..."><div class="picker-results"></div><p class="picker-footnote">Adicionar uma faixa à cena não remove nem duplica o arquivo original da Biblioteca.</p>`;
      const search=panel.querySelector('input'); const results=panel.querySelector('.picker-results');
      const paint=()=>{const q=search.value.trim().toLowerCase();const matches=state.library.filter(a=>a.name.toLowerCase().includes(q));results.innerHTML='';if(!matches.length){results.innerHTML='<div class="picker-empty">Nenhuma música encontrada.</div>';return;}matches.forEach(track=>{const row=document.createElement('div');row.className='picker-track';row.innerHTML=`<span class="track-icon">♫</span><span><strong>${esc(track.name)}</strong><small>${esc(track.fileName||'')}</small></span><button class="secondary" data-pick-track="${esc(track.id)}" data-target-scene="${esc(sceneId)}">＋ Adicionar</button>`;results.append(row);});};
      search.oninput=paint; paint();
    } else {panel.hidden=true;pickerScene=null;}
  }
  $('#newSession').onclick=()=>{const value=prompt('Nome da nova sessão:');if(value?.trim()){const session={id:id(),name:value.trim(),scenes:[]};state.sessions.push(session);state.currentSession=session.id;persist();renderDetail();renderSessions();}};
  sessionsRoot.addEventListener('click',e=>{
    const open=e.target.closest('[data-open-session]'); if(open){state.currentSession=open.dataset.openSession;expandedScenes.clear();renderDetail();return;}
    const menu=e.target.closest('[data-session-menu]'); if(menu){const session=state.sessions.find(s=>s.id===menu.dataset.sessionMenu);if(!session)return;const choice=prompt('Digite: 1 para renomear, 2 para duplicar ou 3 para excluir.');if(choice==='1'){const n=prompt('Novo nome:',session.name);if(n?.trim())session.name=n.trim();}else if(choice==='2'){const copy=JSON.parse(JSON.stringify(session));copy.id=id();copy.name+=' (cópia)';copy.scenes=copy.scenes.map(sc=>({...sc,id:id()}));state.sessions.push(copy);}else if(choice==='3'&&confirm('Excluir esta sessão?'))state.sessions=state.sessions.filter(s=>s.id!==session.id);persist();renderSessions();}
  });
  detail.addEventListener('click',e=>{
    const toggle=e.target.closest('[data-toggle-scene]'); if(toggle){const sid=toggle.dataset.toggleScene;expandedScenes.has(sid)?expandedScenes.delete(sid):expandedScenes.add(sid);renderDetail();return;}
    const picker=e.target.closest('[data-show-picker]');if(picker){showPicker(picker.dataset.showPicker);return;}
    const close=e.target.closest('[data-close-picker]');if(close){const panel=$(`[data-picker="${CSS.escape(close.dataset.closePicker)}"]`);if(panel)panel.hidden=true;pickerScene=null;return;}
    const pick=e.target.closest('[data-pick-track]');if(pick){const scene=selected()?.scenes.find(s=>s.id===pick.dataset.targetScene);if(!scene)return;if(!scene.tracks.includes(pick.dataset.pickTrack))scene.tracks.push(pick.dataset.pickTrack);persist();expandedScenes.add(scene.id);renderDetail();showPicker(scene.id);return;}
    const play=e.target.closest('[data-play-track]');if(play){playAudio(play.dataset.playTrack);return;}
    const remove=e.target.closest('[data-remove-track]');if(remove){const scene=selected()?.scenes.find(s=>s.id===remove.dataset.scene);if(scene){scene.tracks.splice(Number(remove.dataset.removeTrack),1);persist();renderDetail();}return;}
    const up=e.target.closest('[data-move-up]'),down=e.target.closest('[data-move-down]');if(up||down){const btn=up||down,scene=selected()?.scenes.find(s=>s.id===btn.dataset.scene);if(!scene)return;const i=Number(btn.dataset.moveUp??btn.dataset.moveDown),j=i+(up?-1:1);if(j>=0&&j<scene.tracks.length){[scene.tracks[i],scene.tracks[j]]=[scene.tracks[j],scene.tracks[i]];persist();renderDetail();}return;}
    const rename=e.target.closest('[data-rename-scene]');if(rename){const scene=selected()?.scenes.find(s=>s.id===rename.dataset.renameScene);if(scene){const n=prompt('Nome da cena:',scene.name);if(n?.trim()){scene.name=n.trim();persist();renderDetail();}}return;}
    const del=e.target.closest('[data-delete-scene]');if(del){const session=selected();if(session&&confirm('Excluir esta cena e sua organização de músicas?')){session.scenes=session.scenes.filter(s=>s.id!==del.dataset.deleteScene);persist();renderDetail();}}
  });
  renderSessions();
  NSD.cenas={renderSessions,renderDetail,refresh:renderDetail};
});
