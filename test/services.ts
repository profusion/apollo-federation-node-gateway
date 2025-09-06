import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { gql } from 'graphql-tag';
import { DocumentNode } from 'graphql';
import { buildSubgraphSchema } from '@apollo/subgraph';
import type { GraphQLResolverMap } from '@apollo/subgraph/dist/schema-helper';

import { nodeInterface, createNodeResolver } from '../lib';

import typeIDDataSource from './typeId';

const genNodeTypeDefs = (name: string): DocumentNode[] => [
  gql`
  type ${name} implements Node @key(fields: "id") {
    id: ID!
    name: String!
  }
`,
  nodeInterface,
];

interface User {
  id: number;
  name: string;
}

type Post = User;
type Book = User;

const users: User[] = [
  {
    id: 0,
    name: 'Alex',
  },
  {
    id: 1,
    name: 'Cody',
  },
  {
    id: 2,
    name: 'Albert',
  },
];

const posts: Post[] = [
  {
    id: 0,
    name: 'Post 1',
  },
  {
    id: 1,
    name: 'Post 2',
  },
  {
    id: 2,
    name: 'Post 3',
  },
];

const genNodeResolvers = <T>(
  name: string,
  data: T[],
): GraphQLResolverMap<T> => ({
  ...createNodeResolver(typeIDDataSource),
  [name]: {
    __resolveReference: ({ id }: { id: string }): T | undefined =>
      data[parseInt(typeIDDataSource.fromId(id)[1], 10)],
  },
});

const booksTypeDefs = (): DocumentNode => gql`
  type Book {
    id: ID!
    name: String!
  }

  extend type Query {
    books: [Book!]!
  }
`;

const booksResolver = {
  Query: {
    books: (): Book[] => [
      { id: 1, name: 'Book 1' },
      { id: 2, name: 'Book 2' },
    ],
  },
};

export type ServiceDescription = {
  name: string;
  url: string;
  server: ApolloServer;
};

const createService = async <T>(
  name: string,
  typeDefs: DocumentNode[] | DocumentNode,
  resolvers: GraphQLResolverMap<T>,
): Promise<ServiceDescription> => {
  const server = new ApolloServer({
    schema: buildSubgraphSchema({
      resolvers: resolvers as GraphQLResolverMap<unknown>,
      typeDefs,
    }),
  });
  const { url } = await startStandaloneServer(server, {
    listen: { port: undefined },
  });
  return { name, server, url };
};

const services = (): Promise<ServiceDescription[]> =>
  Promise.all([
    createService<User>(
      'user',
      genNodeTypeDefs('User'),
      genNodeResolvers<User>('User', users),
    ),
    createService<Post>(
      'post',
      genNodeTypeDefs('Post'),
      genNodeResolvers<Post>('Post', posts),
    ),
    createService<Book>('book', booksTypeDefs(), booksResolver),
  ]);

export default services;
