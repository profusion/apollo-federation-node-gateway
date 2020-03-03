import resolvers from '@service/resolvers';
import { createNodeQuery, NodeInterface } from '@service/schemas';
import selfNodeId from '@directives/SelfNodeIdDirectiveVisitor';

const { createNodeResolver } = resolvers;

export { createNodeResolver, createNodeQuery, NodeInterface };
export { default as NodeGateway } from '@gateway/NodeGateway';
export { default as TypeIDDataSource } from '@utils/TypeIDDataSource';

export const directives = {
  selfNodeId,
};
