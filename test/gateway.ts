import { IntrospectAndCompose } from '@apollo/gateway';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

import NodeGateway from '../lib/gateway/NodeGateway.js';

import typeIDDataSource from './typeId.js';
import type { ServiceDescription } from './services.js';

const gateway = async (
  services: ServiceDescription[],
): Promise<[ServiceDescription, NodeGateway]> => {
  const apolloGateway = new NodeGateway(
    {
      typeIDDataSource,
    },
    {
      supergraphSdl: new IntrospectAndCompose({
        subgraphs: services.map(({ name, url }) => ({ name, url })),
      }),
    },
  );
  const server = new ApolloServer({
    gateway: apolloGateway,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });
  return [{ name: 'gateway', server, url }, apolloGateway];
};

export default gateway;
