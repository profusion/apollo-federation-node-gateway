import { ObjectTypeDefinitionNode } from 'graphql';

const objectImplementsNodeInterface = (
  node: ObjectTypeDefinitionNode,
): boolean =>
  node.interfaces?.some(({ name }): boolean => name.value === 'Node') || false;

export default objectImplementsNodeInterface;
