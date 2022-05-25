import {
  GraphQLDataSource,
  RemoteGraphQLDataSource,
  ServiceEndpointDefinition,
} from '@apollo/gateway';

import { isNodeServiceEndpoint } from './constants';

const defaultBuildService = (
  serviceDef: ServiceEndpointDefinition,
): GraphQLDataSource => new RemoteGraphQLDataSource(serviceDef);

const createBuildService =
  (
    getNodeServiceDataSource: () => GraphQLDataSource,
    originalBuildService = defaultBuildService,
  ) =>
  (serviceDef: ServiceEndpointDefinition): GraphQLDataSource => {
    if (isNodeServiceEndpoint(serviceDef)) {
      return getNodeServiceDataSource();
    }
    return originalBuildService(serviceDef);
  };

export default createBuildService;
