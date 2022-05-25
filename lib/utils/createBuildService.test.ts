import { GraphQLDataSource, RemoteGraphQLDataSource } from '@apollo/gateway';

import createBuildService from './createBuildService';
import { createNodeServiceEndPoint } from './constants';

describe('createBuildService', () => {
  const nodeDataSource = { a: 1 } as unknown as GraphQLDataSource;
  const serviceDataSource = { b: 2 } as unknown as GraphQLDataSource;

  it('calls getNodeServiceDataSource if nodeService', () => {
    const getNodeServiceDataSource = jest.fn(() => nodeDataSource);
    const buildService = createBuildService(getNodeServiceDataSource);
    expect(buildService(createNodeServiceEndPoint('id'))).toBe(nodeDataSource);
  });

  it('calls origBuildService if NOT nodeService', () => {
    const getNodeServiceDataSource = jest.fn(() => nodeDataSource);
    const origBuildService = jest.fn(() => serviceDataSource);
    const buildService = createBuildService(
      getNodeServiceDataSource,
      origBuildService,
    );
    expect(buildService({ name: 'other', url: 'other' })).toBe(
      serviceDataSource,
    );
  });

  it('calls defaultBuildService if NOT nodeService and no origBuildService', () => {
    const getNodeServiceDataSource = jest.fn(() => nodeDataSource);
    const buildService = createBuildService(getNodeServiceDataSource);
    expect(buildService({ name: 'other', url: 'other' })).toBeInstanceOf(
      RemoteGraphQLDataSource,
    );
  });
});
