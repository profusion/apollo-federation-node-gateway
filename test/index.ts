/* eslint-disable no-await-in-loop */
import newman, { NewmanRunSummary } from 'newman';

// eslint-disable-next-line import/extensions
import collection from './collection.json';

import StartGateway from './gateway';
import StartServices from './services';

const maxRetries = 5;

const sleep = (milliseconds: number): Promise<void> =>
  new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });

const runTests = (url: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const { port } = new URL(url);
    newman.run(
      {
        collection,
        globals: {
          id: '5bfde907-2a1e-8c5a-2246-4aff74b74236',
          name: 'test-env',
          values: [
            {
              key: 'PORT',
              type: 'text',
              value: port,
            },
          ],
        },
        reporters: 'cli',
      },
      (err: Error | null, summary: NewmanRunSummary): void => {
        const finalErr = err || summary.error;
        /* istanbul ignore if */
        if (finalErr) {
          reject(finalErr);
          return;
        }
        /* istanbul ignore if */
        if (summary.run.failures && summary.run.failures.length > 0) {
          reject(new Error('Postman tests failed'));
          return;
        }
        resolve();
      },
    );
  });

const test = async (): Promise<void> => {
  const services = await StartServices();
  const [gatewayService, gateway] = await StartGateway(services);
  for (let i = 0; i < maxRetries; i += 1) {
    try {
      await sleep(100);
      // wait until the gateway has loaded the service definitions
      await gateway.serviceHealthCheck();
      // eslint-disable-next-line no-empty
    } catch {}
  }
  await runTests(gatewayService.url);
  await Promise.all(services.concat(gatewayService).map(s => s.server.stop()));
};

/* istanbul ignore if */
if (require.main === module) {
  test().catch(error => {
    // eslint-disable-next-line no-console
    console.error('💥  Failed to run tests', error);
    process.exit(1);
  });
}

export default test;
