/* MÓDULO CONFIGURAÇÕES E BACKUP */
NSD.register('config',()=>{
  const {state,$,persist}=NSD;
  $('#exportData').onclick=()=>{const data={version:1,sessions:state.sessions,exportedAt:new Date().toISOString()};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='neptus-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  $('#importData').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.sessions))throw new Error('Formato inválido');state.sessions=data.sessions.map(s=>({...s,scenes:Array.isArray(s.scenes)?s.scenes.map(sc=>({...sc,tracks:Array.isArray(sc.tracks)?sc.tracks:[]})):[]}));persist();NSD.cenas?.renderSessions?.();alert('Dados importados com sucesso!');}catch{alert('Esse arquivo não parece ser um backup válido.');}e.target.value='';};
});
