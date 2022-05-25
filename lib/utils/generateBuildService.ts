import {
  GraphQLDataSource,
  RemoteGraphQLDataSource,
  ServiceEndpointDefinition,
} from '@apollo/gateway';

export const defaultBuildService = (
  serviceDef: ServiceEndpointDefinition,
): GraphQLDataSource => new RemoteGraphQLDataSource(serviceDef);

const generateBuildService = (
  getNodeServiceDataSource: (
    servideDef: ServiceEndpointDefinition,
  ) => GraphQLDataSource | undefined,
  originalBuildService = defaultBuildService,
) => (serviceDef: ServiceEndpointDefinition): GraphQLDataSource => {
  const dataSource = getNodeServiceDataSource(serviceDef);
  if (dataSource) {
    return dataSource;
  }
  return originalBuildService(serviceDef);
};

export default generateBuildService;
