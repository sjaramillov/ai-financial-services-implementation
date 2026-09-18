'use strict';
const lab = new ControlLab();
const $ = id => document.getElementById(id);
let selected = 'SIM-001';
const labels = { QUEUED: 'En cola', READING: 'Leyendo', RETRY_WAIT: 'Espera reintento', REVIEW: 'Revisión', APPROVED: 'Aprobado', VERIFIED: 'Verificado', UNKNOWN: 'Desconocido', REJECTED: 'Rechazado', EXPIRED: 'Vencido', ABSTAINED: 'Abstención', QUARANTINED: 'Cuarentena' };
const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
function feedback(result, success = 'Cambio registrado en la simulación.') {
  $('feedback').textContent = result?.ok === false ? result.detail || result.code : success;
  $('feedback').classList.toggle('rejected', result?.ok === false);
}
function render() {
  const state = lab.snapshot(); const c = state.cases.find(x => x.id === selected);
  $('clock').textContent = `t = ${state.time} s`;
  $('workers').textContent = `${state.workers.length} / ${state.concurrency}`;
  $('circuit').textContent = { CLOSED: 'Cerrado', OPEN: `Abierto hasta t=${state.circuit.until}`, HALF_OPEN: 'Sonda única' }[state.circuit.state];
  $('effects').textContent = state.metrics.effects; $('debits').textContent = state.metrics.newDebits;
  $('system-note').textContent = state.stopped ? 'Parada activa: no hay aprobaciones ni efectos nuevos. Las consultas siguen disponibles si la dependencia lo permite.' : state.paused ? 'Admisión pausada. Las lecturas iniciadas pueden terminar; los efectos esperan y su aprobación puede vencer.' : !state.dependencyUp ? 'Dependencia degradada: los fallos abren el circuito. No se pueden verificar precondiciones para efectos.' : 'Los segundos son lógicos; no miden latencia ni capacidad real.';
  [['pause', state.paused, 'Reanudar admisión', 'Pausar admisión'], ['dependency', !state.dependencyUp, 'Restaurar dependencia', 'Degradar dependencia'], ['stop', state.stopped, 'Retirar parada', 'Activar parada']].forEach(([id, on, yes, no]) => { $(id).textContent = on ? yes : no; $(id).setAttribute('aria-pressed', String(on)); });
  $('reviewer-role').textContent = state.reviewerEnabled ? 'Revocar rol del revisor' : 'Restituir rol del revisor';
  $('reviewer-role').setAttribute('aria-pressed', String(!state.reviewerEnabled));
  $('concurrency').value = state.concurrency;
  $('case-rows').innerHTML = state.cases.map(x => `<tr class="${x.id === selected ? 'selected' : ''}"><td><button class="case-select" data-case="${escape(x.id)}" aria-pressed="${x.id === selected}" aria-label="Inspeccionar ${escape(x.id + ': ' + x.label)}"><strong>${escape(x.id)}</strong><span>${escape(x.label)}</span></button></td><td><span class="status status-${x.status}">${labels[x.status]}</span></td><td>${x.attempts}</td><td>${x.status === 'UNKNOWN' ? 'Por verificar' : x.effects}</td></tr>`).join('');
  $('case-title').textContent = `${c.id} · ${c.label}`; $('case-reason').textContent = c.reason;
  const facts = [['Estado', labels[c.status]], ['Operación', c.operationId], ['Recurso sintético', c.resource], ['Versión observada / actual', `${c.observedVersion ?? 'Sin leer'} / ${c.version}`], ['Confirmación visible', c.status === 'UNKNOWN' ? 'POR VERIFICAR' : c.confirmation], ['Débitos originales', c.observedVersion === null ? 'Sin leer' : c.debits ?? 'Desconocidos']];
  $('case-facts').innerHTML = facts.map(([key, value]) => `<div><dt>${escape(key)}</dt><dd>${escape(value)}</dd></div>`).join('');
  $('proposal-empty').hidden = !!c.proposal; $('proposal-detail').hidden = !c.proposal;
  $('proposal-json').textContent = JSON.stringify({ proposal: c.proposal, approval: c.approval ? { actor: c.approval.actor, approvedAt: c.approval.approvedAt, expiresAt: c.approval.expiresAt, boundToExactProposal: c.approval.binding === JSON.stringify(c.proposal) } : null }, null, 2);
  $('approve').disabled = c.status !== 'REVIEW'; $('reconcile').disabled = c.status !== 'UNKNOWN'; $('redrive').disabled = c.status !== 'QUARANTINED';
  $('self-approve').disabled = c.status !== 'REVIEW'; $('alter').disabled = !c.proposal;
  const events = state.events.filter(e => !$('only-selected').checked || e.caseId === selected).slice(-30).reverse();
  $('events').innerHTML = events.map(e => `<li><span class="event-time">#${e.seq} · t=${e.time}s</span><span class="event-code">${escape(e.type)}</span><span class="event-copy">${escape(e.detail)}<small>${escape(e.caseId || 'Control del ensayo')} · ${escape(e.actor)}</small></span></li>`).join('');
}
function run(fn, success) { const result = fn(); feedback(result, success); render(); }
$('case-rows').addEventListener('click', event => { const button = event.target.closest('[data-case]'); if (button) { selected = button.dataset.case; render(); document.querySelector(`[data-case="${selected}"]`).focus(); } });
$('tick-one').addEventListener('click', () => run(() => lab.tick(1), 'Reloj avanzado 1 segundo lógico. Inspecciona el estado y los eventos.'));
$('tick-ten').addEventListener('click', () => run(() => lab.tick(10), 'Reloj avanzado 10 segundos lógicos. Las revisiones humanas siguen pendientes.'));
$('tick-expiry').addEventListener('click', () => run(() => lab.tick(120), 'Reloj avanzado 120 segundos. Las propuestas y aprobaciones conservan su vencimiento original.'));
$('pause').addEventListener('click', () => run(() => lab.setPaused(!lab.paused)));
$('stop').addEventListener('click', () => run(() => lab.setStopped(!lab.stopped)));
$('dependency').addEventListener('click', () => run(() => lab.setDependency(!lab.dependencyUp)));
$('concurrency').addEventListener('change', () => run(() => lab.setConcurrency(Number($('concurrency').value))));
$('approve').addEventListener('click', () => run(() => lab.approve(selected), 'Aprobación registrada como revisor-1. Avanza 1 segundo para que el dominio revalide antes del efecto.'));
$('self-approve').addEventListener('click', () => run(() => lab.approve(selected, 'operador-1')));
$('execute').addEventListener('click', () => run(() => lab.execute(selected), 'Intento procesado. Consulta el estado y los eventos; un duplicado nunca resuelve por sí solo un resultado desconocido.'));
$('reconcile').addEventListener('click', () => run(() => lab.reconcile(selected), 'Reconciliación completada mediante recibo y lectura. No se escribió de nuevo.'));
$('redrive').addEventListener('click', () => run(() => lab.redrive(selected), 'Contrato sintético reparado y reingresado; requiere nuevo diagnóstico y revisión.'));
$('change-version').addEventListener('click', () => run(() => lab.changeVersion(selected)));
$('alter').addEventListener('click', () => run(() => lab.alterProposal(selected)));
$('reviewer-role').addEventListener('click', () => run(() => lab.setReviewerEnabled(!lab.reviewerEnabled), 'Permiso de revisión simulado actualizado para todo el ensayo.'));
$('only-selected').addEventListener('change', render);
$('reset').addEventListener('click', () => { selected = 'SIM-001'; run(() => lab.reset(), 'Ensayo reiniciado. Se borraron estados, recibos y eventos anteriores.'); });
$('export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(lab.snapshot(), null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url;
  link.download = 'financial-ai-synthetic-evidence.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  feedback(null, 'Evidencia sintética descargada. El archivo es modificable y no constituye un registro de auditoría productivo.');
});
render();
