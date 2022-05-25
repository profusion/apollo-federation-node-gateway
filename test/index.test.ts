import test from './index';

it('newman tests works', async () => {
  await expect(test()).resolves.toBeUndefined();
});
