import { ApolloGateway } from '@apollo/gateway';
import type { GatewayConfig } from '@apollo/gateway';

import type { NodeServiceConfig } from '../service/index.js';
import createNodeGatewayConfig from '../utils/createNodeGatewayConfig.js';

export default class NodeGateway extends ApolloGateway {
  constructor(
    nodeServiceConfig: NodeServiceConfig,
    gatewayConfig: GatewayConfig,
  ) {
    super(createNodeGatewayConfig(nodeServiceConfig, gatewayConfig));
  }
}
