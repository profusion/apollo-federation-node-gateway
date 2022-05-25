import NamedError from './NamedError';

export default class NoInitialSdlError extends NamedError {
  static readonly message = 'No initial Sdl';
}
