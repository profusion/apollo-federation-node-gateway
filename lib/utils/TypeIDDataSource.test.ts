import TypeIDDataSource from './TypeIDDataSource';

const typeIds = { Post: '1', User: '2' };

describe('TypeIDDataSource.toId', () => {
  it('encodes strings', () => {
    const dataSouce = new TypeIDDataSource(typeIds);
    expect(dataSouce.toId('Post', 'xpto')).toBe('MQp4cHRv');
  });

  it('encodes numbers', () => {
    const dataSouce = new TypeIDDataSource(typeIds);
    expect(dataSouce.toId('User', 123)).toBe('MgoxMjM=');
  });

  it('encoding throws on unknown typename', () => {
    const dataSouce = new TypeIDDataSource(typeIds);
    expect(() => dataSouce.toId('Bug', 123)).toThrow();
  });
});

describe('TypeIDDataSource.fromId', () => {
  it('decodes strings', () => {
    const dataSouce = new TypeIDDataSource(typeIds);
    expect(dataSouce.fromId('MQp4cHRv')).toEqual(['Post', 'xpto']);
  });

  it('decodes numbers (as strings)', () => {
    const dataSouce = new TypeIDDataSource(typeIds);
    expect(dataSouce.fromId('MgoxMjM=')).toEqual(['User', '123']);
  });

  it('decodes throws on unknown typename', () => {
    const dataSouce = new TypeIDDataSource(typeIds);
    expect(() => dataSouce.fromId('bug')).toThrow();
  });
});
