const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function resumeBanner(store){
  const last=store.lastReading();
  return last?`<aside class="resume-progress"><div><span class="resume-label">上次读到</span><strong>${esc(last.title)}</strong><small>打开后回到上次的阅读位置。</small></div><a href="${esc(last.route)}">继续阅读 →</a></aside>`:'';
}
export function showProgress(main,store,onImport){
  const marks=store.readMarks(),session=store.getQuiz();
  const answered = session ? `${session.index} / ${session.pool.length}` : '尚未开始';
  main.innerHTML = `
    <div class="breadcrumb"><a href="#/">课程目录</a><span>/</span>学习进度</div>
    <section class="progress-page">
      <h1>学习进度</h1>
      <p class="progress-storage-status" role="status" data-saved-label>${store.isAvailable() ? '学习记录已自动保存在此浏览器。' : '当前浏览器未允许保存。请导出备份，以便下次继续。'}</p>
      ${resumeBanner(store)}
      <dl class="progress-stats">
        <div><dt>已掌握</dt><dd>${marks.done.size} 页</dd></div>
        <div><dt>待复习</dt><dd>${marks.weak.size} 页</dd></div>
        <div><dt>本轮自测已作答</dt><dd>${answered}</dd></div>
      </dl>
      ${session ? `<p class="progress-quiz-link"><a href="#/quiz">${session.index < session.pool.length ? '继续本轮自测' : '查看本轮自测结果'} →</a></p>` : ''}
      <section class="progress-backup">
        <h2>备份与恢复</h2>
        <p>更换设备、浏览器或网址前，可导出标记、阅读位置和本轮自测的 JSON 备份。</p>
        <div class="progress-backup-actions">
          <button id="export-progress" class="primary">导出进度备份</button>
          <label class="progress-file-label" for="import-progress">导入备份<input id="import-progress" type="file" accept=".json,application/json"></label>
        </div>
        <p class="progress-storage-note">导入会合并记录，并保留仅存在于当前浏览器的标记。清除网站数据会移除本地进度。</p>
        <p id="progress-feedback" role="status" aria-live="polite"></p>
      </section>
    </section>`;
  main.querySelector('#export-progress').onclick=()=>{
    const blob=new Blob([JSON.stringify(store.exportData(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);
    const link=document.createElement('a');link.href=url;link.download=`csci571-progress-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    main.querySelector('#progress-feedback').textContent='已生成进度备份，请保留下载的 JSON 文件。';
  };
  main.querySelector('#import-progress').onchange=async event=>{
    const file=event.target.files?.[0];if(!file)return;
    const feedback=main.querySelector('#progress-feedback');
    try{
      if(file.size>1024*1024)throw new Error('备份文件过大，请选择本站导出的 JSON 备份。');
      const data=JSON.parse(await file.text());
      store.importData(data);onImport();
      if(!feedback.isConnected)return;
      showProgress(main,store,onImport);
      main.querySelector('#progress-feedback').textContent=store.isAvailable()?'进度已合并并保存。':'进度已在本页恢复，但浏览器未允许持久保存；请保留备份。';
    }catch(error){feedback.textContent=error instanceof SyntaxError?'无法解析 JSON；当前进度未修改。':error.message;event.target.value=''}
  };
}
