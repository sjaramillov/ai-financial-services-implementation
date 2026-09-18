'use strict';
const steps = [
  ['Identidad antes del contexto', 'El backend autentica al actor y limita las fuentes por recurso y propósito. Poder leer un documento no concede permiso para cambiar una operación.', '¿Podemos demostrar qué evidencia podía consultar este actor para este caso?'],
  ['La evidencia no da instrucciones', 'El modelo recibe contenido que puede ser erróneo u hostil. Una instrucción dentro de un documento no cambia el catálogo de herramientas ni las reglas del dominio.', '¿El sistema se abstiene cuando falta evidencia y rechaza instrucciones incrustadas?'],
  ['Una propuesta comprobable', 'La propuesta identifica una acción de catálogo, un recurso, evidencia y versión esperada. Validar el formato permite procesarla; su autorización todavía está pendiente.', '¿La propuesta conserva una clave estable y excluye secretos y argumentos arbitrarios?'],
  ['Revisión humana acotada', 'Una persona independiente revisa el contenido exacto. La aprobación no omite reglas, límites ni precondiciones; además vence y se invalida si cambia la propuesta.', '¿El solicitante puede aprobarse a sí mismo? ¿Una aprobación permite acciones fuera de catálogo?'],
  ['El dominio conserva la autoridad', 'Inmediatamente antes del efecto, el servicio verifica permisos, vigencia, estado actual, parada e idempotencia. Una aprobación previa no asegura que las condiciones sigan siendo válidas.', '¿Qué ocurre si el estado cambia entre aprobar y ejecutar?'],
  ['Verificar y reconciliar', 'Una respuesta HTTP o la ausencia de error no demuestra la postcondición. El recibo y una lectura autorizada deben concordar. Un resultado desconocido bloquea la reejecución.', '¿Podemos recuperar el resultado por la misma operación sin repetir el efecto?'],
  ['La evidencia explica la decisión', 'Correlacionar actor, propuesta, aprobación, operación y resultado. Definir minimización, acceso, integridad y retención. El registro descargable del ejercicio es local y modificable.', '¿Un tercero puede reconstruir por qué se permitió o denegó la acción?']
];
let current = 0, all = false;
const $ = id => document.getElementById(id);
function render() {
  $('counter').textContent = `Paso ${current + 1} de ${steps.length}`;
  $('step-index').textContent = `0${current + 1} / 07`;
  ['step-title', 'step-copy', 'step-question'].forEach((id, i) => { $(id).textContent = steps[current][i]; });
  $('progress').style.width = `${(current + 1) / steps.length * 100}%`;
  $('previous').disabled = current === 0; $('next').disabled = current === steps.length - 1;
  document.querySelectorAll('[data-step]').forEach(node => {
    const index = Number(node.dataset.step);
    node.classList.toggle('current', index === current);
    node.classList.toggle('pending', !all && index > current);
    node.setAttribute('aria-pressed', String(index === current));
  });
}
$('previous').addEventListener('click', () => { current = Math.max(0, current - 1); render(); });
$('next').addEventListener('click', () => { current = Math.min(6, current + 1); render(); });
$('show-all').addEventListener('click', () => { all = !all; $('show-all').setAttribute('aria-pressed', String(all)); render(); });
$('present').addEventListener('click', () => { const on = document.body.classList.toggle('presenting'); $('present').setAttribute('aria-pressed', String(on)); $('present').textContent = on ? 'Salir de presentación' : 'Presentar'; });
document.querySelectorAll('[data-step]').forEach(node => node.addEventListener('click', () => { current = Number(node.dataset.step); render(); }));
render();
