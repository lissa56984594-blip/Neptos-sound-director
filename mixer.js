/* MÓDULO MIXER */
NSD.register('mixer',()=>{
  const {state,$,renderMixer,stopAudio}=NSD;
  $('#pauseAll').onclick=()=>{state.active.forEach(x=>x.audio.pause());renderMixer();};
  $('#stopAll').onclick=()=>{[...state.active.keys()].forEach(stopAudio);};
  $('#expandMixer').onclick=()=>{const panel=$('#expandedMixer');panel.classList.toggle('show');$('#expandMixer').textContent=panel.classList.contains('show')?'⌄ Fechar mixer':'⌃ Mixer';};
  renderMixer();
});
