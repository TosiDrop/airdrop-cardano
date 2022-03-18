import { useDispatch } from "react-redux";
import {
  setAddressContainingAda,
  setTokenArray,
  setApi,
  setPopUp,
} from "reducers/globalSlice";
import {
  AddressAmount,
  PolicyIDAndAssetNameToAddressAmountMap,
  PolicyIDAndAssetNameToAmountMap,
  PopUpType,
} from "utils";
import {
  connectWallet,
  parseUtxo,
  getAssetDetails,
  getCompleteTokenArray,
  convertBufferToHex,
} from "./helper";
let Buffer = require("buffer").Buffer;

export default function useWallet() {
  const dispatch = useDispatch();

  /**
   * enable connection to wallet
   * @param walletName
   */
  const enableWallet = async (walletName: string) => {
    try {
      const API = await connectWallet(walletName);
      dispatch(setApi(API));
    } catch (err: any) {
      dispatch(
        setPopUp({
          type: PopUpType.FAIL,
          text: "Wallet not set. Enable Dapp account.",
          show: true,
        })
      );
    }
  };

  /**
   * get all the tokens inside the wallet
   * @param API
   * @returns
   */
  const getTokenArrayInWallet = async (API: any): Promise<void> => {
    try {
      /**
       * Only fetch usable UTXOs
       * check another function to get the collateral
       */
      const assetAmount: PolicyIDAndAssetNameToAmountMap = {};
      const assetAddresses: PolicyIDAndAssetNameToAddressAmountMap = {};
      const rawUtxos: string[] = await API.getUtxos();
      const parsedUtxos = rawUtxos.map((rawUtxo) => parseUtxo(rawUtxo));
      const addressContainingAda: AddressAmount[] = [];
      let addressAmountObj: AddressAmount;

      for (const parsedUtxo of parsedUtxos) {
        const { multiasset, address, amount } = parsedUtxo;
        addressContainingAda.push({ address, amount });

        /**
         * if utxo contains asset other than ada
         * check them
         */
        if (!multiasset) continue;

        const keys = multiasset.keys();
        const numberOfAssetType = keys.len();

        for (let i = 0; i < numberOfAssetType; i++) {
          const policyId = keys.get(i);
          const assets = multiasset.get(policyId);

          if (assets == null) continue;

          const assetNames = assets.keys();
          const K = assetNames.len();

          const policyIdString = convertBufferToHex(policyId.to_bytes());

          if (!assetAmount[policyIdString]) {
            assetAmount[policyIdString] = {};
          }

          if (!assetAddresses[policyIdString]) {
            assetAddresses[policyIdString] = {};
          }

          for (let j = 0; j < K; j++) {
            const assetName = assetNames.get(j);
            const assetNameHex = Buffer.from(
              (assetName as any).name(),
              "utf8"
            ).toString("hex");
            const multiassetAmt = multiasset.get_asset(policyId, assetName);
            const assetAmountInUtxo = Number(multiassetAmt.to_str());

            if (!assetAmount[policyIdString][assetNameHex]) {
              assetAmount[policyIdString][assetNameHex] = 0;
            }
            assetAmount[policyIdString][assetNameHex] += assetAmountInUtxo;

            addressAmountObj = {
              address,
              amount: assetAmountInUtxo,
              adaAmount: amount,
            };

            if (!assetAddresses[policyIdString][assetNameHex]) {
              assetAddresses[policyIdString][assetNameHex] = [];
            }
            assetAddresses[policyIdString][assetNameHex].push(addressAmountObj);
          }
        }
      }

      const assetDetail = await getAssetDetails(assetAmount);
      const tokenArray = getCompleteTokenArray(
        assetAmount,
        assetAddresses,
        assetDetail
      );
      tokenArray.sort((a, b) => (a.name < b.name ? -1 : 1));
      dispatch(setAddressContainingAda(addressContainingAda));
      dispatch(setTokenArray(tokenArray));
    } catch (err) {
      console.log(err);
    }
  };

  return {
    enableWallet: enableWallet,
    getTokenArrayInWallet: getTokenArrayInWallet,
  };
}
