'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
// Run the exact browser source without relying on package.json module type.
const context = { module: { exports: {} } };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../demo/src/engine.js'), 'utf8'), context);
const { ControlLab } = context.module.exports;
const ready = () => { const lab = new ControlLab(); lab.tick(10); return lab; };
const state = (lab, id = 'SIM-001') => lab.snapshot().cases.find(c => c.id === id);

test('a proposal without independent approval cannot produce an effect', () => {
  const lab = ready(); assert.equal(state(lab).status, 'REVIEW');
  assert.equal(lab.execute('SIM-001').code, 'APPROVAL_REQUIRED');
  assert.equal(state(lab).effects, 0); assert.equal(lab.receipts.size, 0);
});
test('maker cannot approve and an unrelated role cannot impersonate checker', () => {
  const lab = ready();
  assert.equal(lab.approve('SIM-001', 'operador-1').code, 'SELF_APPROVAL_DENIED');
  assert.equal(lab.approve('SIM-001', 'asistente-simulado').code, 'ROLE_DENIED');
  assert.equal(state(lab).approval, null);
});
test('valid independent approval permits only confirmation and preserves original debit', () => {
  const lab = ready(); assert.equal(lab.approve('SIM-001').ok, true);
  assert.equal(state(lab).effects, 0); lab.tick();
  assert.equal(state(lab).status, 'VERIFIED'); assert.equal(state(lab).confirmation, 'CONFIRMADA');
  assert.equal(state(lab).effects, 1); assert.equal(state(lab).debits, 1);
  assert.equal(lab.snapshot().metrics.newDebits, 0);
});
test('approval cannot authorize an action induced by hostile evidence outside catalogue', () => {
  const lab = ready(); assert.equal(lab.approve('SIM-008').code, 'ACTION_DENIED');
  assert.equal(lab.execute('SIM-008').code, 'APPROVAL_REQUIRED'); assert.equal(state(lab, 'SIM-008').effects, 0);
});
test('stale version is rejected after approval, immediately before effect', () => {
  const lab = ready(); lab.approve('SIM-003'); lab.tick();
  assert.equal(state(lab, 'SIM-003').status, 'REJECTED'); assert.equal(state(lab, 'SIM-003').effects, 0);
  assert.ok(lab.events.some(e => e.type === 'STALE_VERSION'));
});
test('expiry at the exact boundary denies an effect', () => {
  const lab = ready(); lab.approve('SIM-004'); lab.tick();
  assert.equal(state(lab, 'SIM-004').status, 'EXPIRED'); assert.equal(state(lab, 'SIM-004').effects, 0);
});
test('approving old evidence does not renew it', () => {
  const lab = ready(); lab.tick(120);
  assert.equal(lab.approve('SIM-001').code, 'STALE_EVIDENCE'); assert.equal(state(lab).effects, 0);
});
test('altering evidence after approval invalidates the content binding', () => {
  const lab = ready(); lab.approve('SIM-001'); lab.alterProposal('SIM-001');
  assert.equal(lab.execute('SIM-001').code, 'CONTENT_CHANGED'); assert.equal(state(lab).effects, 0);
});
test('changing scope fails independently of the human approval', () => {
  const lab = ready(); lab.approve('SIM-001'); lab.get('SIM-001').proposal.resource = 'PAY-OTHER';
  assert.equal(lab.execute('SIM-001').code, 'SCOPE_DENIED'); assert.equal(state(lab).effects, 0);
});
test('duplicate execution conserves one receipt and one effect', () => {
  const lab = ready(); lab.approve('SIM-001'); lab.tick();
  for (let i = 0; i < 10; i++) assert.equal(lab.execute('SIM-001').duplicate, true);
  assert.equal(state(lab).effects, 1); assert.equal(lab.receipts.size, 1);
});
test('same idempotency key with different content is a conflict', () => {
  const lab = ready(); lab.approve('SIM-001'); lab.tick(); lab.alterProposal('SIM-001');
  assert.equal(lab.execute('SIM-001').code, 'IDEMPOTENCY_CONFLICT'); assert.equal(state(lab).effects, 1);
});
test('lost acknowledgement remains unknown after duplicate and resolves by read only', () => {
  const lab = ready(); lab.approve('SIM-002'); lab.tick();
  assert.equal(state(lab, 'SIM-002').status, 'UNKNOWN');
  lab.execute('SIM-002'); assert.equal(state(lab, 'SIM-002').status, 'UNKNOWN');
  assert.equal(lab.reconcile('SIM-002').ok, true);
  assert.equal(state(lab, 'SIM-002').status, 'VERIFIED'); assert.equal(state(lab, 'SIM-002').effects, 1);
});
test('missing receipt and mismatched postcondition cannot certify success', () => {
  for (const corrupt of [lab => lab.receipts.clear(), lab => { lab.get('SIM-002').debits = 2; }, lab => { lab.receipts.get('OP-SIM-002').status = 'PENDING'; }]) {
    const lab = ready(); lab.approve('SIM-002'); lab.tick(); corrupt(lab);
    assert.equal(lab.reconcile('SIM-002').code, 'INCONCLUSIVE'); assert.equal(state(lab, 'SIM-002').status, 'UNKNOWN');
  }
});
test('emergency stop blocks approvals and queued effects but permits reconciliation', () => {
  const lab = ready(); lab.approve('SIM-002'); lab.tick(); lab.approve('SIM-001'); lab.setStopped(true); lab.tick();
  assert.equal(state(lab).effects, 0); assert.equal(lab.approve('SIM-003').code, 'STOPPED');
  assert.equal(lab.reconcile('SIM-002').ok, true);
  lab.setStopped(false); lab.tick(); assert.equal(state(lab).effects, 1);
});
test('dependency degradation prevents effects and reconciliation; recovery does not bypass TTL', () => {
  const lab = ready(); lab.approve('SIM-002'); lab.tick(); lab.approve('SIM-001'); lab.setDependency(false); lab.tick(61);
  assert.equal(state(lab).effects, 0); assert.equal(state(lab).status, 'EXPIRED');
  assert.equal(lab.reconcile('SIM-002').code, 'DEPENDENCY_UNAVAILABLE');
  lab.setDependency(true); lab.tick(30); assert.equal(state(lab).effects, 0);
});
test('circuit admits at most one half-open read probe and recovers without writes', () => {
  const lab = new ControlLab(); lab.setDependency(false); lab.tick(3);
  assert.equal(lab.circuit.state, 'OPEN'); lab.tick(8);
  assert.equal(lab.circuit.state, 'HALF_OPEN');
  assert.equal(lab.workers.filter(w => w.probe).length, 1);
  lab.setDependency(true); lab.tick(2); assert.equal(lab.circuit.state, 'CLOSED');
  assert.equal(lab.snapshot().metrics.effects, 0);
});
test('uncertain evidence abstains; poison is bounded and explicit redrive requires new approval', () => {
  const lab = ready(); lab.tick(30);
  assert.equal(state(lab, 'SIM-005').status, 'ABSTAINED');
  assert.equal(state(lab, 'SIM-006').status, 'QUARANTINED'); assert.equal(state(lab, 'SIM-006').attempts, 3);
  assert.equal(state(lab, 'SIM-007').status, 'REVIEW'); assert.equal(state(lab, 'SIM-007').attempts, 3);
  lab.redrive('SIM-006'); lab.tick(3);
  assert.equal(state(lab, 'SIM-006').status, 'REVIEW'); assert.equal(state(lab, 'SIM-006').approval, null);
  assert.equal(state(lab, 'SIM-006').operationId, 'OP-SIM-006');
});
test('pausing drains admitted reads, preserves approval expiry and prevents new effects', () => {
  const lab = new ControlLab(); lab.tick(); lab.setPaused(true); lab.tick(2);
  assert.equal(state(lab).status, 'REVIEW'); assert.equal(lab.workers.length, 0);
  lab.approve('SIM-001'); lab.tick(60); assert.equal(state(lab).status, 'EXPIRED'); assert.equal(state(lab).effects, 0);
});
test('export is a detached snapshot and declares simulation limits', () => {
  const lab = ready(); const snapshot = lab.snapshot(); snapshot.cases[0].proposal.action = 'REPEAT_DEBIT';
  assert.equal(state(lab).proposal.action, 'RECONCILE_CONFIRMATION');
  assert.equal(snapshot.modelInference, false); assert.equal(snapshot.durableAudit, false);
  assert.equal(snapshot.syntheticData, true); assert.equal(snapshot.mode, 'local-simulation');
});
test('export preserves the domain receipt for a lost acknowledgement without certifying consumer success', () => {
  const lab = ready(); lab.approve('SIM-002'); lab.tick();
  const snapshot = lab.snapshot();
  const c = snapshot.cases.find(c => c.id === 'SIM-002');
  assert.equal(c.status, 'UNKNOWN');
  assert.equal(snapshot.receipts.length, snapshot.metrics.receipts);
  const receipt = snapshot.receipts.find(receipt => receipt.operationId === c.operationId);
  assert.equal(receipt.status, 'COMMITTED'); assert.equal(receipt.resource, c.resource);
  assert.equal(receipt.version, c.version); assert.equal(receipt.binding, JSON.stringify(c.proposal));
  // The downloaded teaching evidence must not become a mutable handle into the domain.
  receipt.status = 'PENDING'; snapshot.receipts.length = 0;
  assert.equal(lab.receipts.get(c.operationId).status, 'COMMITTED');
  assert.equal(lab.reconcile('SIM-002').ok, true);
  assert.equal(c.status, 'UNKNOWN'); // Earlier snapshots also remain unchanged after reconciliation.
  const reconciled = lab.snapshot();
  assert.equal(reconciled.receipts.length, 1); assert.equal(reconciled.metrics.effects, 1);
  lab.reset(); assert.equal(lab.snapshot().receipts.length, 0);
});
test('revoking reviewer role after approval is checked again before the effect', () => {
  const lab = ready(); lab.approve('SIM-001'); lab.setReviewerEnabled(false);
  assert.equal(lab.approve('SIM-003').code, 'ROLE_DENIED');
  assert.equal(lab.execute('SIM-001').code, 'REVIEWER_AUTHORITY_REVOKED');
  assert.equal(state(lab).effects, 0); assert.equal(state(lab).status, 'REJECTED');
});
