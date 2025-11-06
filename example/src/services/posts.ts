import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';
import {
  createNodeResolver,
  nodeInterface,
} from '@profusion/apollo-federation-node-gateway';

import typeIDDataSource from '../typeIDDataSource';

type PostType = {
  id: string;
  title: string;
  body: string;
  authorId: string;
};

const posts: PostType[] = [
  {
    authorId: '1',
    body: 'post body',
    id: '1',
    title: 'post1',
  },
  {
    authorId: '2',
    body: 'post body',
    id: '2',
    title: 'post2',
  },
  {
    authorId: '3',
    body: 'post body',
    id: '3',
    title: 'post3',
  },
  {
    authorId: '1',
    body: 'post body',
    id: '4',
    title: 'post4',
  },
];

const server = new ApolloServer({
  schema: buildSubgraphSchema({
    resolvers: {
      ...createNodeResolver(typeIDDataSource),
      Post: {
        __resolveReference: ({ id }) => {
          const decodedId = typeIDDataSource.fromId(id)[1];
          return posts.find(user => user.id === decodedId);
        },
        author: (post: PostType) => ({
          id: typeIDDataSource.toId('User', post.authorId),
        }),
      },
      Query: {
        posts: () =>
          posts.map(post => ({
            ...post,
            id: typeIDDataSource.toId('Post', post.id),
          })),
      },
      User: {
        posts: (user: { id: string }) => {
          const userId = typeIDDataSource.fromId(user.id)[1];
          return posts
            .filter(post => post.authorId === userId)
            .map(post => ({
              ...post,
              id: typeIDDataSource.toId('Post', post.id),
            }));
        },
      },
    },
    typeDefs: [
      gql`
        extend type User @key(fields: "id") {
          id: ID! @external
          posts: [Post!]!
        }
        type Post implements Node @key(fields: "id") {
          id: ID!
          title: String!
          body: String!
          author: User @provides(fields: "id")
        }

        type Query {
          posts: [Post!]!
        }
      `,
      nodeInterface,
    ],
  }),
});

const startServer = async (): Promise<void> => {
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4002 },
  });
  // eslint-disable-next-line no-console
  console.log(`Post service running at: ${url}`);
};

startServer();
