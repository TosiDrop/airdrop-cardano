export interface Token {
  name: string;
  amount: number;
  decimals: number;
}

export interface GlobalState {
  darkTheme: boolean;
  tokenArray: Token[];
  selectedToken: Token;
  addressArray: AddressAmount[];
  totalAmountToAirdrop: number;
  loadingApi: boolean
}

export type API = object | undefined;

export interface BlockchainState {
  api: API;
  walletAddress: string;
}

export enum WalletName {
  NAMI = "nami",
  CCVAULT = "ccvault",
}

// policy ID => asset name in hex => amount
export interface AssetsSummary {
  [key: string]: {
    [key: string]: number;
  };
}

export interface AssetsAmount {
  [key: string]: number;
}

export interface AssetsDetail {
  decimals: number;
  ticker: string;
  policy_id: string;
  name_hex: string;
}

export interface AddressAmount {
  address: string;
  amount: number;
}
