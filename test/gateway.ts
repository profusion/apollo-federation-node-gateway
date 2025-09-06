import { IntrospectAndCompose } from '@apollo/gateway';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

import NodeGateway from '../lib/gateway/NodeGateway';

import typeIDDataSource from './typeId';
import type { ServiceDescription } from './services';

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
