const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function resumeBanner(store){
  const last=store.lastReading();
  return last?`<aside class="resume-progress"><div><span class="block-label">继续上次学习</span><strong>${esc(last.title)}</strong><small>已保存阅读位置，打开后自动恢复。</small></div><a href="${esc(last.route)}">继续阅读 →</a></aside>`:'';
}
export function showProgress(main,store,onImport){
  const marks=store.readMarks(),session=store.getQuiz();
  main.innerHTML=`<div class="breadcrumb"><a href="#/">课程目录</a><span>/</span>学习进度</div><span class="eyebrow">PICK UP WHERE YOU LEFT OFF</span><h1>学习进度</h1><p class="progress-storage-status" role="status" data-saved-label>${store.isAvailable()?'进度已自动保存到此浏览器。刷新或重新打开页面后会恢复。':'当前浏览器未允许保存。请先导出备份，避免关闭页面后丢失。'}</p><div class="progress-stats"><div><strong>${marks.done.size}</strong><span>已掌握</span></div><div><strong>${marks.weak.size}</strong><span>待复习</span></div><div><strong>${session?`${session.index} / ${session.pool.length}`:'—'}</strong><span>本轮自测已作答</span></div></div>${resumeBanner(store)}${session?`<p><a class="resume" href="#/quiz">${session.index<session.pool.length?'继续本轮自测':'查看本轮自测结果'} →</a></p>`:''}<section class="progress-backup"><h2>备份与恢复</h2><p>标记、逐页阅读位置、整体总结位置和本轮自测都会自动保存。导出一份备份，可在另一浏览器或另一网址继续学习。</p><div class="progress-backup-actions"><button id="export-progress" class="primary">导出进度备份</button><label class="progress-file-label" for="import-progress">从备份恢复<input id="import-progress" type="file" accept=".json,application/json"></label></div><p class="muted">导入会合并备份；没有出现在备份中的现有标记会保留。</p><p id="progress-feedback" role="status" aria-live="polite"></p></section><p class="progress-storage-note">进度保存在当前浏览器和网址中，不会上传。本地预览与 GitHub Pages、不同浏览器之间可通过备份迁移；清除网站数据也会清除本地进度。</p>`;
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
