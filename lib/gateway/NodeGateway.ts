import {
  ApolloGateway,
  GatewayConfig,
  LocalGraphQLDataSource,
  GraphQLDataSource,
  ServiceEndpointDefinition,
  RemoteGraphQLDataSource,
} from '@apollo/gateway';
import { ServiceDefinition } from '@apollo/federation';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import gql from 'graphql-tag';
import {
  DocumentNode,
  graphql,
  GraphQLSchema,
  ObjectTypeDefinitionNode,
  parse,
  visit,
} from 'graphql';

import createNodeService from '@service';
import TypeIDDataSource from '@utils/TypeIDDataSource';

interface NodeGatewayConfig {
  typeIDDataSource: TypeIDDataSource;
  directiveResolvers?: {
    [name: string]: typeof SchemaDirectiveVisitor;
  };
  directiveTypeDefs?: DocumentNode | DocumentNode[];
  nodeQueryDirectives?: string | null;
}

export default class NodeGateway extends ApolloGateway {
  private static isNodeInterface = (node: ObjectTypeDefinitionNode): boolean =>
    node.interfaces?.some(({ name }): boolean => name.value === 'Node') ||
    false;

  private static generateNodeType = (name: string): DocumentNode =>
    gql`
    extend type ${name} implements Node @key(fields: "id") {
      id: ID! @external
    }
  `;

  private nodeGatewayConfig: NodeGatewayConfig;

  constructor(nodeGatewayConfig: NodeGatewayConfig, config?: GatewayConfig) {
    const { buildService: oldBuildService } = config || {};
    const buildService = (
      serviceDef: ServiceEndpointDefinition & { schema?: GraphQLSchema },
    ): GraphQLDataSource => {
      const { schema } = serviceDef;
      if (schema) return new LocalGraphQLDataSource(schema);
      return oldBuildService
        ? oldBuildService(serviceDef)
        : new RemoteGraphQLDataSource(serviceDef);
    };
    super({ ...config, buildService });
    this.nodeGatewayConfig = nodeGatewayConfig;
  }

  protected async loadServiceDefinitions(
    config: GatewayConfig,
  ): ReturnType<ApolloGateway['loadServiceDefinitions']> {
    const defs = await super.loadServiceDefinitions(config);
    const nodeTypeDefs: DocumentNode[] = [];
    const seenNodeTypes = new Set<string>();
    if (!defs.serviceDefinitions) {
      return defs;
    }
    defs.serviceDefinitions.forEach((service: ServiceDefinition): void => {
      visit(service.typeDefs, {
        ObjectTypeDefinition(node) {
          const name = node.name.value;
          if (seenNodeTypes.has(name) || !NodeGateway.isNodeInterface(node)) {
            return;
          }
          nodeTypeDefs.push(NodeGateway.generateNodeType(name));
          seenNodeTypes.add(name);
        },
      });
    });
    if (!nodeTypeDefs.length) {
      return defs;
    }
    const {
      directiveResolvers,
      directiveTypeDefs = [],
      nodeQueryDirectives,
      typeIDDataSource,
    } = this.nodeGatewayConfig;
    const externalTypeDefs = Array.isArray(directiveTypeDefs)
      ? directiveTypeDefs
      : [directiveTypeDefs];
    const schema = createNodeService(
      typeIDDataSource,
      nodeQueryDirectives,
      directiveResolvers,
      [...nodeTypeDefs, ...externalTypeDefs],
    );
    const res = await graphql({
      schema,
      source: 'query { _service { sdl } }',
    });

    if (!res.data) {
      throw new Error('Could not fetch service definition');
    }

    defs.serviceDefinitions.push(({
      name: 'node',
      schema,
      // eslint-disable-next-line no-underscore-dangle
      typeDefs: parse(res.data._service.sdl),
      // leave this in here so apollo does not complain about missing URL
      url: 'node-url',
      // cast to ServiceDefinition, since the 'schema' field is not expected
    } as unknown) as ServiceDefinition);

    return defs;
  }
}
