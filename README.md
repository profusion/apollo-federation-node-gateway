# @profusion/apollo-federation-node-gateway

`@profusion/apollo-federation-node-gateway` is a TypeScript library that helps you implement global object identification in GraphQL, following the [Global Object Identification](https://graphql.org/learn/global-object-identification/) specification. It provides a custom Apollo Gateway for Apollo Federation, along with utilities and helpers to simplify the creation and management of federated GraphQL services using Node.js.

The library includes tools for working with type-safe node IDs, schema mapping, and subgraph integration.

## Features

- A `NodeGateway` tailored for Apollo Federation that integrates Node-style global object identification.
- Helpers to create Node resolvers for subgraphs: `createNodeResolver` and `nodeInterface`.
- `TypeIDDataSource` for per-type encoding/decoding of IDs shared between gateway and subgraphs.
- Small utilities to make composing federated services and resolving entities easier.

## Installation

Install the package from npm:

```bash
yarn add @profusion/apollo-federation-node-gateway
# or
npm install @profusion/apollo-federation-node-gateway
```

This project expects a GraphQL peer dependency (see `package.json` for the supported `graphql` version range).

## Example

This repository contains a runnable example (gateway + two subgraphs). For full details and ready-to-run GraphQL examples see the example README:

[`example/README.md`](example/README.md)

## Basic usage

Below is a minimal conceptual snippet showing how the pieces fit together. The example app in `example/src` is a complete working reference.

```ts
import { NodeGateway, createNodeResolver, nodeInterface, TypeIDDataSource } from '@profusion/apollo-federation-node-gateway';
import { ApolloServer } from '@apollo/server';

// create a TypeIDDataSource mapping for types -> prefixes (example values)
const typeIDDataSource = new TypeIDDataSource({ Post: '1', User: '2' });

// In each subgraph you can use `createNodeResolver(typeIDDataSource)` to provide Node resolvers
// and include `nodeInterface` in your type definitions.

// Create a gateway that understands and uses the TypeIDDataSource:
const gateway = new NodeGateway({ typeIDDataSource }, { /* gateway options, e.g. supergraphSdl */ });

const server = new ApolloServer({ gateway });

// Start the server as normal with Apollo Server's starter utilities.
```

### Notes on the API surface

- NodeGateway: custom gateway implementation that plugs into Apollo Server and understands the Node interface and TypeIDDataSource integration.
- createNodeResolver(typeIDDataSource): returns resolver helpers to be spread into a subgraph's resolvers so the Node interface and reference resolution works uniformly.
- nodeInterface: a type definition fragment you include in your subgraphs to expose the Node interface and the `node(id: ID!): Node` entry point.
- TypeIDDataSource: a small data source class that encodes/decodes IDs consistently between gateway and subgraphs.

For detailed signatures and options consult the TypeScript declaration file at `build/lib/index.d.ts` after building the package.

## Contributing

Contributions, issues and feature requests are welcome. Please follow the repository contributing guidelines and coding standards. Typical workflow:

1. Fork the repo
2. Create a feature branch
3. Run tests and linters
4. Open a pull request with a clear description of your change

### Scripts

Useful scripts available in the package (see `package.json`):

- `yarn build` — run lint and TypeScript compile
- `yarn test` — run the test suite
- `yarn run-lint` — run ESLint

## License

MIT — see the [LICENSE file](LICENSE) for details.
