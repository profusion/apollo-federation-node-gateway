import gql from 'graphql-tag';
import type { DocumentNode } from 'graphql';

export const createNodeQuery = (
  directives?: string | null,
): DocumentNode => gql`
  extend type Query {
    node(id: ID!): Node ${directives || ''}
  }
`;

export const nodeInterface = gql/* GraphQL */ `
  interface Node {
    id: ID!
  }
`;
