import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { IntrospectAndCompose } from '@apollo/gateway';
import { NodeGateway } from '@profusion/apollo-federation-node-gateway';

import typeIDDataSource from './typeIDDataSource';

const startGateway = async (): Promise<void> => {
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
