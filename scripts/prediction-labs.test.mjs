import assert from 'node:assert/strict';
import {test} from 'node:test';
import {webPredictions} from '../labs-late-web.js';
import {clientPredictions} from '../labs-late-client.js';
import {cloudPredictions} from '../labs-late-cloud.js';

const labs = [...webPredictions, ...clientPredictions, ...cloudPredictions];
const byId = new Map(labs.map(lab => [lab.id, lab]));

// Each row names the two values a learner selects and the expected answer ID.
// The expected results are independent of the order of options in the UI.
const expectations = {
  'ajax-response-order': {
    keys: ['firstDuration', 'callback'],
    cases: [
      ['70', 'all', 'bread'],
      ['70', 'matching', 'bread'],
      ['180', 'all', 'noodle'],
      ['180', 'matching', 'bread']
    ]
  },
  'servers-virtual-host': {
    keys: ['host', 'path'],
    cases: [
      ['cafe.example', '/menu.txt', 'coffee'],
      ['cafe.example', '/special.txt', 'missing'],
      ['tea.example', '/menu.txt', 'tea'],
      ['tea.example', '/special.txt', 'special']
    ]
  },
  'performance-cache-validation': {
    keys: ['age', 'origin'],
    cases: [
      ['59', 'v1', 'local'],
      ['59', 'v2', 'local'],
      ['60', 'v1', 'validated'],
      ['60', 'v2', 'download'],
      ['90', 'v1', 'validated'],
      ['90', 'v2', 'download']
    ]
  },
  'highperformance-critical-path': {
    keys: ['discovery', 'imageDuration'],
    cases: [
      ['html', '80', '120'],
      ['html', '180', '180'],
      ['css', '80', '200'],
      ['css', '180', '300']
    ]
  },
  'android-activity-return': {
    keys: ['background', 'draft'],
    cases: [
      ['resident', 'field', 'restarted-seven'],
      ['resident', 'bundle', 'restarted-seven'],
      ['reclaimed', 'field', 'created-zero'],
      ['reclaimed', 'bundle', 'created-seven']
    ]
  },
  'ios-state-binding': {
    keys: ['connection', 'button'],
    cases: [
      ['copy', 'child', 'two-three'],
      ['copy', 'parent', 'three-two'],
      ['binding', 'child', 'three-three'],
      ['binding', 'parent', 'three-three']
    ]
  },
  'html5-storage-tabs': {
    keys: ['store', 'opening'],
    cases: [
      ['local', 'opener', 'aisle'],
      ['local', 'independent', 'aisle'],
      ['session', 'opener', 'window'],
      ['session', 'independent', 'missing']
    ]
  },
  'lambda-state-scope': {
    keys: ['storage', 'environment'],
    cases: [
      ['memory', 'new', 'missing'],
      ['memory', 'reused', 'confirmed'],
      ['database', 'new', 'confirmed'],
      ['database', 'reused', 'confirmed']
    ]
  },
  'functions-trigger-match': {
    keys: ['input', 'bucket'],
    cases: [
      ['http', 'menu', 'menu-query'],
      ['http', 'avatar', 'menu-query'],
      ['menu', 'menu', 'preview'],
      ['menu', 'avatar', 'neither'],
      ['avatar', 'menu', 'neither'],
      ['avatar', 'avatar', 'preview']
    ]
  },
  'intrusion-order-access': {
    keys: ['session', 'owner'],
    cases: [
      ['valid', 'lin', 'allow'],
      ['valid', 'zhou', 'deny'],
      ['expired', 'lin', 'login'],
      ['expired', 'zhou', 'login'],
      ['none', 'lin', 'login'],
      ['none', 'zhou', 'login']
    ]
  }
};

test('every prediction lab has a unique ID and a set of expected outcomes', () => {
  assert.equal(byId.size, labs.length);
  assert.deepEqual(new Set(byId.keys()), new Set(Object.keys(expectations)));
});

for (const [id, {keys, cases}] of Object.entries(expectations)) {
  test(id + ': every selectable combination has the expected answer and a trace', async () => {
    const lab = byId.get(id);
    assert.deepEqual(lab.controls.map(control => control.key).sort(), [...keys].sort());
    const choices = keys.map(key => lab.controls.find(control => control.key === key).options);
    const selectable = choices[0].flatMap(([first]) =>
      choices[1].map(([second]) => JSON.stringify([first, second]))
    ).sort();
    assert.deepEqual(cases.map(([first, second]) => JSON.stringify([first, second])).sort(), selectable);
    const reached = new Set();
    for (const [first, second, expected] of cases) {
      const conditions = Object.freeze({[keys[0]]: first, [keys[1]]: second});
      const {answer, rows} = await lab.observe(conditions);
      assert.equal(answer, expected, JSON.stringify(conditions));
      assert.ok(rows.length > 0);
      for (const row of rows) {
        assert.equal(row.length, 3, 'each observation needs a step, outcome, and reason');
        assert.ok(row.every(cell => typeof cell === 'string' && cell.trim().length > 0));
      }
      reached.add(answer);
    }
    assert.deepEqual([...reached].sort(), lab.answers.map(([answer]) => answer).sort());
  });
}

test('AJAX shows completion order even when the later callback may not write', async () => {
  const lab = byId.get('ajax-response-order');
  const {rows} = await lab.observe({firstDuration: '180', callback: 'matching'});
  assert.match(rows[0][0], /100 ms.*B/);
  assert.match(rows[1][0], /180 ms.*A/);
  assert.match(rows.at(-1)[1], /法棍/);
});

test('fresh cache can still display v1 after the origin changed; at expiry it sends the old ETag', async () => {
  const lab = byId.get('performance-cache-validation');
  const fresh = await lab.observe({age: '59', origin: 'v2'});
  assert.match(fresh.rows.at(-1)[1], /v1/);
  const expired = await lab.observe({age: '60', origin: 'v2'});
  assert.ok(expired.rows.some(([, value]) => value.includes('If-None-Match: "v1"')));
  assert.match(expired.rows.at(-1)[1], /200.*v2/);
});

test('Android may restore the same quantity through two different lifecycle paths', async () => {
  const lab = byId.get('android-activity-return');
  const resident = await lab.observe({background: 'resident', draft: 'bundle'});
  const recreated = await lab.observe({background: 'reclaimed', draft: 'bundle'});
  assert.ok(resident.rows.some(([, value]) => /onRestart.*onStart.*onResume/.test(value)));
  assert.ok(recreated.rows.some(([, value]) => /onCreate.*onStart.*onResume/.test(value)));
  assert.match(resident.rows.at(-1)[1], /7/);
  assert.match(recreated.rows.at(-1)[1], /7/);
});

test('the private-order model distinguishes a refused read from an expired session', async () => {
  const lab = byId.get('intrusion-order-access');
  const refused = await lab.observe({session: 'valid', owner: 'zhou'});
  const expired = await lab.observe({session: 'expired', owner: 'lin'});
  assert.match(refused.rows.at(-1)[1], /403/);
  assert.match(expired.rows.at(-1)[1], /401/);
});

test('AJAX waterfall tracks both requests in launch order regardless of the DOM write policy', async () => {
  const lab = byId.get('ajax-response-order');
  for (const firstDuration of ['70', '180']) {
    for (const callback of ['all', 'matching']) {
      const {timeline} = await lab.observe({firstDuration, callback});
      assert.deepEqual(timeline, [
        {label: '请求 A · 面', start: 0, end: Number(firstDuration)},
        {label: '请求 B · 面包', start: 40, end: 100}
      ]);
    }
  }
});

test('image discovery determines waterfall overlap and the last bar sets paint readiness', async () => {
  const lab = byId.get('highperformance-critical-path');
  const cases = [
    ['html', '80', 0, 80, '120'],
    ['html', '180', 0, 180, '180'],
    ['css', '80', 120, 200, '200'],
    ['css', '180', 120, 300, '300']
  ];
  for (const [discovery, imageDuration, start, end, expected] of cases) {
    const {timeline, answer} = await lab.observe({discovery, imageDuration});
    assert.deepEqual(timeline, [
      {label: '样式表', start: 0, end: 120},
      {label: '主图', start, end}
    ]);
    assert.equal(answer, expected);
    assert.equal(Math.max(...timeline.map(bar => bar.end)), Number(answer));
  }
});
