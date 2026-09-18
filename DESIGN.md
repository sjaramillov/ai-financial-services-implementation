# Diseño del tablero

## Escena y composición

Una revisión de arquitectura compartida en una sala iluminada necesita una superficie clara, alta legibilidad y un mapa completo desde la apertura. Papel cálido con cuadrícula discreta, tablero elevado y límites dibujados con tinta. El recorrido numerado y el panel de explicación acompañan al mapa.

## Tipografía

Bricolage Grotesque para títulos y tesis; Archivo para controles y etiquetas; Atkinson Hyperlegible para explicación y contenido del diagrama. Archivos WOFF2 locales con sus avisos SIL OFL. Mantener jerarquía óptica, frases breves y cuerpo de texto con anchura limitada.

## Color

Paleta de roles: papel `oklch(96.8% 0.012 83)`, superficie `oklch(99% 0.008 83)`, tinta `oklch(22% 0.022 252)`, azafrán `oklch(76% 0.145 88)` para frontera y selección, azul `oklch(45% 0.095 237)` para controles. El color representa función o estado, no decoración de tarjetas repetidas.

## Componentes

Cabecera compacta, navegación de siete pasos, lienzo SVG con flechas y una frontera horizontal de autoridad, explicación del paso y enlaces al laboratorio/arquitecturas. Vista completa por defecto; recorrido progresivo opcional. Presentación amplia el mapa y reduce información auxiliar. Las fichas de requisitos se revelan con controles nativos.

## Interacción

Hover y foco claros; movimiento limitado a cambios de estado. Controles de al menos 44 px, teclado anterior/siguiente/Home/End fuera de campos editables y botones enfocados. En móvil el mapa admite desplazamiento horizontal y el texto pasa debajo. No modificar el estilo de los visores generados Archify.
