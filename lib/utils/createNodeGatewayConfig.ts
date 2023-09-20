import type {
  GatewayConfig,
  SupergraphManager,
  SupergraphSdlHook,
} from '@apollo/gateway';
import {
  isStaticSupergraphSdlConfig,
  isSupergraphManagerConfig,
  isSupergraphSdlHookConfig,
  SupergraphSdlHookGatewayConfig,
} from '@apollo/gateway/dist/config';

import type { NodeServiceConfig } from '../service';

import createBuildService from './createBuildService';
import createNodeSupergraphSdlHookAndDataSource from './createNodeSupergraphSdlHookAndDataSource';

const createSupergraphManager = (config: GatewayConfig): SupergraphManager => {
  if (isSupergraphManagerConfig(config)) {
    return config.supergraphSdl;
  }
  if (isSupergraphSdlHookConfig(config)) {
    return { initialize: config.supergraphSdl };
  }
  if (isStaticSupergraphSdlConfig(config)) {
    return {
      initialize: (): ReturnType<SupergraphSdlHook> =>
        Promise.resolve({ supergraphSdl: config.supergraphSdl }),
    };
  }
  throw new Error('Provide GatewayConfig with supergraphSdl property');
};

const createNodeGatewayConfig = (
  nodeServiceConfig: NodeServiceConfig,
  gatewayConfig: GatewayConfig,
): SupergraphSdlHookGatewayConfig => {
  const { supergraphSdlHook: supergraphSdl, getNodeDataSource } =
    createNodeSupergraphSdlHookAndDataSource(
      nodeServiceConfig,
      createSupergraphManager(gatewayConfig),
    );

  const buildService = createBuildService(
    getNodeDataSource,
    /* istanbul ignore next */
    gatewayConfig?.buildService,
  );

  return {
    ...gatewayConfig,
    buildService,
    supergraphSdl,
  };
};

export default createNodeGatewayConfig;
