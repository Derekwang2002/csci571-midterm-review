const mobile = window.matchMedia('(max-width: 840px)');

export function initNavigation() {
  const rail = document.querySelector('#navigation');
  const menu = document.querySelector('#menu');
  const shade = document.querySelector('#nav-shade');
  const closeButton = document.querySelector('#nav-close');
  const main = document.querySelector('#main');
  const bar = document.querySelector('.topbar');
  let collapsed = false;
  let drawer = false;
  try { collapsed = localStorage.getItem('571-ui-rail') === 'collapsed'; } catch {}

  function update() {
    const compact = mobile.matches;
    const visible = compact ? drawer : !collapsed;
    document.documentElement.classList.toggle('rail-collapsed', !compact && collapsed);
    document.documentElement.classList.toggle('drawer-open', compact && drawer);
    rail.inert = !visible;
    main.inert = bar.inert = compact && drawer;
    shade.hidden = !(compact && drawer);
    menu.setAttribute('aria-expanded', String(visible));
    const label = visible ? '收起目录' : '展开目录';
    menu.setAttribute('aria-label', label);
    menu.title = label;
    if (compact && drawer) {
      rail.setAttribute('role','dialog');
      rail.setAttribute('aria-modal','true');
    } else {
      rail.removeAttribute('role');
      rail.removeAttribute('aria-modal');
    }
  }
  function closeDrawer(focus = true) {
    if (!drawer) return;
    drawer = false;
    update();
    if (focus) menu.focus({preventScroll:true});
  }
  menu.addEventListener('click', () => {
    if (mobile.matches) {
      drawer = true;
      document.querySelector('#search-results').hidden = true;
      update();
      closeButton.focus();
    } else {
      collapsed = !collapsed;
      try { localStorage.setItem('571-ui-rail', collapsed ? 'collapsed' : 'expanded'); } catch {}
      update();
    }
  });
  shade.addEventListener('click', () => closeDrawer());
  closeButton.addEventListener('click', () => closeDrawer());
  rail.addEventListener('click', event => {
    if (drawer && event.target.closest('a[href], [data-scroll]')) {
      closeDrawer(false);
      main.focus({preventScroll:true});
    }
  });
  rail.addEventListener('keydown', event => {
    if (!drawer) return;
    if (event.key === 'Escape') { event.preventDefault(); closeDrawer(); }
    if (event.key !== 'Tab') return;
    const visible = [...rail.querySelectorAll('a[href],button:not([disabled]),select,summary')]
      .filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
    const first = visible[0], last = visible.at(-1);
    if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  });
  mobile.addEventListener('change', () => {
    const hadFocus = rail.contains(document.activeElement);
    drawer = false;
    update();
    if (hadFocus && rail.inert) menu.focus({preventScroll:true});
  });
  update();

  return function showLocation(path, decks) {
    closeDrawer(false);
    const [kind, id, page] = path;
    const names = {interpretations:'讲义串讲', deck:'逐页阅读', quiz:'自测练习', review:'重点与待复习', lab:'交互实验室', progress:'学习进度'};
    const parts = [[names[kind] || '课程目录', kind==='deck' ? '#/' : '#/'+(kind||'')]];
    const deck = decks.find(item => item.id===id);
    if (deck && (kind==='interpretations' || kind==='deck')) parts.push([deck.title,'#/interpretations/'+id]);
    if (kind==='deck' && page) parts.push(['P'+page]);
    if (kind==='lab' && id) parts.push(['实验详情']);
    const pathNav=document.querySelector('#location-path');
    pathNav.replaceChildren();
    for (const [i,[title,url]] of parts.entries()) {
      const item=document.createElement(i===parts.length-1?'span':'a');
      item.textContent=title;
      if (item.tagName==='A') item.href=url;
      else item.setAttribute('aria-current','page');
      pathNav.append(item);
    }
  };
}
