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

export const supportedWallets = [
  {
    name: WalletName.NAMI,
    displayName: "Nami",
  },
  {
    name: WalletName.CCVAULT,
    displayName: "CCVault",
  },
];

export enum PopUpType {
  LOADING = "loading",
  SUCCESS = "success",
  FAIL = "fail",
}

export interface PopUpProps {
  show: boolean;
  type: PopUpType;
  text: string;
  closePopUp: Function;
}

export interface AirdropRequestBody {
  source_addresses: string[];
  change_address?: string;
  token_name: string;
  addresses: {
    [key: string]: number;
  }[];
}

export function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(addr.length - 8)}`;
}
