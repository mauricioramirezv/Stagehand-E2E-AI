import 'dotenv/config';
import { z } from 'zod';
import { assertIncludes } from '../src/assert.js';
import { selectedProvider } from '../src/config.js';
import { run } from '../src/run.js';
import { closeTestSession, createTestSession } from '../src/stagehand.js';

async function main(): Promise<void> {
  const provider = selectedProvider();
  const session = await createTestSession(provider);

  try {
    await session.page.goto('https://the-internet.herokuapp.com/');

    const observations = await session.stagehand.observe(
      'Encuentra el enlace del ejemplo de autenticación o login',
      { page: session.page },
    );
    if (observations.data.length === 0) {
      throw new Error('Observe no encontró el ejemplo de autenticación.');
    }

    const schema = z.object({
      title: z.string(),
      examples: z.array(z.string()).min(1).max(5),
    });
    const extracted = await session.stagehand.extract(
      'Extrae el título principal y hasta cinco nombres de ejemplos disponibles.',
      schema,
      { page: session.page },
    );

    assertIncludes(extracted.data.title, 'The Internet', 'El título extraído no es el esperado.');
    console.log('Primera acción observada:', observations.data[0]);
    console.log('Datos extraídos:', extracted.data);
    console.log('Métricas:', await session.stagehand.metrics());
  } finally {
    await closeTestSession(session);
  }
}

run(main);
