import {esc, options} from './labs-final-shared.js?v=20261020-labs';
import {webPredictions} from './labs-late-web.js?v=20261126';
import {clientPredictions} from './labs-late-client.js?v=20261126';
import {cloudPredictions} from './labs-late-cloud.js?v=20261126';

function comparison(previous, current, spec, labels) {
  const changes = [];
  for (const {key, label, options} of spec.controls) {
    if (previous.conditions[key] === current.conditions[key]) continue;
    const names = new Map(options);
    changes.push(`${label}由「${names.get(previous.conditions[key])}」改为「${names.get(current.conditions[key])}」`);
  }
  return `<h3>两次结果对照</h3><p>${esc(changes.join('。') || '两次运行的条件相同')}。</p>
    <dl><div><dt>上一次</dt><dd>${esc(labels.get(previous.answer))}</dd></div>
    <div><dt>这一次</dt><dd>${esc(labels.get(current.answer))}</dd></div></dl>`;
}

function renderTimeline(timeline) {
  if (!timeline) return '';
  const duration = Math.max(...timeline.map(item => item.end));
  return `<figure class="prediction-timeline"><figcaption>下载时间线 <small>从第一项开始计时</small></figcaption>
    ${timeline.map(({label, start, end}) => `<div class="timeline-lane">
      <span>${esc(label)}</span><div class="timeline-track" aria-hidden="true"><i style="margin-left:${100 * start / duration}%;width:${100 * (end - start) / duration}%"></i></div>
      <small>${start}–${end} ms</small></div>`).join('')}</figure>`;
}

function mountPrediction(root, spec) {
  const labels = new Map(spec.answers);
  root.innerHTML = `<form class="prediction-bench">
    <p class="prediction-setup">${esc(spec.setup)}</p>
    <div class="prediction-conditions">${spec.controls.map(control =>
      `<label><span>${esc(control.label)}</span><select data-condition="${esc(control.key)}">${options(control.options)}</select></label>`).join('')}</div>
    <fieldset class="prediction-choices"><legend>${esc(spec.predict)}</legend>
      ${spec.answers.map(([value, label]) => `<label><input type="radio" name="guess" value="${esc(value)}"><span>${esc(label)}</span></label>`).join('')}
    </fieldset>
    <div class="prediction-submit"><button type="submit" class="primary" data-run disabled>运行并核对</button><span data-hint role="status">先选一个预测。</span></div>
    <div data-outcome hidden></div><div class="prediction-comparison" data-comparison hidden></div>
  </form>`;
  const form = root.querySelector('form');
  const selects = [...form.querySelectorAll('[data-condition]')];
  const run = form.querySelector('[data-run]');
  const hint = form.querySelector('[data-hint]');
  const outcome = form.querySelector('[data-outcome]');
  const compare = form.querySelector('[data-comparison]');
  let lastRun;

  form.onchange = event => {
    if (event.target.matches('select')) {
      form.querySelectorAll('[name=guess]').forEach(choice => { choice.checked = false; });
      hint.textContent = lastRun ? '条件已改。重新预测后可对照两次结果。' : '按当前条件选一个预测。';
    } else {
      hint.textContent = '预测已选，可以运行。';
    }
    outcome.hidden = compare.hidden = true;
    run.disabled = !form.elements.guess.value;
  };

  form.onsubmit = event => {
    event.preventDefault();
    const guess = form.elements.guess.value;
    if (!guess || run.disabled) return;
    const conditions = Object.fromEntries(selects.map(select => [select.dataset.condition, select.value]));
    const {answer, rows, timeline} = spec.observe(conditions);
    const correct = guess === answer;
    const verdict = correct ? '预测正确' : '预测与结果不同';
    const current = {conditions, answer};
    outcome.innerHTML = `<section class="prediction-result" data-correct="${correct}">
      <h3><span aria-hidden="true">${correct ? '✓' : '≠'}</span>${verdict}</h3>
      <p>${correct ? '' : `你的预测是「${esc(labels.get(guess))}」。`}实际结果是<strong>「${esc(labels.get(answer))}」</strong>。</p>
      ${renderTimeline(timeline)}<ol class="prediction-trace" aria-label="推导过程">${rows.map(([step, result, reason]) =>
        `<li><small>${esc(step)}</small><strong>${esc(result)}</strong><p>${esc(reason)}</p></li>`).join('')}</ol>
    </section>`;
    outcome.hidden = false;
    if (lastRun) {
      compare.innerHTML = comparison(lastRun, current, spec, labels);
      compare.hidden = false;
    }
    hint.textContent = `${verdict}。可以改一个条件再试。`;
    lastRun = current;
    run.disabled = true;
  };
}

// Follow the order of the ten lectures in the course directory.
const lectureOrder = ['ajax', 'servers', 'performance', 'android', 'ios', 'highperformance', 'lambda', 'functions', 'html5', 'intrusion'];
const models = [...webPredictions, ...clientPredictions, ...cloudPredictions];
export const predictionLabs = lectureOrder.map(deck => {
  const spec = models.find(model => model.refs[0].deck === deck);
  return {...spec, mount: root => mountPrediction(root, spec)};
});
export const predictionByDeck = new Map(predictionLabs.map(lab => [lab.refs[0].deck, lab]));
