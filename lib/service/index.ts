import type { DocumentNode, GraphQLSchema } from 'graphql';

import { buildSubgraphSchema } from '@apollo/federation';
import { mapSchema } from '@graphql-tools/utils';

import type { NodeGatewayConfig } from 'lib/subgraphManagers/introspectAddNodeAndCompose';

import { nodeInterface, createNodeQuery } from './schemas';
import resolvers from './resolvers';

export default (
  {
    nodeQueryDirectives,
    directiveDefinitions = [],
    schemaMapper,
    typeIDDataSource,
  }: Omit<NodeGatewayConfig, 'nodeTypeDefs'>,
  nodeTypeDefs: DocumentNode[],
): GraphQLSchema => {
  const schema = buildSubgraphSchema({
    resolvers: {
      ...resolvers.queryResolver,
      ...resolvers.createNodeResolver(typeIDDataSource),
    },
    typeDefs: [
      createNodeQuery(nodeQueryDirectives),
      nodeInterface,
      ...directiveDefinitions,
      ...nodeTypeDefs,
    ],
  });
  return schemaMapper ? mapSchema(schema, schemaMapper) : schema;
};
