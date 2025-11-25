const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { IntrospectAndCompose } = require('@apollo/gateway');
const { NodeGateway } = require('@profusion/apollo-federation-node-gateway');

const typeIDDataSource = require('./typeIDDataSource.ts');

const startGateway = async () => {
  const apolloGateway = new NodeGateway(
    {
      typeIDDataSource,
    },
    {
      supergraphSdl: new IntrospectAndCompose({
        subgraphs: [
          {
            name: 'users',
            url: 'http://localhost:4001',
          },
          {
            name: 'posts',
            url: 'http://localhost:4002',
          },
        ],
      }),
    },
  );
  const server = new ApolloServer({
    gateway: apolloGateway,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });
  // eslint-disable-next-line no-console
  console.log(`Gateway running at: ${url}`);
};

startGateway();
