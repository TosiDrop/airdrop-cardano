/**
 * interface
 * enum
 * type
 */

export interface AddressAmount {
  address: string;
  amount: number;
  adaAmount?: number;
}

export interface Token {
  name: string;
  amount: number;
  decimals: number;
  ticker: string;
  policyId: string;
  nameHex: string;
  addressContainingToken: AddressAmount[];
}

export interface GlobalState {
  api: API;
  walletAddress: string;
  darkTheme: boolean;
  tokenArray: Token[];
  selectedToken: Token;
  addressArray: AddressAmount[];
  addressContainingAda: AddressAmount[];
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

/**
 * policy ID => asset name in hex => amount
 */
export interface PolicyIDAndAssetNameToAmountMap {
  [key: PolicyID]: {
    [key: AssetName]: number;
  };
}

/**
 * policy ID => asset name in hex => { address, amount }
 */
export interface PolicyIDAndAssetNameToAddressAmountMap {
  [key: PolicyID]: {
    [key: AssetName]: AddressAmount[];
  };
}

export interface AssetDetailFromAPI {
  decimals: number;
  ticker: string;
  policy_id: string;
  name_hex: string;
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
export type PolicyID = string;
export type AssetName = string;
