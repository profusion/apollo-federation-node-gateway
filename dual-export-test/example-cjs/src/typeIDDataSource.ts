const {
  TypeIDDataSource,
} = require('@profusion/apollo-federation-node-gateway');

module.exports = new TypeIDDataSource({ Post: '1', User: '2' });
