import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createStore } from './db/index.js';

const config = loadConfig();
const store = createStore(config);

await store.ensureReady();
const app = createApp({ config, store });

app.listen(config.port, () => {
  console.info(`Sajian Catering API (${store.driver}) listening on port ${config.port}`);
});
