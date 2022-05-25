export default class NamedError extends Error {
  static readonly message: string = '';

  constructor(message?: string) {
    super(message || new.target.message);
    this.name = new.target.name;
  }
}
