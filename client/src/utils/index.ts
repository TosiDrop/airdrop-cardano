export interface Token {
  name: string;
  amount: number;
  decimals: number;
  ticker: string;
  policyId: string;
  nameHex: string;
}

export const defaultToken = {
  name: "",
  amount: 0,
  decimals: 0,
  ticker: "",
  policyId: "",
  nameHex: "",
};

export interface AddressAmountMap {
  address: string;
  amount: number;
}

export interface GlobalState {
  darkTheme: boolean;
  tokenArray: Token[];
  selectedToken: Token;
  addressArray: AddressAmountMap[];
  totalAmountToAirdrop: number;
  loadingApi: boolean;
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
