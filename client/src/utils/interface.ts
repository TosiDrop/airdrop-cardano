/**
 * interface
 * enum
 * type
 */

export interface AddressAmountMap {
  address: string;
  amount: number;
}

export interface Token {
  name: string;
  amount: number;
  decimals: number;
  ticker: string;
  policyId: string;
  nameHex: string;
  addressContainingToken: AddressAmountMap[];
}

export interface GlobalState {
  api: API;
  walletAddress: string;
  darkTheme: boolean;
  tokenArray: Token[];
  selectedToken: Token;
  addressArray: AddressAmountMap[];
  addressContainingAda: AddressAmountMap[]
  totalAmountToAirdrop: number;
  loadingApi: boolean;
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

export enum PopUpType {
  LOADING = "loading",
  SUCCESS = "success",
  FAIL = "fail",
}

export enum WalletName {
  NAMI = "nami",
  CCVAULT = "ccvault",
}

export type API = object | undefined;