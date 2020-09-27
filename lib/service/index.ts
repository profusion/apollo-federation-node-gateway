import { buildFederatedSchema } from '@apollo/federation';
import { DocumentNode, GraphQLSchema } from 'graphql';
import { SchemaDirectiveVisitor, mergeSchemas } from 'graphql-tools';

import TypeIDDataSource from '@utils/TypeIDDataSource';

import { NodeInterface, createNodeQuery } from './schemas';
import resolvers from './resolvers';

interface SchemaDirectives {
  [name: string]: typeof SchemaDirectiveVisitor;
}

export default (
  idDataSource: TypeIDDataSource,
  nodeQueryDirectives: string | null | undefined,
  schemaDirectives: SchemaDirectives | undefined,
  typeDefs: DocumentNode[],
): GraphQLSchema =>
  mergeSchemas({
    schemaDirectives,
    schemas: [
      buildFederatedSchema({
        resolvers: {
          ...resolvers.queryResolver,
          ...resolvers.createNodeResolver(idDataSource),
        },
        typeDefs: [
          createNodeQuery(nodeQueryDirectives),
          NodeInterface,
          ...typeDefs,
        ],
      }),
    ],
  });
