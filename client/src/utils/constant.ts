import { WalletName } from './index'

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

export const defaultToken = {
  name: "",
  amount: 0,
  decimals: 0,
  ticker: "",
  policyId: "",
  nameHex: "",
  addressContainingToken: []
};