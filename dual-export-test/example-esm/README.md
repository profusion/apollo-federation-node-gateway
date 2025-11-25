# Apollo Federation Node Gateway — Example

This example shows a small Apollo gateway (running on port 4000) that composes two subgraphs:

- users service (port 4001)
- posts service (port 4002)

The example uses the Node interface and helper utilities from `@profusion/apollo-federation-node-gateway` and a shared `TypeIDDataSource` to encode/decode IDs.

## Quick start

Requirements: Node.js (16+), Yarn (used by this project).

From the `example/` folder run:

```bash
yarn install
```

Before starting the gateway, start the subgraph services. The subgraph services are in `src/services/users.ts` and `src/services/posts.ts` — run them in separate terminals using Yarn and `ts-node`:

```bash
# in one terminal (users)
yarn ts-node src/services/users.ts

# in another terminal (posts)
yarn ts-node src/services/posts.ts

# after both services are running, start the gateway
yarn start
```

Server endpoints started by the example:

- Gateway: http://localhost:4000/graphql
- Users subgraph: http://localhost:4001/graphql
- Posts subgraph: http://localhost:4002/graphql

## Example GraphQL queries

Below are example queries you can run against the gateway (`http://localhost:4000/graphql`).

- Fetch all users and their last post:

```graphql
query Users {
  users {
    id
    username
    lastPost {
      id
    }
  }
}
```

- Fetch all posts with author info:

```graphql
query Posts {
  posts {
    id
    title
    body
    author {
      id
      username
    }
  }
}
```

- Use the Node interface to fetch a single entity by node id. The example project encodes type IDs via `TypeIDDataSource`.

Example Node query (replace the id with one returned from the `users` or `posts` lists above):

```graphql
query NodeQuery($id: ID!) {
	node(id: $id) {
    __typename
		id
		... on User {
      username
		}
		... on Post {
			title
			body
		}
	}
}
```

Variables

```json
{
	"id": "<PASTE_NODE_ID_HERE>"
}
```

## HTTP requests

Below are example request bodies and descriptions you can paste into any client like [Postman](https://www.postman.com/) or [Bruno](https://www.usebruno.com/) (use POST to the GraphQL endpoint).

1) Get users with last post

POST http://localhost:4000/graphql

Headers:

- Content-Type: application/json

Body (raw JSON):

```json
{
  "query": "query GetUsersWithLastPost { users { id username lastPost { id } } }"
}
```

2) Get posts with author

POST http://localhost:4000/graphql

Headers:

- Content-Type: application/json

Body (raw JSON):

```json
{
	"query": "query GetPostsWithAuthor { posts { id title body author { id username } } }"
}
```

3) Node query (GraphQL + variables)

POST http://localhost:4000/graphql

Headers:

- Content-Type: application/json

Body (raw JSON):

```json
{
	"query": "query NodeQuery($id: ID!) { node(id: $id) { id ... on User { username } ... on Post { title body } } }",
	"variables": { "id": "<PASTE_NODE_ID_HERE>" }
}
```

Tip: When you run `users` or `posts` queries the example services return encoded node IDs using `TypeIDDataSource` (for example `VXNlcjox`-style ids). Use one of those values in the Node query variables.

## Using the Node interface programmatically

If you are using the `@profusion/apollo-federation-node-gateway` library directly in Node code, the example shows how to use `createNodeResolver` and `nodeInterface` in your subgraphs and `NodeGateway` to wire the gateway.

Key pieces from the example:

- `src/typeIDDataSource.ts` — creates a `TypeIDDataSource` with per-type prefixes.
- `src/services/users.ts` and `src/services/posts.ts` — each subgraph uses `createNodeResolver(typeIDDataSource)` to provide Node resolution helpers and includes the `nodeInterface` typeDefs.
- `src/index.ts` — creates `new NodeGateway({ typeIDDataSource }, { supergraphSdl: new IntrospectAndCompose({ subgraphs: [...] }) })` and passes it to `ApolloServer` as `gateway`.

## Troubleshooting

- If the gateway can't reach the subgraphs, ensure the subgraphs are running on ports 4001 and 4002 and that any firewall or proxy allows local connections.
- If you see unexpected IDs, the example uses `TypeIDDataSource` to encode ids; inspect `src/typeIDDataSource.ts` for the configured prefixes.
