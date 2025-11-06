import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { IntrospectAndCompose } from '@apollo/gateway';

import { NodeGateway } from '@profusion/apollo-federation-node-gateway';

// import { readFile } from 'node:fs/promises';

// import { IntrospectAndCompose } from '@apollo/gateway';

import typeIDDataSource from './typeIDDataSource';

const startGateway = async (): Promise<void> => {
  // const supergraphSdl = await readFile('./supergraph.graphql', 'utf-8');
  const apolloGateway = new NodeGateway(
    {
      typeIDDataSource,
    },
    {
      // supergraphSdl,
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
