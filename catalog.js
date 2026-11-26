import {interpretationHref} from './interpretations.js?v=20261126-ux';
import {daysUntilExam} from './navigation.js?v=20261126-ux';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,
  char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));

function chapterRow(deck, mastered, index) {
  const page = deck.corePages?.[0] || 1;
  const share = deck.count ? Math.min(100, Math.round(mastered / deck.count * 100)) : 0;
  const pageLabel = deck.sourceMode === 'study' ? '逐页图解' : '逐页对照';
  const title = escapeHtml(deck.title);
  return `<li class="catalog-chapter">
    <span class="catalog-chapter-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
    <div class="catalog-chapter-copy">
      <a class="catalog-chapter-title" href="${interpretationHref(deck.id)}">${title}</a>
      <p>${escapeHtml(deck.description)}</p>
    </div>
    <div class="catalog-chapter-pages">
      ${mastered ? `<span class="catalog-page-mark" title="本机已掌握页数">已掌握 ${mastered} 页<span class="catalog-meter" aria-hidden="true"><i style="width:${share}%"></i></span></span>` : ''}
      <a class="catalog-page-link" href="#/deck/${encodeURIComponent(deck.id)}/${page}"
        aria-label="${title}，${pageLabel}，共 ${deck.count} 页">${pageLabel} <span>${deck.count} 页</span><i aria-hidden="true">›</i></a>
    </div>
  </li>`;
}

export function renderCatalog({decks, groups, last, done, totalPages}) {
  const visibleGroups = groups.filter(group => group.decks.length);
  const continuation = decks.find(deck => deck.id === 'ajax') || decks[0];
  const resume = last?.route?.startsWith('#/') ? last : null;
  const resumeRoute = resume?.route || interpretationHref(continuation?.id);
  const selectedDeck = resumeRoute.split('/')[2];
  const indexOfGroup = id => visibleGroups.findIndex(group => group.decks.some(deck => deck.id === id));
  const currentGroup = indexOfGroup(selectedDeck);
  const selected = currentGroup >= 0 ? currentGroup : Math.max(0, indexOfGroup(continuation?.id));

  const marked = new Map();
  for (const key of done) {
    const deckId = key.split(':')[0];
    marked.set(deckId, (marked.get(deckId) || 0) + 1);
  }

  const tabs = visibleGroups.map((group, index) => `<button type="button" role="tab"
    id="catalog-tab-${index}" aria-controls="catalog-panel-${index}"
    aria-selected="${index === selected}" tabindex="${index === selected ? '0' : '-1'}">
    ${escapeHtml(group.title)}</button>`).join('');
  const panels = visibleGroups.map((group, index) => `<section class="catalog-group" role="tabpanel"
    id="catalog-panel-${index}" aria-labelledby="catalog-tab-${index}" ${index === selected ? '' : 'hidden'}>
    <h3 class="catalog-print-heading">${escapeHtml(group.title)}</h3>
    <div class="catalog-group-head">
      <p>${escapeHtml(group.note)}</p><span>${group.decks.length} 份讲义</span>
    </div>
    <ul class="catalog-chapters">${group.decks.map((deck, i) => chapterRow(deck, marked.get(deck.id) || 0, i)).join('')}</ul>
  </section>`).join('');

  const days = daysUntilExam();
  const share = totalPages ? Math.min(100, done.size / totalPages * 100) : 0;
  const countdown = days > 0 ? `<span class="catalog-countdown"><b>${days}</b><small>天后考试</small></span>`
    : days === 0 ? '<span class="catalog-countdown is-today"><b>今天</b><small>考试</small></span>' : '';

  return `<article class="catalog">
    <header class="catalog-head">
      <div><p class="catalog-kicker">CSCI 571 · Web Technologies</p>
        <h1>期末复习目录</h1>
        <p>从串讲读起，再逐页对照课件、做自测和交互实验。</p></div>
      <div class="catalog-exam">${countdown}
        <div><time datetime="2026-12-03T17:00:00-08:00">12 月 3 日 17:00</time>
        <a href="${interpretationHref('syllabus')}">考试安排与范围 <i aria-hidden="true">›</i></a></div></div>
    </header>
    <div class="catalog-reading">
      <div class="catalog-reading-location">
        <span class="catalog-small-label">${resume ? '上次读到' : '接着 REST 往下读'}</span>
        <strong>${escapeHtml(resume?.title || continuation?.title || '课程串讲')}</strong>
      </div>
      <a class="catalog-primary" href="${escapeHtml(resumeRoute)}">${resume ? '继续阅读' : '开始阅读'} <i aria-hidden="true">›</i></a>
      <a href="#/progress" class="catalog-progress" aria-label="查看本机学习进度，已掌握 ${done.size} 页，共 ${totalPages} 页">
        <span class="catalog-small-label">本机已掌握</span>
        <span><b>${done.size}</b> / ${totalPages} 页 <i aria-hidden="true">›</i></span>
        <span class="catalog-meter" aria-hidden="true"><i style="width:${share.toFixed(1)}%"></i></span>
      </a>
    </div>
    <section class="catalog-directory" aria-labelledby="catalog-directory-title">
      <div class="catalog-directory-head"><h2 id="catalog-directory-title">课程讲义</h2>
        <details class="catalog-scope"><summary>复习范围</summary>
          <div>期末整理至 Web Intrusion（含）。按教师说明，发展历史可跳过，期中内容只需少量回顾。Syllabus 列出考试占总评 40%，未列出新旧内容的题量比例。</div>
        </details>
      </div>
      <div class="catalog-tabs" role="tablist" aria-label="选择讲义分组">${tabs}</div>
      ${panels}
    </section>
  </article>`;
}

export function bindCatalog(main) {
  const list = main.querySelector('.catalog-tabs');
  if (!list) return;
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  function select(tab) {
    for (const item of tabs) {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      main.querySelector('#' + item.getAttribute('aria-controls')).hidden = !active;
    }
  }
  list.addEventListener('click', event => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) select(tab);
  });
  list.addEventListener('keydown', event => {
    const current = tabs.indexOf(event.target);
    if (current < 0) return;
    let index = current;
    switch (event.key) {
      case 'ArrowRight': index = (current + 1) % tabs.length; break;
      case 'ArrowLeft': index = (current + tabs.length - 1) % tabs.length; break;
      case 'Home': index = 0; break;
      case 'End': index = tabs.length - 1; break;
      default: return;
    }
    event.preventDefault();
    select(tabs[index]);
    tabs[index].focus();
  });
}
