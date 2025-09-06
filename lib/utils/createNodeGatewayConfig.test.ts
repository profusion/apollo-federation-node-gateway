import {
  LocalGraphQLDataSource,
  RemoteGraphQLDataSource,
  SupergraphSdlHook,
} from '@apollo/gateway';
import type { SupergraphSdlHookGatewayConfig } from '@apollo/gateway/dist/config';
import gql from 'graphql-tag';

import { createNodeServiceEndPoint } from './constants';

import createNodeGatewayConfig from './createNodeGatewayConfig';
import TypeIDDataSource from './TypeIDDataSource';

const nodeServiceConfig = {
  typeIDDataSource: new TypeIDDataSource({ Post: '1', User: '2' }),
};

// actual SDL produced by our newman test:
const servicesSupergraphSdl = `\
schema
  @link(url: "https://specs.apollo.dev/link/v1.0")
  @link(url: "https://specs.apollo.dev/join/v0.3", for: EXECUTION)
{
  query: Query
}

directive @join__enumValue(graph: join__Graph!) repeatable on ENUM_VALUE

directive @join__field(graph: join__Graph, requires: join__FieldSet, provides: join__FieldSet, type: String, external: Boolean, override: String, usedOverridden: Boolean) repeatable on FIELD_DEFINITION | INPUT_FIELD_DEFINITION

directive @join__graph(name: String!, url: String!) on ENUM_VALUE

directive @join__implements(graph: join__Graph!, interface: String!) repeatable on OBJECT | INTERFACE

directive @join__type(graph: join__Graph!, key: join__FieldSet, extension: Boolean! = false, resolvable: Boolean! = true, isInterfaceObject: Boolean! = false) repeatable on OBJECT | INTERFACE | UNION | ENUM | INPUT_OBJECT | SCALAR

directive @join__unionMember(graph: join__Graph!, member: String!) repeatable on UNION

directive @link(url: String, as: String, for: link__Purpose, import: [link__Import]) repeatable on SCHEMA

type Book
  @join__type(graph: BOOK)
{
  id: ID!
  name: String!
}

scalar join__FieldSet

enum join__Graph {
  BOOK @join__graph(name: "book", url: "http://localhost:4003/graphql")
  POST @join__graph(name: "post", url: "http://localhost:4002/graphql")
  USER @join__graph(name: "user", url: "http://localhost:4001/graphql")
}

scalar link__Import

enum link__Purpose {
  """
  \`SECURITY\` features provide metadata necessary to securely resolve fields.
  """
  SECURITY

  """
  \`EXECUTION\` features provide metadata necessary for operation execution.
  """
  EXECUTION
}

interface Node
  @join__type(graph: POST)
  @join__type(graph: USER)
{
  id: ID!
}

type Post implements Node
  @join__implements(graph: POST, interface: "Node")
  @join__type(graph: POST, key: "id")
{
  id: ID!
  name: String!
}

type Query
  @join__type(graph: BOOK)
  @join__type(graph: POST)
  @join__type(graph: USER)
{
  books: [Book!]! @join__field(graph: BOOK)
}

type User implements Node
  @join__implements(graph: USER, interface: "Node")
  @join__type(graph: USER, key: "id")
{
  id: ID!
  name: String!
}`;

const supergraphSdl = `\
schema
  @link(url: "https://specs.apollo.dev/link/v1.0")
  @link(url: "https://specs.apollo.dev/join/v0.5", for: EXECUTION)
{
  query: Query
}

directive @join__directive(graphs: [join__Graph!], name: String!, args: join__DirectiveArguments) repeatable on SCHEMA | OBJECT | INTERFACE | FIELD_DEFINITION

directive @join__enumValue(graph: join__Graph!) repeatable on ENUM_VALUE

directive @join__field(graph: join__Graph, requires: join__FieldSet, provides: join__FieldSet, type: String, external: Boolean, override: String, usedOverridden: Boolean, overrideLabel: String, contextArguments: [join__ContextArgument!]) repeatable on FIELD_DEFINITION | INPUT_FIELD_DEFINITION

directive @join__graph(name: String!, url: String!) on ENUM_VALUE

directive @join__implements(graph: join__Graph!, interface: String!) repeatable on OBJECT | INTERFACE

directive @join__type(graph: join__Graph!, key: join__FieldSet, extension: Boolean! = false, resolvable: Boolean! = true, isInterfaceObject: Boolean! = false) repeatable on OBJECT | INTERFACE | UNION | ENUM | INPUT_OBJECT | SCALAR

directive @join__unionMember(graph: join__Graph!, member: String!) repeatable on UNION

directive @link(url: String, as: String, for: link__Purpose, import: [link__Import]) repeatable on SCHEMA

type Book
  @join__type(graph: BOOK)
{
  id: ID!
  name: String!
}

input join__ContextArgument {
  name: String!
  type: String!
  context: String!
  selection: join__FieldValue!
}

scalar join__DirectiveArguments

scalar join__FieldSet

scalar join__FieldValue

enum join__Graph {
  NODESERVICE @join__graph(name: "NodeService", url: "node-url/3d1c5319f5a8c5cf005b8bdaf1fce8164ff6364efe185973d4b3c9156fa0843a")
  BOOK @join__graph(name: "book", url: "http://localhost:4003/graphql")
  POST @join__graph(name: "post", url: "http://localhost:4002/graphql")
  USER @join__graph(name: "user", url: "http://localhost:4001/graphql")
}

scalar link__Import

enum link__Purpose {
  """
  \`SECURITY\` features provide metadata necessary to securely resolve fields.
  """
  SECURITY

  """
  \`EXECUTION\` features provide metadata necessary for operation execution.
  """
  EXECUTION
}

interface Node
  @join__type(graph: NODESERVICE)
  @join__type(graph: POST)
  @join__type(graph: USER)
{
  id: ID!
}

type Post implements Node
  @join__implements(graph: NODESERVICE, interface: "Node")
  @join__implements(graph: POST, interface: "Node")
  @join__type(graph: NODESERVICE, key: "id")
  @join__type(graph: POST, key: "id")
{
  id: ID!
  name: String! @join__field(graph: POST)
}

type Query
  @join__type(graph: NODESERVICE)
  @join__type(graph: BOOK)
  @join__type(graph: POST)
  @join__type(graph: USER)
{
  node(id: ID!): Node @join__field(graph: NODESERVICE)
  books: [Book!]! @join__field(graph: BOOK)
}

type User implements Node
  @join__implements(graph: NODESERVICE, interface: "Node")
  @join__implements(graph: USER, interface: "Node")
  @join__type(graph: NODESERVICE, key: "id")
  @join__type(graph: USER, key: "id")
{
  id: ID!
  name: String! @join__field(graph: USER)
}`;

const testCommonConfig = async (
  config: SupergraphSdlHookGatewayConfig,
): Promise<void> => {
  await expect(
    config.supergraphSdl({
      getDataSource: jest.fn(),
      healthCheck: jest.fn(),
      update: jest.fn(),
    }),
  ).resolves.toEqual({
    cleanup: undefined,
    supergraphSdl,
  });
  expect(config.buildService?.(createNodeServiceEndPoint('id'))).toBeInstanceOf(
    LocalGraphQLDataSource,
  );
  expect(config.buildService?.({ name: 'other', url: 'other' })).toBeInstanceOf(
    RemoteGraphQLDataSource,
  );
};

describe('createNodeGatewayConfig', () => {
  jest.useFakeTimers();

  it('works with static supergraphSdl', async () => {
    const config = createNodeGatewayConfig(nodeServiceConfig, {
      supergraphSdl: servicesSupergraphSdl,
    });
    await testCommonConfig(config);
  });

  it('works with supergraphSdl as hook', async () => {
    const config = createNodeGatewayConfig(nodeServiceConfig, {
      supergraphSdl: () =>
        Promise.resolve({
          cleanup: undefined,
          supergraphSdl: servicesSupergraphSdl,
        }),
    });
    await testCommonConfig(config);
  });

  it('works with supergraphSdl as manager', async () => {
    const config = createNodeGatewayConfig(nodeServiceConfig, {
      supergraphSdl: {
        initialize: (): ReturnType<SupergraphSdlHook> =>
          Promise.resolve({
            cleanup: undefined,
            supergraphSdl: servicesSupergraphSdl,
          }),
      },
    });
    await testCommonConfig(config);
  });

  it('throws if supergraphSdl is missing', () => {
    expect(() => createNodeGatewayConfig(nodeServiceConfig, {})).toThrow(
      'Provide GatewayConfig with supergraphSdl property',
    );
  });

  it('respects custom nodeServiceConfig.typeDefs', async () => {
    const config = createNodeGatewayConfig(
      {
        ...nodeServiceConfig,
        typeDefs: [
          gql`
            type FindMeHere {
              f: Int
            }
          `,
        ],
      },
      {
        supergraphSdl: servicesSupergraphSdl,
      },
    );
    const { cleanup, supergraphSdl: result } = await config.supergraphSdl({
      getDataSource: jest.fn(),
      healthCheck: jest.fn(),
      update: jest.fn(),
    });
    expect(cleanup).toBeUndefined();
    expect(result).toContain('type FindMeHere');
  });

  it('handles update removing Book from schema', async () => {
    const timeoutInMs = 100;
    const config = createNodeGatewayConfig(nodeServiceConfig, {
      supergraphSdl: ({ update }): ReturnType<SupergraphSdlHook> => {
        const timeoutId = setTimeout(() => {
          update(`\
schema
  @link(url: "https://specs.apollo.dev/link/v1.0")
  @link(url: "https://specs.apollo.dev/join/v0.3", for: EXECUTION)
{
  query: Query
}

directive @join__enumValue(graph: join__Graph!) repeatable on ENUM_VALUE

directive @join__field(graph: join__Graph, requires: join__FieldSet, provides: join__FieldSet, type: String, external: Boolean, override: String, usedOverridden: Boolean) repeatable on FIELD_DEFINITION | INPUT_FIELD_DEFINITION

directive @join__graph(name: String!, url: String!) on ENUM_VALUE

directive @join__implements(graph: join__Graph!, interface: String!) repeatable on OBJECT | INTERFACE

directive @join__type(graph: join__Graph!, key: join__FieldSet, extension: Boolean! = false, resolvable: Boolean! = true, isInterfaceObject: Boolean! = false) repeatable on OBJECT | INTERFACE | UNION | ENUM | INPUT_OBJECT | SCALAR

directive @join__unionMember(graph: join__Graph!, member: String!) repeatable on UNION

directive @link(url: String, as: String, for: link__Purpose, import: [link__Import]) repeatable on SCHEMA

scalar join__FieldSet

enum join__Graph {
  POST @join__graph(name: "post", url: "http://localhost:4002/graphql")
  USER @join__graph(name: "user", url: "http://localhost:4001/graphql")
}

scalar link__Import

enum link__Purpose {
  """
  \`SECURITY\` features provide metadata necessary to securely resolve fields.
  """
  SECURITY

  """
  \`EXECUTION\` features provide metadata necessary for operation execution.
  """
  EXECUTION
}

interface Node
  @join__type(graph: POST)
  @join__type(graph: USER)
{
  id: ID!
}

type Post implements Node
  @join__implements(graph: POST, interface: "Node")
  @join__type(graph: POST, key: "id")
{
  id: ID!
  name: String!
}

type Query
  @join__type(graph: POST)
  @join__type(graph: USER)
{
  user: User
}

type User implements Node
  @join__implements(graph: USER, interface: "Node")
  @join__type(graph: USER, key: "id")
  @join__type(graph: POST, key: "id")
{
  id: ID!
  name: String!
}`);
        }, timeoutInMs);
        return Promise.resolve({
          cleanup: (): Promise<void> => {
            clearTimeout(timeoutId);
            return Promise.resolve();
          },
          supergraphSdl: servicesSupergraphSdl,
        });
      },
    });

    const sdlOptions = {
      getDataSource: jest.fn(),
      healthCheck: jest.fn(),
      update: jest.fn(),
    };
    const { cleanup, supergraphSdl: result } = await config.supergraphSdl(
      sdlOptions,
    );
    expect(cleanup).toBeDefined();
    expect(result).toBe(supergraphSdl);
    expect(sdlOptions.update).not.toBeCalled();

    jest.advanceTimersByTime(timeoutInMs);

    // new schema without Book and with Query.user
    expect(sdlOptions.update).toBeCalledWith(`\
schema
  @link(url: "https://specs.apollo.dev/link/v1.0")
  @link(url: "https://specs.apollo.dev/join/v0.5", for: EXECUTION)
{
  query: Query
}

directive @join__directive(graphs: [join__Graph!], name: String!, args: join__DirectiveArguments) repeatable on SCHEMA | OBJECT | INTERFACE | FIELD_DEFINITION

directive @join__enumValue(graph: join__Graph!) repeatable on ENUM_VALUE

directive @join__field(graph: join__Graph, requires: join__FieldSet, provides: join__FieldSet, type: String, external: Boolean, override: String, usedOverridden: Boolean, overrideLabel: String, contextArguments: [join__ContextArgument!]) repeatable on FIELD_DEFINITION | INPUT_FIELD_DEFINITION

directive @join__graph(name: String!, url: String!) on ENUM_VALUE

directive @join__implements(graph: join__Graph!, interface: String!) repeatable on OBJECT | INTERFACE

directive @join__type(graph: join__Graph!, key: join__FieldSet, extension: Boolean! = false, resolvable: Boolean! = true, isInterfaceObject: Boolean! = false) repeatable on OBJECT | INTERFACE | UNION | ENUM | INPUT_OBJECT | SCALAR

directive @join__unionMember(graph: join__Graph!, member: String!) repeatable on UNION

directive @link(url: String, as: String, for: link__Purpose, import: [link__Import]) repeatable on SCHEMA

input join__ContextArgument {
  name: String!
  type: String!
  context: String!
  selection: join__FieldValue!
}

scalar join__DirectiveArguments

scalar join__FieldSet

scalar join__FieldValue

enum join__Graph {
  NODESERVICE @join__graph(name: "NodeService", url: "node-url/30cd99f094471afd1a723ff4db537fae9acffcd06e5d41944db644398e970d12")
  POST @join__graph(name: "post", url: "http://localhost:4002/graphql")
  USER @join__graph(name: "user", url: "http://localhost:4001/graphql")
}

scalar link__Import

enum link__Purpose {
  """
  \`SECURITY\` features provide metadata necessary to securely resolve fields.
  """
  SECURITY

  """
  \`EXECUTION\` features provide metadata necessary for operation execution.
  """
  EXECUTION
}

interface Node
  @join__type(graph: NODESERVICE)
  @join__type(graph: POST)
  @join__type(graph: USER)
{
  id: ID!
}

type Post implements Node
  @join__implements(graph: NODESERVICE, interface: "Node")
  @join__implements(graph: POST, interface: "Node")
  @join__type(graph: NODESERVICE, key: "id")
  @join__type(graph: POST, key: "id")
{
  id: ID!
  name: String! @join__field(graph: POST)
}

type Query
  @join__type(graph: NODESERVICE)
  @join__type(graph: POST)
  @join__type(graph: USER)
{
  node(id: ID!): Node @join__field(graph: NODESERVICE)
  user: User @join__field(graph: POST) @join__field(graph: USER)
}

type User implements Node
  @join__implements(graph: NODESERVICE, interface: "Node")
  @join__implements(graph: USER, interface: "Node")
  @join__type(graph: NODESERVICE, key: "id")
  @join__type(graph: POST, key: "id")
  @join__type(graph: USER, key: "id")
{
  id: ID!
  name: String! @join__field(graph: POST) @join__field(graph: USER)
}`);

    cleanup?.();
  });
});
