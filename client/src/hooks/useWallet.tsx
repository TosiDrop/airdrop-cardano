import { useDispatch } from "react-redux";
import { setApi } from "reducers/blockchainSlice";
import { WalletName, API, AssetsSummary } from "utils";
import { TransactionUnspentOutput } from "@emurgo/cardano-serialization-lib-asmjs";
// import axios from 'axios';
let Buffer = require("buffer").Buffer;

export default function useWallet() {
  const dispatch = useDispatch();

  const enableWallet = async (walletName: string) => {
    try {
      let API: API = undefined;
      switch (walletName) {
        case WalletName.NAMI:
          API = await (window as any).cardano.nami.enable();
          break;
        case WalletName.CCVAULT:
          API = await (window as any).cardano.ccvault.enable();
          break;
        default:
          throw new Error();
      }
      localStorage.setItem("wallet", walletName);
      dispatch(setApi(API));
    } catch (err) {
      window.alert("Something is wrong");
      console.log(err);
    }
  };

  const getWalletSummary = async (API: any): Promise<AssetsSummary> => {
    let assetsSummary: AssetsSummary = {
      ADA: 0,
    };

    try {
      /**
       * Only fetch usable UTXOs
       * check another function to get the collateral
       */
      const rawUtxos: string[] = await API.getUtxos();

      for (const rawUtxo of rawUtxos) {
        const { amount, multiasset } = parseUtxo(rawUtxo);
        assetsSummary["ADA"] += Number(amount);

        if (multiasset) {
          /**
           * Check all asset type other than ADA
           * in each utxo
           */
          const keys = multiasset.keys();
          const numberOfAssetType = keys.len();

          for (let i = 0; i < numberOfAssetType; i++) {
            const policyId = keys.get(i);

            const assets = multiasset.get(policyId);
            if (assets == null) continue;
            const assetNames = assets.keys();
            const K = assetNames.len();

            const policyIdString = convertBufferToHex(policyId.to_bytes());

            if (!assetsSummary[policyIdString]) {
              assetsSummary[policyIdString] = 0;
            }

            /**
             * Check a specific policy ID
             */
            for (let j = 0; j < K; j++) {
              const assetName = assetNames.get(j);
              const multiassetAmt = multiasset.get_asset(policyId, assetName);
              const assetAmount = multiassetAmt.to_str();
              assetsSummary[policyIdString] += Number(assetAmount);
            }
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
    
    return assetsSummary;
  };

  return {
    enableWallet: enableWallet,
    getWalletSummary: getWalletSummary,
  };
}

function parseUtxo(rawUtxo: string) {
  const utxo = TransactionUnspentOutput.from_bytes(Buffer.from(rawUtxo, "hex"));
  const output = utxo.output();
  const amount = output.amount().coin().to_str(); // ADA amount in lovelace
  const multiasset = output.amount().multiasset();
  return {
    amount,
    multiasset,
  };
}

function convertBufferToHex(inBuffer: Uint8Array): string {
  const inString = Buffer.from(inBuffer, "utf8").toString("hex");
  return inString;
}

// async function getTokenData (tokens: AssetsSummary) {
//   const uri = "https://tokens.cardano.org/metadata/"

//   const body = JSON.stringify({
//     subjects: [...Object.keys(tokens)],
//     properties: ["ticker"]
//   })

//   const headers = {
//     'content-type': 'application/json;charset=utf-8'
//   }

//   const response = await axios.get(uri + "8fef2d34078659493ce161a6c7fba4b56afefa8535296a5743f6958741414441")
//   return response.data
// }