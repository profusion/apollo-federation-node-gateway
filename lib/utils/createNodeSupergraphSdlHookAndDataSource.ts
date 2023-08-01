import type {
  LocalGraphQLDataSource,
  SupergraphManager,
  SupergraphSdlHook,
} from '@apollo/gateway';
import { Supergraph } from '@apollo/federation-internals';
import type { Subgraphs } from '@apollo/federation-internals';
import { compose } from '@apollo/composition';
import { createHash } from '@apollo/utils.createhash';

import type { NodeServiceConfig } from 'lib/service';

import createNodeSubgraphAndDataSource from './createNodeSubgraphAndDataSource';

type NodeSupergraphContext = Readonly<{
  dataSource: LocalGraphQLDataSource;
  supergraphSdl: string;
}>;
type MutableRef<V> = { current: V };

const emptyContext = {} as unknown as NodeSupergraphContext;

// NOTE: unfortunately we can't get the parsed Subgraphs from IntrospectAndCompose,
// then we need to parse, rebuild the schema and extract subgraphs from it
const buildSubgraphsFromSdl = (sdl: string): Subgraphs =>
  Supergraph.build(sdl, { validateSupergraph: false }).subgraphs();

// NOTE: the following code is similar to IntrospectAndCompose.createSupergraphFromSubgraphList(),
// adapted to receive Subgraphs + compose instead of ServiceDefinition[] + composeServices
const createSupergraphFromSubgraphList = (subgraphs: Subgraphs): string => {
  const compositionResult = compose(subgraphs);
  /* istanbul ignore if: this is the same as IntrospectAndCompose and we shouldn't reach it anyways */
  if (compositionResult.errors) {
    const { errors } = compositionResult;
    throw new Error(
      `A valid schema couldn't be composed. The following composition errors were found:\n${errors
        .map(e => `\t${e.message}`)
        .join('\n')}`,
    );
  } else {
    const { supergraphSdl } = compositionResult;
    return supergraphSdl;
  }
};

// NOTE: same as ApolloGateway.getIdForSupergraphSdl()
const getIdForSupergraphSdl = (supergraphSdl: string): string =>
  createHash('sha256').update(supergraphSdl).digest('hex');

const composeNodeSupergraph = (
  servicesSupergraphSdl: string,
  nodeServiceConfig: NodeServiceConfig,
): NodeSupergraphContext => {
  const subgraphs = buildSubgraphsFromSdl(servicesSupergraphSdl);
  const [subgraph, dataSource] = createNodeSubgraphAndDataSource(
    nodeServiceConfig,
    subgraphs.values(),
    getIdForSupergraphSdl(servicesSupergraphSdl),
  );
  subgraphs.add(subgraph);

  const supergraphSdl = createSupergraphFromSubgraphList(subgraphs);

  return { dataSource, supergraphSdl };
};

const createNodeSupergraphSdlHook = (
  supergraphManager: SupergraphManager,
  nodeServiceConfig: NodeServiceConfig,
  context: MutableRef<NodeSupergraphContext>,
): SupergraphSdlHook => {
  const updateSdlFromServices = (servicesSupergraphSdl: string): string => {
    context.current = composeNodeSupergraph(
      servicesSupergraphSdl,
      nodeServiceConfig,
    );
    return context.current.supergraphSdl;
  };

  return async ({ update, ...options }): ReturnType<SupergraphSdlHook> => {
    const { cleanup, supergraphSdl: servicesSupergraphSdl } =
      await supergraphManager.initialize({
        ...options,
        update: (sdl: string) => update(updateSdlFromServices(sdl)),
      });

    return {
      cleanup,
      supergraphSdl: updateSdlFromServices(servicesSupergraphSdl),
    };
  };
};

const createNodeSupergraphSdlHookAndDataSource = (
  nodeServiceConfig: NodeServiceConfig,
  supergraphManager: SupergraphManager,
): {
  getNodeDataSource: () => LocalGraphQLDataSource;
  supergraphSdlHook: SupergraphSdlHook;
} => {
  const context: MutableRef<NodeSupergraphContext> = { current: emptyContext };

  return {
    getNodeDataSource: (): LocalGraphQLDataSource => context.current.dataSource,
    supergraphSdlHook: createNodeSupergraphSdlHook(
      supergraphManager,
      nodeServiceConfig,
      context,
    ),
  };
};

export default createNodeSupergraphSdlHookAndDataSource;
