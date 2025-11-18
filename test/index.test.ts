import test from './index.js';

it('newman tests works', async () => {
  await expect(test()).resolves.toBeUndefined();
});
