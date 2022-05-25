import { isDocumentNode } from '@graphql-tools/utils';

import {
  createNodeResolver,
  createNodeQuery,
  nodeInterface,
  createNodeService,
  NodeGateway,
  createNodeGatewayConfig,
  TypeIDDataSource,
} from './index';

describe('check library exports', () => {
  it('createNodeResolver is a function', () => {
    expect(typeof createNodeResolver).toBe('function');
  });

  it('createNodeQuery is a function', () => {
    expect(typeof createNodeQuery).toBe('function');
  });

  it('nodeInterface is a document node', () => {
    expect(isDocumentNode(nodeInterface)).toBeTruthy();
  });

  it('createNodeService is a function', () => {
    expect(typeof createNodeService).toBe('function');
  });

  it('NodeGateway is a function', () => {
    expect(typeof NodeGateway).toBe('function');
  });

  it('createNodeGatewayConfig is a function', () => {
    expect(typeof createNodeGatewayConfig).toBe('function');
  });

  it('TypeIDDataSource is a function', () => {
    expect(typeof TypeIDDataSource).toBe('function');
  });
});
