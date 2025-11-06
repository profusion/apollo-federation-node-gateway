import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';
import {
  createNodeResolver,
  nodeInterface,
} from '@profusion/apollo-federation-node-gateway';

import typeIDDataSource from '../typeIDDataSource';

type UserType = {
  id: string;
  username: string;
};

const users: UserType[] = [
  {
    id: '1',
    username: 'user1',
  },
  {
    id: '2',
    username: 'user2',
  },
  {
    id: '3',
    username: 'user3',
  },
];

const server = new ApolloServer({
  schema: buildSubgraphSchema({
    resolvers: {
      ...createNodeResolver(typeIDDataSource),
      Query: {
        users: () =>
          users.map(user => ({
            ...user,
            id: typeIDDataSource.toId('User', user.id),
          })),
      },
      User: {
        __resolveReference: ({ id }) => {
          const decodedId = typeIDDataSource.fromId(id)[1];
          return users.find(user => user.id === decodedId);
        },
        lastPost: () => ({
          authorId: '1',
          body: 'post body',
          id: typeIDDataSource.toId('Post', '4'),
          title: 'post4',
        }),
      },
    },
    typeDefs: [
      gql`
        type User implements Node @key(fields: "id") {
          id: ID!
          username: String!
          lastPost: Post @provides(fields: "id")
        }
        extend type Post @key(fields: "id") {
          id: ID! @external
          author: User!
        }

        type Query {
          users: [User!]!
        }
      `,
      nodeInterface,
    ],
  }),
});

const startServer = async (): Promise<void> => {
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4001 },
  });
  // eslint-disable-next-line no-console
  console.log(`User service running at: ${url}`);
};

startServer();
