interface TypeIds {
  [key: string]: string | number;
}

interface TypeNameFromId {
  [key: string]: string;
}

export default class TypeIDDataSource {
  private static base64encode = (data: string): string =>
    Buffer.from(data).toString('base64');

  private static base64decode = (data: string): string =>
    Buffer.from(data, 'base64').toString('utf8');

  private typeIds: TypeIds;

  private static delimiter = '\n';

  public typeNameFromId: TypeNameFromId;

  constructor(typeIds: TypeIds) {
    this.typeIds = typeIds;
    this.typeNameFromId = Object.entries(typeIds).reduce(
      (res: TypeNameFromId, [key, value]): TypeNameFromId => {
        res[value] = key;
        return res;
      },
      {},
    );
  }

  public toId = (typename: string, realId: string | number): string => {
    const typeId = this.typeIds[typename];
    if (!typeId) throw new Error('Invalid typename');
    return TypeIDDataSource.base64encode(
      `${typeId}${TypeIDDataSource.delimiter}${realId}`,
    );
  };

  public fromId = (id: string): [string, string] => {
    const [typeId, realId] = TypeIDDataSource.base64decode(id).split(
      TypeIDDataSource.delimiter,
      2,
    );
    const typename = this.typeNameFromId[typeId];
    if (!typename) throw new Error('Invalid id');
    return [typename, realId];
  };
}
