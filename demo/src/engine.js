/* Local teaching model. No network, storage, credentials, inference or production security boundary. */
(function (root) {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  const scenarios = [
    ['normal', 'Camino autorizado', 'SIM-001'],
    ['lost_ack', 'Respuesta perdida', 'SIM-002'],
    ['stale', 'Versión cambió', 'SIM-003'],
    ['expired', 'Aprobación vencida', 'SIM-004'],
    ['abstain', 'Evidencia insuficiente', 'SIM-005'],
    ['poison', 'Contrato inválido', 'SIM-006'],
    ['transient', 'Lectura transitoria', 'SIM-007'],
    ['injection', 'Instrucción en evidencia', 'SIM-008']
  ];
  class ControlLab {
    constructor() { this.reset(); }
    reset() {
      this.time = 0; this.paused = false; this.stopped = false; this.dependencyUp = true;
      this.concurrency = 3; this.reviewerEnabled = true; this.circuit = { state: 'CLOSED', failures: 0, until: 0 };
      this.workers = []; this.events = []; this.receipts = new Map();
      this.cases = scenarios.map(([scenario, label, id]) => ({ id, label, scenario,
        operationId: 'OP-' + id, resource: 'PAY-' + id, status: 'QUEUED', version: 1,
        observedVersion: null, business: scenario === 'abstain' ? 'DESCONOCIDO' : 'APLICADO',
        confirmation: 'PENDIENTE', debits: scenario === 'abstain' ? null : 1,
        attempts: 0, nextRead: 0, effects: 0, proposal: null, binding: null, approval: null,
        reason: 'En cola para lectura autorizada simulada.', repaired: false }));
      this.cases.forEach(c => this.event(c, 'ENQUEUED', c.reason));
      return this.snapshot();
    }
    get(id) { return this.cases.find(c => c.id === id); }
    event(c, type, detail, actor = 'dominio-simulado') {
      const event = { seq: this.events.length + 1, time: this.time, caseId: c?.id || null,
        operationId: c?.operationId || null, actor, type, detail };
      this.events.push(event); if (c) c.reason = detail;
    }
    reject(c, code, detail, terminal = false) {
      if (terminal && c) c.status = 'REJECTED';
      this.event(c, code, detail); return { ok: false, code, detail };
    }
    snapshot() {
      return copy({ schema: 'financial-ai-control-lab-v1', mode: 'local-simulation',
        syntheticData: true, modelInference: false, durableAudit: false,
        time: this.time, paused: this.paused, stopped: this.stopped, dependencyUp: this.dependencyUp,
        concurrency: this.concurrency, reviewerEnabled: this.reviewerEnabled, circuit: this.circuit, workers: this.workers,
        cases: this.cases, events: this.events,
        receipts: Array.from(this.receipts, ([operationId, receipt]) => ({ operationId, ...receipt })), metrics: {
          cases: this.cases.length, effects: this.cases.reduce((n, c) => n + c.effects, 0),
          newDebits: 0, unknown: this.cases.filter(c => c.status === 'UNKNOWN').length,
          receipts: this.receipts.size } });
    }
    setConcurrency(n) {
      if (![1, 3, 6].includes(n)) return this.reject(null, 'INVALID_CONCURRENCY', 'Elige 1, 3 o 6 lectores.');
      this.concurrency = n; this.event(null, 'CONCURRENCY_CHANGED', 'Límite de lectores: ' + n + '. El trabajo iniciado termina.'); return { ok: true };
    }
    setPaused(value) { this.paused = !!value; this.event(null, 'PAUSE_CHANGED', value ? 'Pausa de admisión; las lecturas iniciadas terminan.' : 'Admisión reanudada.'); }
    setStopped(value) { this.stopped = !!value; this.event(null, 'STOP_CHANGED', value ? 'Parada: bloquea nuevas aprobaciones y efectos; permite consultar.' : 'Parada retirada; las demás validaciones siguen vigentes.'); }
    setReviewerEnabled(value) { this.reviewerEnabled = !!value; this.event(null, 'REVIEWER_ROLE_CHANGED', value ? 'Rol de revisión restituido; no renueva aprobaciones.' : 'Rol de revisión revocado; se revalida antes del efecto.'); }
    setDependency(value) { this.dependencyUp = !!value; this.event(null, 'DEPENDENCY_CHANGED', value ? 'Dependencia recuperada; se conserva el cooldown del circuito.' : 'Dependencia no disponible.'); }
    tick(seconds = 1) {
      if (!Number.isSafeInteger(seconds) || seconds < 1 || seconds > 300) throw new RangeError('Use 1..300 logical seconds');
      for (let n = 0; n < seconds; n++) {
        this.time++;
        const finished = this.workers.filter(w => w.until <= this.time);
        this.workers = this.workers.filter(w => w.until > this.time);
        finished.forEach(w => this.finishRead(w));
        if (this.circuit.state === 'OPEN' && this.time >= this.circuit.until) {
          this.circuit.state = 'HALF_OPEN'; this.event(null, 'CIRCUIT_HALF_OPEN', 'Se admite una única sonda de lectura.');
        }
        this.cases.filter(c => c.status === 'APPROVED').forEach(c => {
          if (this.time >= c.approval.expiresAt) {
            c.status = 'EXPIRED'; this.event(c, 'APPROVAL_EXPIRED', 'Aprobación vencida; no se escribió.');
          } else if (!this.paused && !this.stopped && this.dependencyUp && this.circuit.state === 'CLOSED') this.execute(c.id);
        });
        this.schedule();
      }
      return this.snapshot();
    }
    schedule() {
      if (this.paused || this.circuit.state === 'OPEN') return;
      if (this.circuit.state === 'HALF_OPEN') {
        if (!this.workers.length) this.workers.push({ id: null, until: this.time + 2, probe: true });
        return;
      }
      while (this.workers.length < this.concurrency) {
        const c = this.cases.find(x => x.status === 'QUEUED' || (x.status === 'RETRY_WAIT' && this.time >= x.nextRead));
        if (!c) break;
        c.attempts++; c.status = 'READING';
        this.workers.push({ id: c.id, until: this.time + 2, probe: false });
        this.event(c, 'READ_STARTED', 'Lectura ' + c.attempts + '/3; aún no hay propuesta ni efecto.');
      }
    }
    dependencyResult(ok) {
      if (ok) { this.circuit = { state: 'CLOSED', failures: 0, until: 0 }; return; }
      this.circuit.failures++;
      if (this.circuit.failures >= 3 || this.circuit.state === 'HALF_OPEN') {
        this.circuit = { state: 'OPEN', failures: 3, until: this.time + 8 };
        this.event(null, 'CIRCUIT_OPEN', 'Circuito abierto por 8 segundos lógicos; no se inician escrituras.');
      }
    }
    finishRead(worker) {
      if (worker.probe) {
        this.dependencyResult(this.dependencyUp);
        this.event(null, this.dependencyUp ? 'PROBE_OK' : 'PROBE_FAILED', 'Sonda exclusivamente de lectura; no autoriza efectos.'); return;
      }
      const c = this.get(worker.id);
      const transient = c.scenario === 'transient' && c.attempts < 3;
      if (!this.dependencyUp || transient || (c.scenario === 'poison' && !c.repaired)) {
        if (!this.dependencyUp) this.dependencyResult(false);
        if (c.attempts >= 3) { c.status = 'QUARANTINED'; this.event(c, 'QUARANTINED', 'Tres lecturas fallidas. Requiere reparar y reingresar explícitamente.'); }
        else { c.status = 'RETRY_WAIT'; c.nextRead = this.time + 2 ** c.attempts; this.event(c, 'READ_RETRY', 'Reintento limitado de lectura en t=' + c.nextRead + '. Ningún reintento de escritura.'); }
        return;
      }
      // A successful in-flight read must not close a circuit opened by other reads.
      if (this.circuit.state === 'CLOSED') this.circuit.failures = 0;
      c.observedVersion = c.version;
      if (c.business !== 'APLICADO') { c.status = 'ABSTAINED'; this.event(c, 'ABSTAINED', 'No se pudo verificar pago aplicado. Se abstiene y solicita investigación.'); return; }
      c.proposal = { action: c.scenario === 'injection' ? 'REPEAT_DEBIT' : 'RECONCILE_CONFIRMATION',
        resource: c.resource, operationId: c.operationId, expectedVersion: c.version,
        evidence: { payment: 'APLICADO', confirmation: 'PENDIENTE', debits: 1, observedAt: this.time },
        maker: 'operador-1', maxNewDebits: 0, expiresAt: this.time + 120 };
      c.binding = JSON.stringify(c.proposal); c.status = 'REVIEW';
      this.event(c, 'PREDEFINED_PROPOSAL', c.scenario === 'injection'
        ? 'Evidencia hostil sintética induce propuesta REPEAT_DEBIT. El dominio la rechazará.'
        : 'Propuesta predefinida: conciliar confirmación. No se ejecutó inferencia de modelo.', 'asistente-simulado');
    }
    validate(c) {
      if (!c?.proposal) return ['NO_PROPOSAL', 'Falta una propuesta tipada.'];
      const p = c.proposal;
      if (p.action !== 'RECONCILE_CONFIRMATION') return ['ACTION_DENIED', 'Acción fuera de catálogo. Aprobar no permite repetir el débito.'];
      if (p.resource !== c.resource || p.operationId !== c.operationId || p.maxNewDebits !== 0) return ['SCOPE_DENIED', 'Recurso, operación o límites fuera del alcance autorizado.'];
      if (JSON.stringify(p) !== c.binding) return ['CONTENT_CHANGED', 'El contenido cambió: se requiere una nueva propuesta y revisión.'];
      if (this.stopped) return ['STOPPED', 'Parada de emergencia activa.'];
      if (!this.dependencyUp || this.circuit.state !== 'CLOSED') return ['DEPENDENCY_UNAVAILABLE', 'No se pueden verificar las precondiciones con la dependencia degradada.'];
      if (this.time >= p.expiresAt) return ['STALE_EVIDENCE', 'La evidencia/propuesta venció; no se renueva con una aprobación.'];
      if (p.expectedVersion !== c.version) return ['STALE_VERSION', 'El estado cambió desde el diagnóstico.'];
      if (c.business !== 'APLICADO' || c.confirmation !== 'PENDIENTE' || c.debits !== 1) return ['PRECONDITION_FAILED', 'El dominio no cumple las precondiciones.'];
      return null;
    }
    approve(id, actor = 'revisor-1') {
      const c = this.get(id);
      if (!c || c.status !== 'REVIEW') return this.reject(c, 'NOT_REVIEWABLE', 'El caso no está pendiente de revisión.');
      if (actor === c.proposal.maker) return this.reject(c, 'SELF_APPROVAL_DENIED', 'El solicitante no puede aprobar su propia propuesta.');
      if (actor !== 'revisor-1' || !this.reviewerEnabled) return this.reject(c, 'ROLE_DENIED', 'El rol simulado no puede aprobar esta acción.');
      const error = this.validate(c); if (error) return this.reject(c, ...error);
      c.approval = { actor, binding: c.binding, approvedAt: this.time,
        expiresAt: Math.min(c.proposal.expiresAt, this.time + (c.scenario === 'expired' ? 1 : 60)) };
      c.status = 'APPROVED'; this.event(c, 'APPROVED', 'Revisión independiente ligada al contenido, recurso, versión y vigencia. Aún sin efecto.', actor);
      return { ok: true };
    }
    execute(id) {
      const c = this.get(id);
      if (!c) return this.reject(null, 'NOT_FOUND', 'Caso inexistente.');
      const existing = this.receipts.get(c.operationId);
      if (existing) {
        if (JSON.stringify(c.proposal) !== existing.binding) return this.reject(c, 'IDEMPOTENCY_CONFLICT', 'La misma clave con contenido distinto no se puede ejecutar.');
        this.event(c, 'DUPLICATE_SUPPRESSED', 'Misma operación reconocida; cero efectos adicionales. UNKNOWN exige reconciliación.');
        return { ok: true, duplicate: true };
      }
      if (c.status !== 'APPROVED' || !c.approval) return this.reject(c, 'APPROVAL_REQUIRED', 'El dominio exige aprobación independiente vigente.');
      if (this.paused) return this.reject(c, 'PAUSED', 'La admisión de efectos está pausada.');
      if (this.time >= c.approval.expiresAt) { c.status = 'EXPIRED'; return this.reject(c, 'APPROVAL_EXPIRED', 'La aprobación venció.'); }
      if (c.scenario === 'stale' && !c.changed) { c.version++; c.changed = true; this.event(c, 'CONCURRENT_CHANGE', 'Otro proceso sintético cambió la versión después de aprobar.'); }
      if (!this.reviewerEnabled || c.approval.actor !== 'revisor-1' || c.approval.actor === c.proposal.maker) return this.reject(c, 'REVIEWER_AUTHORITY_REVOKED', 'El revisor ya no tiene autoridad independiente vigente.', true);
      const error = this.validate(c); if (error) return this.reject(c, ...error, true);
      if (c.approval.binding !== JSON.stringify(c.proposal)) return this.reject(c, 'APPROVAL_CONTENT_MISMATCH', 'Aprobación ligada a otro contenido.', true);
      // One synchronous in-memory transition illustrates domain atomicity; not a remote exactly-once guarantee.
      c.confirmation = 'CONFIRMADA'; c.version++; c.effects++;
      this.receipts.set(c.operationId, { binding: c.binding, resource: c.resource, version: c.version, status: 'COMMITTED' });
      this.event(c, 'EFFECT_APPLIED', 'Confirmación aplicada. Débito original conservado; cero débitos nuevos.');
      if (c.scenario === 'lost_ack') { c.status = 'UNKNOWN'; this.event(c, 'ACK_LOST', 'Resultado desconocido para el consumidor. Se bloquea la reejecución.'); }
      else this.verify(c);
      return { ok: true };
    }
    verify(c) {
      const receipt = this.receipts.get(c.operationId);
      if (!receipt || receipt.status !== 'COMMITTED' || receipt.binding !== JSON.stringify(c.proposal) || receipt.resource !== c.resource || receipt.version !== c.version
        || c.business !== 'APLICADO' || c.confirmation !== 'CONFIRMADA' || c.debits !== 1 || c.effects !== 1) {
        return this.reject(c, 'INCONCLUSIVE', 'La lectura y el recibo no acreditan la postcondición; se conserva el bloqueo.');
      }
      c.status = 'VERIFIED'; this.event(c, 'POSTCONDITION_VERIFIED', 'Recibo y lectura concordantes: confirmación aplicada una vez; un débito total.'); return { ok: true };
    }
    reconcile(id) {
      const c = this.get(id);
      if (!c || c.status !== 'UNKNOWN') return this.reject(c, 'NOT_UNKNOWN', 'Solo se reconcilian resultados desconocidos.');
      if (!this.dependencyUp || this.circuit.state !== 'CLOSED') return this.reject(c, 'DEPENDENCY_UNAVAILABLE', 'La lectura de reconciliación no está disponible.');
      this.event(c, 'RECONCILIATION_READ', 'Consulta de operación y postcondición. No reintenta escribir.'); return this.verify(c);
    }
    redrive(id) {
      const c = this.get(id);
      if (!c || c.status !== 'QUARANTINED') return this.reject(c, 'NOT_QUARANTINED', 'Solo se reingresan casos en cuarentena.');
      c.repaired = true; c.attempts = 0; c.status = 'QUEUED'; c.proposal = null; c.approval = null;
      this.event(c, 'REPAIRED_AND_REDRIVEN', 'Contrato sintético reparado. Misma clave; requiere diagnóstico y aprobación nuevos.'); return { ok: true };
    }
    changeVersion(id) {
      const c = this.get(id); if (!c) return { ok: false };
      c.version++; this.event(c, 'CONCURRENT_CHANGE', 'Versión modificada por otro proceso simulado.'); return { ok: true };
    }
    alterProposal(id) {
      const c = this.get(id); if (!c?.proposal) return { ok: false };
      c.proposal.evidence.observedAt++;
      this.event(c, 'PROPOSAL_ALTERED', 'Se alteró la evidencia de la propuesta para probar la vinculación de contenido.'); return { ok: true };
    }
  }
  root.ControlLab = ControlLab;
  if (typeof module !== 'undefined' && module.exports) module.exports = { ControlLab };
})(globalThis);
