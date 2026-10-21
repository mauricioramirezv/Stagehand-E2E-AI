# Pruebas E2E con Stagehand e inteligencia artificial

Proyecto educativo para automatizar una prueba de inicio de sesión mediante
instrucciones en lenguaje natural y comprobar el resultado con una aserción
determinística. Incluye ejemplos con OpenAI, Google Gemini y Ollama local.

El proyecto está actualizado a **Stagehand 4.3.0** y usa su API de navegador
local. No utiliza Playwright directamente.

## Objetivos de aprendizaje

- Diferenciar una acción asistida por IA de una verificación determinística.
- Usar `act`, `observe` y `extract` con Stagehand.
- Ejecutar el mismo escenario con distintos proveedores de modelos.
- Evitar que una excepción quede oculta y produzca un falso resultado exitoso.
- Consultar métricas de tokens y tiempo de inferencia.

## Escenarios incluidos

| Comando | Proveedor | Qué valida |
|---|---|---|
| `npm run test:ollama` | Ollama local | Login mediante IA y mensaje final exacto |
| `npm run test:openai` | OpenAI | Login mediante IA y mensaje final exacto |
| `npm run test:gemini` | Google Gemini | Login mediante IA y mensaje final exacto |
| `npm run test:observe` | Configurable | `observe`, extracción estructurada y título esperado |

Los ejemplos utilizan <https://the-internet.herokuapp.com/>. Al ser un sitio
externo, su disponibilidad no depende de este repositorio.

## Requisitos

- Node.js **22.18.0 o superior**.
- npm.
- Google Chrome o Chromium instalado.
- Uno de estos accesos:
  - Ollama local y un modelo compatible con salida JSON estructurada;
  - una clave de OpenAI;
  - una clave de Google Gemini.

No es necesario ejecutar `playwright install`. Stagehand 4 inicia el navegador
local mediante `localBrowser`.

## Instalación

En PowerShell:

```powershell
git clone https://github.com/mauricioramirezv/Stagehand-E2E-AI.git
Set-Location Stagehand-E2E-AI
npm ci
Copy-Item .env.example .env
npm run typecheck
```

En Linux o macOS:

```bash
git clone https://github.com/mauricioramirezv/Stagehand-E2E-AI.git
cd Stagehand-E2E-AI
npm ci
cp .env.example .env
npm run typecheck
```

Edite `.env` y configure únicamente el proveedor que utilizará. El archivo
`.env` está excluido de Git; nunca publique claves reales.

## Ejecutar cada ejemplo

### 1. Login con Ollama

Instale Ollama, descargue un modelo y compruebe que el servicio responda:

```powershell
ollama pull qwen2.5:7b
ollama run qwen2.5:7b
```

En `.env`:

```env
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_API_KEY=ollama
OLLAMA_MODEL=qwen2.5:7b
HEADLESS=false
```

Ejecución:

```powershell
npm run test:ollama
```

Stagehand 4 no reconoce `ollama/...` como proveedor nativo. Por eso este
proyecto incorpora un adaptador para la API compatible con OpenAI de Ollama.
Esta alternativa es útil para clase, pero puede ser más lenta y menos estable
que un modelo alojado.

### 2. Login con OpenAI

En `.env`:

```env
OPENAI_API_KEY=su_clave_real
OPENAI_MODEL=openai/gpt-4.1-mini
HEADLESS=false
```

Ejecución:

```powershell
npm run test:openai
```

### 3. Login con Google Gemini

En `.env`:

```env
GOOGLE_GENERATIVE_AI_API_KEY=su_clave_real
GEMINI_MODEL=google/gemini-2.5-flash
HEADLESS=false
```

Ejecución:

```powershell
npm run test:gemini
```

### 4. Observe y Extract

Este ejemplo busca una acción relacionada con autenticación y extrae un objeto
con título y ejemplos de la página. El proveedor se selecciona con
`AI_PROVIDER` en `.env`:

```env
AI_PROVIDER=ollama
```

Valores permitidos: `ollama`, `openai` y `gemini`.

```powershell
npm run test:observe
```

Para cambiarlo solo durante una ejecución en PowerShell:

```powershell
$env:AI_PROVIDER = "openai"
npm run test:observe
Remove-Item Env:AI_PROVIDER
```

## Ejecutar todos los ejemplos

Este comando requiere que Ollama esté funcionando y que las dos claves de nube
estén configuradas:

```powershell
npm run test:e2e:all
```

Si solamente desea comprobar el código sin consumir modelos ni abrir el
navegador:

```powershell
npm test
```

`npm test` ejecuta la validación estricta de TypeScript. El flujo de GitHub
Actions también ejecuta esta comprobación sin almacenar secretos.

## Qué hace la prueba de login

1. Stagehand abre la página de login.
2. `act` identifica y completa los campos mediante instrucciones naturales.
3. `observe` propone la acción para iniciar sesión.
4. `act` ejecuta la acción observada.
5. Un localizador CSS comprueba exactamente el mensaje de éxito.
6. Se imprimen las métricas de inferencia.

Las credenciales públicas del sitio de demostración se pasan como variables de
Stagehand. En un sistema real deben proceder de variables de entorno o de un
gestor de secretos.

## Estructura

```text
Stagehand-E2E-AI/
├── .github/workflows/quality.yml
├── src/
│   ├── assert.ts
│   ├── config.ts
│   ├── login-scenario.ts
│   ├── ollama-client.ts
│   ├── run.ts
│   └── stagehand.ts
├── tests/
│   ├── login-gemini.e2e.ts
│   ├── login-ollama.e2e.ts
│   ├── login-openai.e2e.ts
│   └── observe-extract.e2e.ts
├── .env.example
├── package-lock.json
├── package.json
└── tsconfig.json
```

## Diseño de las pruebas

| Responsabilidad | Técnica |
|---|---|
| Encontrar y manipular controles dinámicos | `act` y `observe` de Stagehand |
| Validar el resultado funcional | Localizador y aserción exacta |
| Validar datos producidos por un LLM | Esquema Zod más aserciones |
| Detectar errores en terminal o CI | Código de salida distinto de cero |
| Comparar costo y desempeño | `stagehand.metrics()` |

La IA se reserva para los pasos que se benefician de flexibilidad. Una
validación crítica no debe depender solo de que otro modelo interprete si la
prueba pasó.

## Solución de problemas

### No encuentra Chrome

Defina la ruta del ejecutable en `.env`. Ejemplo para Windows:

```env
CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

### Falta una clave

El programa termina con un mensaje que indica la variable requerida. Configure
`OPENAI_API_KEY` o `GOOGLE_GENERATIVE_AI_API_KEY` según el comando ejecutado.

### Ollama no responde

Compruebe el servicio y el modelo:

```powershell
ollama list
Invoke-RestMethod http://localhost:11434/api/tags
```

Los modelos pequeños pueden no respetar el esquema JSON que Stagehand necesita.
Pruebe un modelo con mejor capacidad de instrucciones o use OpenAI/Gemini.

### Necesita más información de diagnóstico

En `.env` cambie:

```env
STAGEHAND_LOG_LEVEL=debug
HEADLESS=false
```

## Alcance académico

El uso de IA no elimina la necesidad de datos controlados, aserciones precisas,
aislamiento, gestión de secretos y una estrategia de pruebas por capas. Estas
pruebas consumen recursos del modelo, dependen de un navegador y pueden variar
entre ejecuciones; no sustituyen las pruebas unitarias ni las pruebas de API.
