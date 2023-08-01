import { buildSubgraphSchema } from '@apollo/subgraph';
import type { DocumentNode, GraphQLSchema } from 'graphql';
import { mapSchema } from '@graphql-tools/utils';
import type { SchemaMapper } from '@graphql-tools/utils';

import type TypeIDDataSource from 'lib/utils/TypeIDDataSource';

import { nodeInterface, createNodeQuery } from './schemas';
import resolvers from './resolvers';

export type NodeServiceConfig = {
  typeIDDataSource: TypeIDDataSource;
  nodeQueryDirectives?: string | null;
  schemaMapper?: SchemaMapper;
  typeDefs?: DocumentNode[];
};

export default ({
  nodeQueryDirectives,
  schemaMapper,
  typeIDDataSource,
  typeDefs,
}: NodeServiceConfig): GraphQLSchema =>
  mapSchema(
    buildSubgraphSchema({
      resolvers: {
        ...resolvers.queryResolver,
        ...resolvers.createNodeResolver(typeIDDataSource),
      },
      typeDefs: [
        createNodeQuery(nodeQueryDirectives),
        nodeInterface,
        ...(typeDefs || /* istanbul ignore next */ []),
      ],
    }),
    schemaMapper,
  );
