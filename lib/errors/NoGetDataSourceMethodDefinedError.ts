import NamedError from './NamedError';

export default class NoGetDataSourceMethodDefinedError extends NamedError {
  static readonly message = 'Method getDataSource not defined';
}
