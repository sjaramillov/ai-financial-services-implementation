'use strict';

const steps = [
  ['La frontera es una decisión de diseño', 'El modelo trabaja con información y propone. La autoridad vive en servicios que validan cada petición. La línea separa ambas responsabilidades y permite revisar dónde podría aparecer un bypass.', '¿Puede el modelo producir un efecto sin pasar por el control de dominio?'],
  ['Una propuesta, todavía no confiable', 'El contexto se recupera con permisos. La propuesta identifica acción, recurso, argumentos, evidencia y versión esperada. Un contrato válido permite procesarla; todavía no autoriza su ejecución.', '¿Un documento hostil puede cambiar el catálogo de acciones o el alcance permitido?'],
  ['Una sola ruta gobernada', 'Las herramientas tienen funciones concretas, argumentos validados y permisos mínimos por destino. Las credenciales y la autorización se resuelven fuera del modelo.', '¿Existe una herramienta genérica o una credencial que permita saltar esta ruta?'],
  ['Identidad y política en cada efecto', 'El servicio valida actor, identidad del workload, tarea, recurso y estado vigente. Revisa el permiso otra vez inmediatamente antes del efecto, incluso después de una aprobación.', '¿Qué ocurre si se revoca un permiso o cambia la versión entre aprobar y ejecutar?'],
  ['Aprobar no elimina las reglas', 'La revisión humana se liga al contenido exacto, el recurso, la política y una caducidad. El aprobador tiene autoridad independiente. Una propuesta modificada exige una nueva revisión.', '¿Una aprobación anterior podría utilizarse para otra operación o después de vencer?'],
  ['Comprobar la postcondición', 'La respuesta de una llamada no basta para acreditar el resultado. El recibo y una lectura autorizada deben concordar. Un resultado desconocido exige conciliación antes de cualquier reenvío.', '¿Podemos recuperar el resultado por la misma operación sin repetir el efecto?'],
  ['Evidencia que permita reconstruir', 'Correlacionar actor, propuesta, aprobación, operación y resultado observable. Definir minimización, acceso, integridad y retención. La descarga de la demo incluye eventos y recibos sintéticos, modificables.', '¿Un tercero puede explicar por qué se permitió o denegó la acción y qué ocurrió?']
];
const layerNotes = {
  readonly: 'Sólo lectura: mantiene identidad, autorización y auditoría. Leer también puede exponer información.',
  durable: 'Recuperación: estado persistente, clave estable y reintentos acotados. Una cola no garantiza un único efecto remoto.',
  kill: 'Parada: bloquea efectos nuevos. Los que ya fueron enviados todavía requieren conciliación.',
  metrics: 'Medición: permisos erróneos, duplicados, abstención, latencia y costo. Los umbrales se acuerdan para cada caso.'
};
let current = 1, fullView = true, activeLayer = null;
const $ = id => document.getElementById(id);

function render(announce = true) {
  const index = String(current).padStart(2, '0') + ' / 07';
  $('counter').textContent = index;
  $('step-index').textContent = index;
  ['step-title', 'step-copy', 'step-question'].forEach((id, i) => { $(id).textContent = steps[current - 1][i]; });
  $('previous').disabled = current === 1;
  $('next').disabled = current === steps.length;
  $('show-all').setAttribute('aria-pressed', String(fullView));
  $('show-all').textContent = fullView ? 'Vista completa' : 'Vista progresiva';
  document.querySelectorAll('[data-go-step]').forEach(button => {
    if (Number(button.dataset.goStep) === current) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
  document.querySelectorAll('.diagram [data-step]').forEach(group => {
    const visible = fullView || Number(group.dataset.step) <= current;
    group.classList.toggle('is-visible', visible);
    group.classList.toggle('is-current', Number(group.dataset.step) === current);
    group.setAttribute('aria-hidden', String(!visible));
  });
  document.querySelectorAll('[data-layer]').forEach(button => {
    const selected = button.dataset.layer === activeLayer;
    button.setAttribute('aria-pressed', String(selected));
    const overlay = $('overlay-' + button.dataset.layer);
    overlay.toggleAttribute('hidden', !selected);
    overlay.setAttribute('aria-hidden', String(!selected));
  });
  $('layer-note').textContent = activeLayer ? layerNotes[activeLayer] : 'Selecciona una capa para ubicar su control en el mapa.';
  if (announce) $('step-announcement').textContent = `Paso ${current} de 7. ${steps[current - 1][0]}.`;
}
function selectStep(step) { current = Math.max(1, Math.min(steps.length, step)); render(); }
$('previous').addEventListener('click', () => selectStep(current - 1));
$('next').addEventListener('click', () => selectStep(current + 1));
$('restart').addEventListener('click', () => { current = 1; fullView = false; activeLayer = null; render(); });
$('show-all').addEventListener('click', () => { fullView = !fullView; if (!fullView) activeLayer = null; render(); });
$('present').addEventListener('click', () => {
  const on = document.body.classList.toggle('presenting');
  $('present').setAttribute('aria-pressed', String(on));
  $('present').textContent = on ? 'Salir de presentación' : 'Presentar';
});
$('print').addEventListener('click', () => window.print());
document.querySelectorAll('[data-go-step]').forEach(button => button.addEventListener('click', () => selectStep(Number(button.dataset.goStep))));
document.querySelectorAll('[data-layer]').forEach(button => button.addEventListener('click', () => {
  activeLayer = activeLayer === button.dataset.layer ? null : button.dataset.layer;
  if (activeLayer) fullView = true;
  render();
}));
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.target.closest('button,a,input,textarea,select,summary,.diagram-scroll,[contenteditable="true"]')) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); selectStep(current + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); selectStep(current - 1); }
  if (event.key === 'Home') { event.preventDefault(); selectStep(1); }
  if (event.key === 'End') { event.preventDefault(); fullView = true; selectStep(7); }
});
render(false);
