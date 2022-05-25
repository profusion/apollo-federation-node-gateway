import { DocumentNode } from 'graphql';
import { LocalGraphQLDataSource } from '@apollo/gateway';
import type { Subgraph } from '@apollo/federation-internals';
import gql from 'graphql-tag';

import { buildSubgraph, isObjectType } from '@apollo/federation-internals';

import createNodeService from 'lib/service';
import type { NodeServiceConfig } from 'lib/service';

import { createNodeServiceEndPoint } from './constants';

const createNodeExternalType = (name: string): DocumentNode =>
  gql`
    extend type ${name} implements Node @key(fields: "id") {
      id: ID! @external
    }
  `;

const getTypesImplementingNode = (
  subgraphs: readonly Subgraph[],
): Set<string> =>
  subgraphs.reduce<Set<string>>(
    (names, subgraph) =>
      subgraph.schema.types().reduce<Set<string>>((acc, type) => {
        if (isObjectType(type) && type.interfaceImplementation('Node')) {
          acc.add(type.name);
        }
        return acc;
      }, names),
    new Set(),
  );

const getNodeExternalTypeDefs = (
  subgraphs: readonly Subgraph[],
): DocumentNode[] =>
  Array.from(getTypesImplementingNode(subgraphs), name =>
    createNodeExternalType(name),
  );

const createNodeSubgraphAndDataSource = (
  nodeServiceConfig: NodeServiceConfig,
  servicesSubgraphs: readonly Subgraph[],
  sdlId: string,
): [Subgraph, LocalGraphQLDataSource] => {
  const typeDefs = getNodeExternalTypeDefs(servicesSubgraphs);
  const schema = createNodeService({
    ...nodeServiceConfig,
    typeDefs: nodeServiceConfig.typeDefs
      ? nodeServiceConfig.typeDefs.concat(typeDefs)
      : typeDefs,
  });
  const dataSource = new LocalGraphQLDataSource(schema);
  const sdl = dataSource.sdl();
  const serviceDef = createNodeServiceEndPoint(sdlId);
  const subgraph = buildSubgraph(serviceDef.name, serviceDef.url, sdl);
  return [subgraph, dataSource];
};

export default createNodeSubgraphAndDataSource;
