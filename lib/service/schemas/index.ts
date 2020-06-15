import { gql } from 'apollo-server';
import { DocumentNode } from 'graphql';

export const createNodeQuery = (
  directives?: string | null,
): DocumentNode => gql`
  extend type Query {
    node(id: ID!): Node ${directives || ''}
  }
`;

export const NodeInterface = gql/* GraphQL */ `
  interface Node {
    id: ID!
  }
`;
