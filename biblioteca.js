/* MÓDULO BIBLIOTECA — importação de músicas do dispositivo */
NSD.register('biblioteca', () => {
  const { state, $, esc, saveAudio, deleteAudio, playAudio, persist, updateHome } = NSD;
  const root = $('#musicList');
  const search = $('#musicSearch');
  const input = $('#musicFiles');
  const page = $('#biblioteca');
  const heading = page?.querySelector('.heading');
  const importLabel = page?.querySelector('label[for="musicFiles"]');

  if (importLabel) {
    importLabel.textContent = '♫ Selecionar músicas do celular';
    importLabel.setAttribute('aria-label', 'Selecionar arquivos de áudio do dispositivo');
  }
  if (input) {
    input.setAttribute('accept', 'audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.opus');
    input.setAttribute('multiple', '');
  }

  if (heading && !page.querySelector('.library-import-help')) {
    const help = document.createElement('div');
    help.className = 'library-import-help';
    help.innerHTML = `
      <strong>Adicione suas próprias trilhas</strong>
      <p>Escolha arquivos de áudio disponíveis no seu celular. Você pode procurar em Downloads, Música ou na pasta onde o Lark Player salvou o arquivo.</p>
      <small>Se um arquivo não aparecer, talvez esteja protegido ou guardado numa pasta privada do aplicativo.</small>`;
    heading.insertAdjacentElement('afterend', help);
  }

  if (!document.querySelector('#nsd-library-import-style')) {
    const style = document.createElement('style');
    style.id = 'nsd-library-import-style';
    style.textContent = `
      .library-import-help{margin:12px 0 18px;padding:16px 18px;border-radius:15px;background:linear-gradient(110deg,#102a48,#111637);border:1px solid #5fafe766;color:#f1f0ec}
      .library-import-help strong{display:block;font:500 17px Georgia,serif;margin-bottom:6px}
      .library-import-help p{margin:0 0 7px;color:#c1cbe0;font-size:13px;line-height:1.55}
      .library-import-help small{display:block;color:#9eaccb;font-size:11px;line-height:1.5}
      .page-library .heading label[for="musicFiles"]{display:inline-flex;align-items:center;justify-content:center;min-height:42px}
      @media(max-width:560px){.page-library .heading{align-items:flex-start;flex-direction:column}.page-library .heading label[for="musicFiles"]{width:100%}}`;
    document.head.append(style);
  }

  async function importFiles(files) {
    const selected = [...(files || [])].filter(file => file && file.size > 0);
    for (const file of selected) {
      const item = {id:NSD.id(),name:file.name.replace(/\.[^.]+$/,''),fileName:file.name,type:'music',blob:file,added:Date.now()};
      await saveAudio(item);
      state.library.push(item);
    }
    if (selected.length) render();
  }

  function render() {
    updateHome();
    if (!root || !search) return;
    const q = (search.value || '').toLowerCase().trim();
    const filtered = state.library.filter(audio =>
      (audio.name || '').toLowerCase().includes(q) || (audio.fileName || '').toLowerCase().includes(q));
    root.innerHTML = '';
    if (!filtered.length) {
      root.innerHTML = '<div class="empty">Nenhuma música encontrada. Selecione arquivos de áudio do seu dispositivo para começar.</div>';
      return;
    }
    filtered.forEach(track => {
      const row = document.createElement('div');
      row.className = 'item';
      row.innerHTML = `<div class="info"><strong>${esc(track.name)}</strong><small>${esc(track.fileName || 'Arquivo de áudio')}</small></div><button class="secondary" data-library-play="${esc(track.id)}">▶ Tocar</button><button class="danger" data-library-delete="${esc(track.id)}">Excluir</button>`;
      root.append(row);
    });
  }

  if (input) input.onchange = async event => {
    try { await importFiles(event.target.files); }
    catch (error) { alert('Não foi possível importar a música: ' + (error?.message || 'erro desconhecido')); }
    finally { input.value = ''; }
  };
  if (search) search.oninput = render;

  if (root) root.addEventListener('click', async event => {
    const play = event.target.closest('[data-library-play]');
    if (play) { playAudio(play.dataset.libraryPlay); return; }
    const del = event.target.closest('[data-library-delete]');
    if (del && confirm('Excluir esta música da Biblioteca? Ela também será retirada das cenas em que estiver vinculada.')) {
      const trackId = del.dataset.libraryDelete;
      await deleteAudio(trackId);
      state.library = state.library.filter(audio => audio.id !== trackId);
      state.sessions.forEach(session => session.scenes.forEach(scene => {
        scene.tracks = scene.tracks.filter(id => id !== trackId);
      }));
      persist();
      render();
      NSD.cenas?.renderDetail?.();
    }
  });

  render();
  NSD.biblioteca = {render, refresh:render};
});
