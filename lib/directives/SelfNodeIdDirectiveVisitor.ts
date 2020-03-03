// eslint-disable-next-line filenames/match-exported
import {
  defaultFieldResolver,
  DirectiveLocation,
  GraphQLField,
  GraphQLFieldResolver,
  GraphQLInterfaceType,
  GraphQLObjectType,
} from 'graphql';

import { EasyDirectiveVisitor } from '@profusion/apollo-validation-directives';

import TypeIDDataSource from '@utils/TypeIDDataSource';

type ResolverArgs<TContext extends object = object> = Parameters<
  GraphQLFieldResolver<unknown, TContext>
>;

export type SelfNodeIdContext = {
  typeIDDataSource: TypeIDDataSource;
};

export class SelfNodeIdDirectiveVisitor<
  TContext extends SelfNodeIdContext
> extends EasyDirectiveVisitor<{}> {
  public errorMessage = 'Unauthenticated';

  public static readonly config: typeof EasyDirectiveVisitor['config'] = {
    description: 'ensures is authenticated before calling the resolver',
    locations: [DirectiveLocation.FIELD_DEFINITION],
  };

  public static readonly defaultName: string = 'selfNodeId';

  public static createDirectiveContext(
    selfNodeIdContext: SelfNodeIdContext,
  ): SelfNodeIdContext {
    return {
      ...selfNodeIdContext,
    };
  }

  public visitFieldDefinition(
    field: GraphQLField<unknown, TContext>,
    {
      objectType: { name },
    }: { objectType: GraphQLObjectType | GraphQLInterfaceType },
  ): void {
    const { resolve = defaultFieldResolver } = field;

    // eslint-disable-next-line no-param-reassign
    field.resolve = async function(...args): Promise<unknown> {
      const { typeIDDataSource } = args[2];
      const result = await resolve.apply(this, args);
      return typeIDDataSource.toId(name, result);
    };
  }
}

export default SelfNodeIdDirectiveVisitor;
