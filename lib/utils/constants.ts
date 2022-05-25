const nodeServiceName = 'NodeService';
const nodeServiceUrlPrefix = 'node-url/';

export const createNodeServiceEndPoint = (
  id: string,
): { name: string; url: string } => ({
  name: nodeServiceName,
  url: `${nodeServiceUrlPrefix}${id}`,
});

export const isNodeServiceEndpoint = ({
  name,
  url,
}: {
  name: string;
  url?: string;
}): boolean =>
  name === nodeServiceName && !!url && url.startsWith(nodeServiceUrlPrefix);
