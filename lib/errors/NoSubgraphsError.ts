import NamedError from './NamedError';

export default class NoSubgraphsError extends NamedError {
  static readonly message = 'No subgraphs found';
}
