import { ApolloGateway } from '@apollo/gateway';
import type { GatewayConfig } from '@apollo/gateway';

import type { NodeServiceConfig } from '../service';
import createNodeGatewayConfig from '../utils/createNodeGatewayConfig';

export default class NodeGateway extends ApolloGateway {
  constructor(
    nodeServiceConfig: NodeServiceConfig,
    gatewayConfig: GatewayConfig,
  ) {
    super(createNodeGatewayConfig(nodeServiceConfig, gatewayConfig));
  }
}
