import { ApolloGateway } from '@apollo/gateway';
import { SupergraphManagerGatewayConfig } from '@apollo/gateway/dist/config';
import { IntrospectAndComposeOptions } from '@apollo/gateway/dist/supergraphManagers/IntrospectAndCompose';

import introspectAddNodeAndCompose, {
  NodeGatewayConfig,
} from 'lib/subgraphManagers/introspectAddNodeAndCompose';

export type NodeGatewayInput = {
  gatewayConfig?: Omit<SupergraphManagerGatewayConfig, 'supergraphSdl'>;
  introspectAndComposeOptions: Omit<
    IntrospectAndComposeOptions,
    'pollIntervalInMs'
  >;
  nodeGatewayConfig: NodeGatewayConfig;
};

export default class NodeGateway extends ApolloGateway {
  constructor({
    nodeGatewayConfig,
    gatewayConfig,
    introspectAndComposeOptions,
  }: NodeGatewayInput) {
    const { buildService, supergraphSdl } = introspectAddNodeAndCompose(
      nodeGatewayConfig,
      introspectAndComposeOptions,
    );
    const newGatewayConfig = { ...gatewayConfig, buildService, supergraphSdl };
    super(newGatewayConfig);
  }
}
