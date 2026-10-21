import 'dotenv/config';
import { runLoginScenario } from '../src/login-scenario.js';
import { run } from '../src/run.js';

run(() => runLoginScenario('openai'));
