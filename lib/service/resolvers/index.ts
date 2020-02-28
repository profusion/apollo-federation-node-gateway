import TypeIDDataSource from '@utils/TypeIDDataSource';

export interface Node {
  id: string;
}

export interface NodeResolveType {
  Node: {
    __resolveType(node: Node): string;
  };
}

export interface NodeQueryResolver {
  Query: {
    node(...args: unknown[]): Node;
  };
}

export interface ResolverType {
  createNodeResolver(idDataSource: TypeIDDataSource): NodeResolveType;
  queryResolver: NodeQueryResolver;
}

const resolvers: ResolverType = {
  createNodeResolver: (idDataSource: TypeIDDataSource): NodeResolveType => ({
    Node: {
      __resolveType: ({ id }: Node): string => idDataSource.fromId(id)[0],
    },
  }),
  queryResolver: {
    Query: {
      // proxy to __resolveType
      node: (_: unknown, node: Node, ...__: unknown[]): Node => node,
    },
  },
};

export default resolvers;
