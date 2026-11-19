import { loadConfig } from '../config.js';
import { createStore } from '../db/index.js';

async function main() {
  const config = loadConfig();
  const store = createStore(config);
  try {
    await store.ensureReady();
    const health = await store.ping();
    const [packages, stalls, orders, staffAccounts] = await Promise.all([
      store.listPackages(),
      store.listStalls(),
      store.listOrders(),
      store.listStaffAccounts(),
    ]);

    console.log(
      JSON.stringify(
        {
          ok: true,
          driver: store.driver,
          environment: config.nodeEnv,
          dbPing: health,
          counts: {
            packages: packages.length,
            stalls: stalls.length,
            orders: orders.length,
            staffAccounts: staffAccounts.length,
          },
        },
        null,
        2
      )
    );
  } finally {
    await store.close();
  }
}

main().catch((err) => {
  console.error('Database health/migration check failed:', err.message);
  process.exit(1);
});
