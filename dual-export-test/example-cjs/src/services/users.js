const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { buildSubgraphSchema } = require('@apollo/subgraph');
const gql = require('graphql-tag');
const {
  createNodeResolver,
  nodeInterface,
} = require('@profusion/apollo-federation-node-gateway');

const typeIDDataSource = require('../typeIDDataSource.ts');

const users = [
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

const startServer = async () => {
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4001 },
  });
  // eslint-disable-next-line no-console
  console.log(`User service running at: ${url}`);
};

startServer();
