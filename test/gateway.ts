import { ApolloServer } from 'apollo-server';

import { NodeGateway } from '../lib';

import typeIDDataSource from './typeId';

const {
  BOOK_SERVICE_PORT = '4003',
  GATEWAY_PORT = '4000',
  POST_SERVICE_PORT = '4002',
  USER_SERVICE_PORT = '4001',
} = process.env;

const gateway = async (): Promise<[ApolloServer, NodeGateway]> => {
  const apolloGateway = new NodeGateway(
    { typeIDDataSource },
    {
      serviceList: [
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
  );
  const server = new ApolloServer({
    engine: false,
    gateway: apolloGateway,
    subscriptions: false,
  });

  const { url } = await server.listen({ port: GATEWAY_PORT });
  // eslint-disable-next-line no-console
  console.log(`🚀  Server ready at ${url}`);
  return [server, apolloGateway];
};

export default gateway;
