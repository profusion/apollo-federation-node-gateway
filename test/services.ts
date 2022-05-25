import { ApolloServer, gql } from 'apollo-server';
import { DocumentNode } from 'graphql';
import { buildSubgraphSchema } from '@apollo/federation';
import { GraphQLResolverMap } from 'apollo-graphql';

import { nodeInterface, createNodeResolver } from '../lib';

import typeIDDataSource from './typeId';

const {
  BOOK_SERVICE_PORT = '4003',
  POST_SERVICE_PORT = '4002',
  USER_SERVICE_PORT = '4001',
} = process.env;

const genNodeTypeDef = (name: string): DocumentNode => gql`
  type ${name} implements Node @key(fields: "id") {
    id: ID!
    name: String!
  }
`;

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

const createService = async <T>(
  typeDefs: DocumentNode[] | DocumentNode,
  resolvers: GraphQLResolverMap<T>,
  port: number | string,
): Promise<ApolloServer> => {
  const server = new ApolloServer({
    schema: buildSubgraphSchema({
      resolvers,
      typeDefs,
    }),
  });
  const { url } = await server.listen({ port });
  // eslint-disable-next-line no-console
  console.log(`🚀  Server ready at ${url}`);
  return server;
};

const services = (): Promise<ApolloServer[]> =>
  Promise.all([
    createService<User>(
      [genNodeTypeDef('User'), nodeInterface],
      genNodeResolvers<User>('User', users),
      USER_SERVICE_PORT,
    ),
    createService<Post>(
      [genNodeTypeDef('Post'), nodeInterface],
      genNodeResolvers<Post>('Post', posts),
      POST_SERVICE_PORT,
    ),
    createService<Book>(booksTypeDefs(), booksResolver, BOOK_SERVICE_PORT),
  ]);

export default services;
