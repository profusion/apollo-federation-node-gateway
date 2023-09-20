import TypeIDDataSource from '../../utils/TypeIDDataSource';

import resolvers from './index';

describe('service/resolves', () => {
  const node = { id: 'MQp4cHRv' };

  it('queryResolver works', () => {
    expect(resolvers.queryResolver.Query.node({}, node)).toBe(node);
  });

  it('createNodeResolver works', () => {
    const idDataSource = new TypeIDDataSource({ Post: '1', User: '2' });
    const resolver = resolvers.createNodeResolver(idDataSource);
    // eslint-disable-next-line no-underscore-dangle
    expect(resolver.Node.__resolveType(node)).toBe('Post');
  });
});
