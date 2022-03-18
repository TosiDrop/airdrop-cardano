export const shortenAddress = (addr: string) => {
  return `${addr.slice(0, 6)}...${addr.slice(addr.length - 8)}`;
};

export const lovelaceToAda = (lovelace: number) => {
  const ada = (lovelace / Math.pow(10, 6)).toFixed(2);
  return Number(ada);
};
