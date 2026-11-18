import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { createStore } from '../src/db/index.js';

const config = loadConfig();
const store = createStore(config);
const app = createApp({ config, store });

export default async function handler(req, res) {
  await store.ensureReady();
  return app(req, res);
}
