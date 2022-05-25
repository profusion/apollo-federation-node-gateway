import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';

const generateNodeExternalType = (name: string): DocumentNode =>
  gql`
    extend type ${name} implements Node @key(fields: "id") {
      id: ID! @external
    }
  `;
export default generateNodeExternalType;
