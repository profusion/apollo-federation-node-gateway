import type { DocumentNode } from 'graphql';
import { visit } from 'graphql';

import type { SchemaMapper } from '@graphql-tools/utils';
import type { GraphQLDataSource, ServiceDefinition } from '@apollo/gateway';
import type {
  GatewayConfig,
  ServiceDefinitionUpdate,
  ServiceEndpointDefinition,
  SupergraphSdlHook,
  SupergraphSdlHookOptions,
} from '@apollo/gateway/dist/config';
import type { IntrospectAndComposeOptions } from '@apollo/gateway/dist/supergraphManagers/IntrospectAndCompose';

import { LocalGraphQLDataSource } from '@apollo/gateway';
import { composeServices } from '@apollo/composition';
import {
  loadServicesFromRemoteEndpoint,
  Service,
} from '@apollo/gateway/dist/supergraphManagers/IntrospectAndCompose/loadServicesFromRemoteEndpoint';

import TypeIDDataSource from 'lib/utils/TypeIDDataSource';
import createNodeService from '../service';
import { NODE_SERVICE_NAME, NODE_SERVICE_URL } from 'lib/utils/constants';
import NoInitialSdlError from 'lib/errors/NoInitialSdlError';
import SupergraphCompositionError from 'lib/errors/SupergraphCompositionError';
import generateNodeExternalType from 'lib/utils/generateNodeExternalType';
import objectImplementsNodeInterface from 'lib/utils/objectImplementsNodeInterface';
import generateBuildService, {
  defaultBuildService,
} from 'lib/utils/generateBuildService';

export type NodeGatewayConfig = {
  nodeTypeDefs?: DocumentNode[];
  typeIDDataSource: TypeIDDataSource;
  directiveDefinitions?: DocumentNode[];
  schemaMapper?: NonNullable<SchemaMapper>;
  nodeQueryDirectives?: string | null;
};

type SupergraphSdlHookPayload = {
  supergraphSdl: string;
  cleanup?: () => Promise<void>;
};

type IntrospectAndComposeServicesSdlInput = {
  getDataSource: SupergraphSdlHookOptions['getDataSource'];
  introspectionHeaders: IntrospectAndComposeOptions['introspectionHeaders'];
  serviceSdlCache: Map<string, string>;
  subgraphs: Service[];
};

export type IntrospectAddNodeAndComposePayload = {
  buildService: GatewayConfig['buildService'];
  supergraphSdl: SupergraphSdlHook;
};

const getTypesThatImplementNodeInterface = (
  serviceDefs: ServiceDefinition[],
): Set<string> =>
  serviceDefs.reduce<Set<string>>((acc, service: ServiceDefinition) => {
    visit(service.typeDefs, {
      ObjectTypeDefinition(node) {
        const name = node.name.value;
        if (objectImplementsNodeInterface(node)) {
          acc.add(name);
        }
      },
    });
    return acc;
  }, new Set());

const getNodeExternalTypeDefs = (
  serviceDefs: ServiceDefinition[],
): DocumentNode[] => {
  const nodeTypenames = getTypesThatImplementNodeInterface(serviceDefs);
  return Array.from(nodeTypenames, name => generateNodeExternalType(name));
};

const getServiceDefinition = (
  endPoint: ServiceEndpointDefinition,
  localGraphQLDataSource: LocalGraphQLDataSource,
): ServiceDefinition => {
  const def = endPoint as ServiceDefinition;
  def.typeDefs = localGraphQLDataSource.sdl();
  return def;
};

const createSupergraphFromSubgraphList = (
  subgraphs: ServiceDefinition[],
  nodeServiceDefinition: ServiceDefinition,
): string => {
  const compositionResult = composeServices([
    ...subgraphs,
    nodeServiceDefinition,
  ]);

  if (compositionResult.errors) {
    const { errors } = compositionResult;
    throw new SupergraphCompositionError(
      `A valid schema couldn't be composed. The following composition errors were found:\n${errors
        .map(e => `\t${e.message}`)
        .join('\n')}`,
    );
  } else {
    const { supergraphSdl } = compositionResult;
    return supergraphSdl;
  }
};

const introspectExternalServices = ({
  introspectionHeaders,
  serviceSdlCache,
  subgraphs,
}: Pick<
  IntrospectAndComposeServicesSdlInput,
  'introspectionHeaders' | 'serviceSdlCache' | 'subgraphs'
>): Promise<ServiceDefinitionUpdate> =>
  loadServicesFromRemoteEndpoint({
    getServiceIntrospectionHeaders: async service => {
      return typeof introspectionHeaders === 'function'
        ? introspectionHeaders(service)
        : introspectionHeaders;
    },
    serviceList: subgraphs,
    serviceSdlCache,
  });

const introspectAndComposeSupergraphSdl = async (
  input: IntrospectAndComposeServicesSdlInput,
  nodeGatewayConfig: NodeGatewayConfig,
  setNodeServiceDataSource: (dataSource: GraphQLDataSource) => void,
): Promise<string | null> => {
  const { getDataSource } = input;
  const result = await introspectExternalServices(input);

  if (!result.isNewSchema) {
    return null;
  }

  if (!result.serviceDefinitions) {
    return null;
  }

  const nodeTypeDefs = getNodeExternalTypeDefs(result.serviceDefinitions);

  const nodeServiceConfig = {
    ...nodeGatewayConfig,
  };

  const nodeSchema = createNodeService(nodeServiceConfig, [
    ...(nodeGatewayConfig.nodeTypeDefs ?? []),
    ...nodeTypeDefs,
  ]);

  setNodeServiceDataSource(new LocalGraphQLDataSource(nodeSchema));

  const nodeServiceEndPoint = {
    name: NODE_SERVICE_NAME,
    url: NODE_SERVICE_URL,
  };

  const nodeServiceDataSource = getDataSource(
    nodeServiceEndPoint,
  ) as LocalGraphQLDataSource;

  const supergraphSdl = createSupergraphFromSubgraphList(
    result.serviceDefinitions,
    getServiceDefinition(nodeServiceEndPoint, nodeServiceDataSource),
  );

  return supergraphSdl;
};

const introspectAddNodeAndCompose: (
  nodeGatewayConfig: NodeGatewayConfig,
  introspectAndComposeOptions: Omit<
    IntrospectAndComposeOptions,
    'pollIntervalInMs'
  >,
  buildService?: GatewayConfig['buildService'],
) => IntrospectAddNodeAndComposePayload = (
  nodeGatewayConfig,
  { subgraphs, introspectionHeaders },
  buildService = defaultBuildService,
) => {
  let nodeServiceDataSource: GraphQLDataSource | undefined;
  return {
    buildService: generateBuildService(serviceDef => {
      if (
        serviceDef.name === NODE_SERVICE_NAME &&
        serviceDef.url === NODE_SERVICE_URL
      ) {
        return nodeServiceDataSource;
      }
      return undefined;
    }, buildService),
    supergraphSdl: async ({
      getDataSource,
      healthCheck,
    }: SupergraphSdlHookOptions): Promise<SupergraphSdlHookPayload> => {
      const subgraphsWithDataSource = subgraphs.map(subgraph => ({
        ...subgraph,
        dataSource: getDataSource(subgraph),
      }));

      const serviceSdlCache = new Map<string, string>();

      const composeResult = await introspectAndComposeSupergraphSdl(
        {
          getDataSource,
          introspectionHeaders,
          serviceSdlCache,
          subgraphs: subgraphsWithDataSource,
        },
        nodeGatewayConfig,
        dataSource => {
          nodeServiceDataSource = dataSource;
        },
      );

      if (!composeResult) {
        throw new NoInitialSdlError();
      }

      const supergraphSdl = composeResult;

      await healthCheck?.(supergraphSdl);

      return {
        supergraphSdl,
      };
    },
  };
};

export default introspectAddNodeAndCompose;
