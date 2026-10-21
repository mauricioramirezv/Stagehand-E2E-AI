import { assertIncludes } from './assert.js';
import { closeTestSession, createTestSession } from './stagehand.js';
import type { Provider } from './config.js';

const LOGIN_URL = 'https://the-internet.herokuapp.com/login';

export async function runLoginScenario(provider: Provider): Promise<void> {
  const session = await createTestSession(provider);

  try {
    console.log(`[${provider}] Abriendo ${LOGIN_URL}`);
    await session.page.goto(LOGIN_URL);

    await session.stagehand.act('Escribe %usuario% en el campo Username', {
      page: session.page,
      variables: { usuario: 'tomsmith' },
    });
    await session.stagehand.act('Escribe %clave% en el campo Password', {
      page: session.page,
      variables: { clave: 'SuperSecretPassword!' },
    });

    const options = await session.stagehand.observe('Encuentra el botón para iniciar sesión', {
      page: session.page,
    });
    const loginAction = options.data[0];
    if (!loginAction) throw new Error('La IA no encontró una acción para iniciar sesión.');
    await session.stagehand.act(loginAction, { page: session.page });

    await session.page.waitForSelector('#flash', { state: 'visible', timeout: 15_000 });
    const message = await session.page.locator('#flash').innerText();
    assertIncludes(
      message,
      'You logged into a secure area!',
      'No se encontró el mensaje de inicio de sesión correcto.',
    );

    console.log(`[${provider}] Prueba superada: ${message.trim()}`);
    console.log(`[${provider}] Métricas:`, await session.stagehand.metrics());
  } finally {
    await closeTestSession(session);
  }
}
