export const shortenAddress = (addr: string) => {
  return `${addr.slice(0, 6)}...${addr.slice(addr.length - 8)}`;
}