import { ApolloGateway } from '@apollo/gateway';
import type { GatewayConfig } from '@apollo/gateway';

import type { NodeServiceConfig } from 'lib/service';
import createNodeGatewayConfig from 'lib/utils/createNodeGatewayConfig';

export default class NodeGateway extends ApolloGateway {
  constructor(
    nodeServiceConfig: NodeServiceConfig,
    gatewayConfig: GatewayConfig,
  ) {
    super(createNodeGatewayConfig(nodeServiceConfig, gatewayConfig));
  }
}
