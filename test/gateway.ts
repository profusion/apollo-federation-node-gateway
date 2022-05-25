import { ApolloServer } from 'apollo-server';

import NodeGateway from '../lib/gateway/NodeGateway';

import typeIDDataSource from './typeId';

const {
  BOOK_SERVICE_PORT = '4003',
  GATEWAY_PORT = '4000',
  POST_SERVICE_PORT = '4002',
  USER_SERVICE_PORT = '4001',
} = process.env;

const gateway = async (): Promise<[ApolloServer, NodeGateway]> => {
  const apolloGateway = new NodeGateway({
    introspectAndComposeOptions: {
      subgraphs: [
        {
          name: 'user',
          url: `http://localhost:${USER_SERVICE_PORT}/graphql`,
        },
        {
          name: 'post',
          url: `http://localhost:${POST_SERVICE_PORT}/graphql`,
        },
        {
          name: 'book',
          url: `http://localhost:${BOOK_SERVICE_PORT}/graphql`,
        },
      ],
    },
    nodeGatewayConfig: {
      typeIDDataSource,
    },
  });
  const server = new ApolloServer({
    gateway: apolloGateway,
  });

  const { url } = await server.listen({ port: GATEWAY_PORT });
  // eslint-disable-next-line no-console
  console.log(`🚀  Server ready at ${url}`);
  return [server, apolloGateway];
};

export default gateway;
