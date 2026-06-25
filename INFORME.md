# Informe técnico — Bitácora de desarrollo asistido por IA

Proyecto: **Sistema de gestión de turnos para peluquería**
TP integrador — Desarrollo ágil asistido por IA

---

## 1. Arsenal de herramientas de IA

El desarrollo se apoyó en dos modelos de lenguaje con roles diferenciados:

- **ChatGPT** — utilizado para **diseñar y redactar los prompts** que guiaron cada
  fase del trabajo. En lugar de improvisar instrucciones, se elaboraron prompts
  estructurados para cada etapa: análisis y arquitectura inicial, implementación
  guiada, reencuadre/control de rumbo, auditoría técnica y cierre/documentación.
- **Claude** — utilizado para **ejecutar esos prompts**: análisis del enunciado,
  diseño de la arquitectura, generación e integración del código, depuración,
  auditoría técnica y redacción de la documentación final.

Este esquema separó la *planificación de la conversación* (ChatGPT) de la
*ejecución técnica* (Claude), de forma análoga a separar el "qué pedir" del
"cómo construirlo".

Herramientas de soporte: Docker / Docker Compose para reproducibilidad del
entorno, y GitHub para alojar el repositorio y ejecutar la integración continua.

---

## 2. Sinergia con la IA

### Flujo de trabajo

El proyecto se construyó por **fases incrementales**, cada una iniciada con un
prompt previamente diseñado:

1. **Fase 1 — Análisis y arquitectura.** Se cruzó el enunciado del TP con los
   requisitos del proyecto, se detectaron ambigüedades y se definió una
   arquitectura simple (FastAPI + PostgreSQL + React + n8n + Docker) sin
   sobreingeniería. Se cerraron decisiones de stack mediante preguntas concretas.
2. **Fase 2 — Implementación guiada.** El sistema se construyó por etapas
   revisables (estructura, base de datos, autenticación, turnos, analítica,
   integración n8n, frontend), cada una con su explicación y validación.
3. **Reencuadres puntuales.** Cuando fue necesario ajustar el rumbo o aclarar
   dudas estructurales, se usaron prompts de control para mantener el alcance.
4. **Auditoría técnica.** Una revisión integral del código detectó defectos
   reales antes del cierre.
5. **Cierre.** Documentación final, guía de despliegue e integración continua.

### Cómo ayudó concretamente

- **Programar:** generación de código modular y listo para integrar, con
  explicación de la responsabilidad de cada archivo y cómo se conectaba con el
  resto. El backend quedó organizado por dominios (auth, turnos, servicios,
  admin) y el frontend por responsabilidad (api, componentes, páginas, lógica).
- **Depurar:** ante errores concretos del entorno (por ejemplo, una
  incompatibilidad entre `passlib` y las versiones nuevas de `bcrypt`, o un
  problema de configuración de TypeScript), se diagnosticó la causa y se aplicó
  la corrección verificándola, en lugar de aplicar parches a ciegas.
- **Testear:** cada etapa se validó con pruebas antes de darla por terminada
  (flujos de autenticación, reglas de disponibilidad de turnos, permisos por rol,
  analítica, disparo no bloqueante de notificaciones).
- **Auditar:** la fase de auditoría encontró un problema de **zona horaria** que
  no era visible en desarrollo local y habría aparecido recién en producción.

---

## 3. Qué prompts funcionaron mejor

- **Los prompts estructurados por fase con formato de salida obligatorio** fueron
  los más efectivos. Pedir explícitamente una estructura ("objetivo de la etapa",
  "estructura de archivos", "implementación", "explicación paso a paso",
  "validación", "próximo paso") produjo respuestas consistentes y fáciles de
  revisar, y evitó entregas masivas de código difíciles de auditar.
- **El prompt de restricción de alcance** ("simple, sólido y funcional, sin
  sobreingeniería", con una jerarquía de prioridades) fue clave para que la
  solución no se inflara con capas o patrones innecesarios.
- **El prompt de auditoría técnica** —pedir una revisión crítica, priorizada y
  proporcionada, sin convertirla en una reescritura— fue el que más valor aportó
  sobre el final: convirtió "parece que está bien" en una lista accionable de
  hallazgos con su severidad.
- **Avanzar por etapas pequeñas y pedir validación entre cada una** resultó mucho
  mejor que pedir el sistema completo de una sola vez.

---

## 4. En qué falló o se quedó corta la IA

- **Manejo de zona horaria:** la primera implementación de la lógica de turnos
  mezclaba criterios (hora naive interpretada como UTC en un punto, como hora del
  servidor en otro). Funcionaba en local pero era incorrecta para usuarios fuera
  de UTC. Se detectó recién en la auditoría, no durante la implementación.
- **Errores de entorno no anticipados:** algunas incompatibilidades de versiones
  (bcrypt/passlib) y de configuración (TypeScript con proyectos referenciados,
  tipos de variables de entorno de Vite, clases de Tailwind no estándar) solo
  aparecieron al compilar/ejecutar, no al escribir el código.
- **Operaciones fuera del código:** la reorganización de carpetas del repositorio
  y los comandos de consola (diferencias entre CMD y PowerShell, comportamiento de
  `robocopy`) requirieron varias iteraciones, porque dependían del estado real de
  la máquina, que la IA no podía observar directamente.
- **Detalles que requieren verificación humana:** la coherencia entre lo que se
  decía haber entregado y lo que efectivamente quedaba en los archivos tuvo que
  controlarse en más de una ocasión.

---

## 5. Lecciones aprendidas

- **Diseñar el prompt es parte del trabajo.** Usar un modelo para estructurar las
  instrucciones y otro para ejecutarlas mejoró la calidad y la consistencia de
  los resultados. Un buen prompt con formato de salida definido ahorra muchas
  correcciones después.
- **La IA acelera, pero no reemplaza la verificación.** El mayor valor apareció
  cuando cada etapa se validó (tests, compilación, auditoría) antes de avanzar.
  Los problemas más serios no se vieron al generar el código, sino al probarlo y
  al revisarlo críticamente.
- **Avanzar incremental y pedir control de rumbo evita desvíos.** Construir por
  etapas pequeñas y revisables, en lugar de pedir todo junto, mantuvo el proyecto
  dentro del alcance y sin sobreingeniería.
- **Los problemas de entorno son inevitables.** Versiones de librerías,
  configuración de herramientas y diferencias del sistema operativo siguen
  requiriendo intervención y criterio humano.
- **Una auditoría dedicada vale la pena.** Reservar una fase explícita para
  revisar el sistema completo (no solo cada parte por separado) detectó un defecto
  de fondo que las pruebas por etapa no habían revelado.

---

## 6. Resultado

El proyecto quedó funcional, documentado y desplegable: backend con autenticación
por roles y lógica de turnos validada, frontend con todas las pantallas
conectadas, automatizaciones de correo con n8n, contenedores Docker, integración
continua en GitHub Actions y documentación completa (README y guía de despliegue).
El trabajo asistido por IA permitió cubrir análisis, implementación, depuración,
auditoría y documentación de forma incremental y revisable.
