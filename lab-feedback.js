// Each experiment reports observations from its own current execution.
export function report(root, title, rows = [], state = 'ready', key = 'main') {
  root.dispatchEvent(new CustomEvent('lab-result', {bubbles:true, detail:{title, rows, state, key}}));
}

export function pending(root, choice, key = 'main') {
  report(root, `${choice} · 尚未运行`, [
    ['当前选择', choice, '点击执行，下面会按这组选项重新解释结果。上一次运行的结论已清除。']
  ], 'pending', key);
}

export function invalid(root, message, key = 'main') {
  report(root, '当前输入无法执行', [['输入检查', message, '请先修正输入；这里没有沿用之前的结果。']], 'error', key);
}
