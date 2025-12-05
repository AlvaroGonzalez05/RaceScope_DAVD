# RaceScope_DAVD

Interfaz web para el visor de datos de carreras RaceScope_DAVD. Muestra telemetría vuelta a vuelta, predice estrategias óptimas vía backend ML y contextualiza cada sesión con información del circuito.

## Qué hace
- Dashboard en tiempo real con gráficas de telemetría (velocidad, gas/freno, RPM, marchas) usando Recharts.
- Petición al backend (`/api/predict-strategy` en `localhost:5001`) para obtener la estrategia recomendada y la imagen generada.
- Componentes modulares: `TelemetryPanel`, `StrategyPanel`, `CircuitInfo` y barra de control con parámetros de piloto/GP/año.
- Estilos tipo “pit wall”: layout en grid 5x5, paneles oscuros y controles compactos.
- Datos mock de telemetría incluidos para visualizar sin depender del backend mientras se integra la API real.

## Stack y dependencias
- React 19 + Vite 7 (HMR, build rápido).
- Recharts para las gráficas y Axios para las llamadas HTTP.
- ESLint 9 con reglas recomendadas para mantener el código consistente.

## Estructura del proyecto
- `src/App.jsx`: orquesta el dashboard, gestiona el formulario y la llamada a `/api/predict-strategy`.
- `src/components/TelemetryPanel.jsx`: cinco gráficas sincronizadas con `syncId` para velocidad, gas, freno, RPM y marchas.
- `src/components/StrategyPanel.jsx`: muestra la imagen devuelta por el modelo y los puntos clave de la estrategia (tiempo total, vueltas de parada).
- `src/components/CircuitInfo.jsx`: contexto rápido del GP/año y notas de degradación/estrategia.
- `src/App.css` y `src/index.css`: tema oscuro, grid y estilos base.

## Requisitos previos
- Node.js 18+.
- npm (o yarn/pnpm si prefieres, ajustando los comandos).
- Backend RaceScope corriendo en `localhost:5001` con el endpoint `/api/predict-strategy`.

## Puesta en marcha (desarrollo)
1) Instalar dependencias: `npm install`  
2) Levantar el frontend: `npm run dev`  
3) Abrir la URL que indique Vite (por defecto `http://localhost:5173`).  
4) Iniciar el backend en paralelo (`localhost:5001`) para recibir la estrategia. Si no hay backend, seguirás viendo las gráficas con datos mock.

## Variables de entorno
Crear `.env` en la raíz y definir valores con prefijo `VITE_`. Ejemplo:
- `VITE_API_BASE_URL=http://localhost:5001` (se usa para construir la ruta de predicción y servir la imagen).
- `VITE_WS_URL=wss://realtime.example.com` (opcional si conectas WebSocket de tiempos en vivo).

## Flujo de datos
1) El usuario elige piloto/GP/año y pulsa START.  
2) El frontend hace `POST /api/predict-strategy` con `{ driver, gp, year }`.  
3) El backend responde con `image_url` y `strategies[]`; se renderiza la imagen y se muestran vueltas de parada/tiempo total.  
4) La telemetría de la vuelta rápida se grafica desde el mock hasta sustituirla por datos reales del backend o de un WebSocket.

## Scripts útiles
- `npm run dev` — arranca Vite con HMR.
- `npm run build` — genera el build de producción.
- `npm run preview` — sirve el build para pruebas locales.
- `npm run lint` — ejecuta ESLint sobre el proyecto.

## Siguientes pasos recomendados
- Sustituir el mock de `TelemetryPanel` por la telemetría real desde el backend/WS.
- Añadir manejo de estados “sin datos / error” cuando la API no responde o llega vacía.
- Documentar el contrato completo de `/api/predict-strategy` y, si aplica, los eventos de tiempo real.

## Licencia
Consultar el archivo LICENSE en el repositorio principal del proyecto.
