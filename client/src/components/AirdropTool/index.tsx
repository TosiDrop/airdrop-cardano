import { useSelector, RootStateOrAny, useDispatch } from "react-redux";
import TokenSelect from "./TokenSelect";
import TokenDetail from "./TokenDetail";
import FileUpload from "./FileUpload";
import AddressList from "./AddressList";
import useDualThemeClass from "hooks/useDualThemeClass";
import { lovelaceToAda, TransactionInfo } from "utils";
import { useState } from "react";
import axios from "axios";
import usePopUp from "hooks/usePopUp";
import {
  prepareBody,
  sleep,
  checkFirstAirdropTxStatus,
  getAirdrop,
  transact,
} from "./helper";
import "./index.scss";
import AirdropTransaction from "./AirdropTransaction";

const COMPONENT_CLASS = "airdrop-tool";

export default function AirdropTool() {
  const url = process.env.REACT_APP_API_TX;
  const { setPopUpLoading, setPopUpSuccess, setPopUpError } = usePopUp();
  const [txFee, setTxFee] = useState(0);
  const [adaToSpend, setAdaToSpend] = useState(0);
  const [isAbleToAirdrop, setTsAbleToAirdrop] = useState(false);
  const [multiTx, setMultiTx] = useState(false);
  const [txToSign, setTxToSign] = useState<TransactionInfo[]>([]);

  const CLASS = useDualThemeClass({ className: COMPONENT_CLASS });

  const {
    selectedToken,
    addressArray,
    totalAmountToAirdrop,
    addressContainingAda,
    api,
  } = useSelector((state: RootStateOrAny) => state.global);

  const validateAirdropRequest = async () => {
    setPopUpLoading("Validating request");

    const requestBody = prepareBody(
      selectedToken,
      addressArray,
      addressContainingAda
    );

    try {
      const txData = await axios.post(`${url}/api/v0/validate`, requestBody);
      const adaToSpendForTxInAda = lovelaceToAda(
        txData.data.spend_amounts.lovelace
      );
      const txFeeInAda = lovelaceToAda(txData.data.tx_fee);
      setTxFee(txFeeInAda);
      setAdaToSpend(adaToSpendForTxInAda);
      setTsAbleToAirdrop(true);
      if (txData.data.transactions_count > 1) {
        setMultiTx(true);
      } else {
        setMultiTx(false);
      }

      setPopUpSuccess(
        `Airdrop is validated. You can proceed with the airdrop.`
      );
    } catch (e: any) {
      switch (e.response?.status) {
        case 406: {
          setPopUpError("Balance in wallet is not enough");
          return;
        }
      }
    }
  };

  const execAirdrop = async () => {
    setPopUpLoading(`Sending ${totalAmountToAirdrop} ${selectedToken.name}`);

    const requestBody = prepareBody(
      selectedToken,
      addressArray,
      addressContainingAda
    );

    /**
     * Submit first transaction after validation.
     * first transaction is done to get the airdrop txs.
     */
    try {
      const airdropTxData = await axios.post(
        `${url}/api/v0/submit`,
        requestBody
      );
      const cborHexInString = airdropTxData.data.cborHex;

      /**
       * the API uses the transaction id as a unique identifier.
       * cardano serialization lib modifies it. We us the description
       * field of the transaction json to pass along the original value.
       */
      const txId = airdropTxData.data.description;

      /**
       * functions to  erase witnesses, sign, and submit to api
       */
      const firstAirdropTx = await transact(api, cborHexInString, txId);

      /**
       * check if airdrop is single transaction.
       * if single tx, then airdrop is done in 1 tx
       */
      if (!multiTx) {
        setPopUpSuccess(`Airdrop successful!`);
      } else {
        /**
         * else, do multiple signing for multiple airdrop txs
         */
        setPopUpLoading(`Negotiating UTXOs`);
        await handleMultiTxAirdrop(firstAirdropTx.airdrop_hash);
      }
    } catch (e: any) {}
  };

  const handleMultiTxAirdrop = async (airdropHash: any) => {
    setPopUpLoading("Waiting for the first confirmation");
    try {
      let firstAirdropTxAdopted: boolean = false;
      while (!firstAirdropTxAdopted) {
        firstAirdropTxAdopted = await checkFirstAirdropTxStatus(airdropHash);
        await sleep(500);
      }
      const remainingAirdropTxs = await getAirdrop(airdropHash);
      setTxToSign(remainingAirdropTxs);
      // let cborHex, txId;
      // for (let tx of remainingAirdropTxs) {
      //   cborHex = tx.cborHex;
      //   txId = tx.description;
      //   const firstAirdropTx = await transact(api, cborHex, txId);
      // }
    } catch (e: any) {
      console.log(e);
      setPopUpError("Something went wrong");
    }
  };

  return (
    <div className={CLASS}>
      <div className={`${COMPONENT_CLASS}__row`}>
        <h2>Airdrop Parameters</h2>
      </div>
      <div
        className={`${COMPONENT_CLASS}__token_input ${COMPONENT_CLASS}__row`}
      >
        <TokenSelect />
        <FileUpload></FileUpload>
      </div>
      <div className={`${COMPONENT_CLASS}__row`}>
        <AddressList></AddressList>
      </div>
      <div className={`${COMPONENT_CLASS}__row`}>
        <TokenDetail
          adaToSpend={adaToSpend}
          fee={txFee}
          execAirdrop={execAirdrop}
          validateAirdropRequest={validateAirdropRequest}
          isAbleToAirdrop={isAbleToAirdrop}
        ></TokenDetail>
      </div>
      <div className={`${COMPONENT_CLASS}__row`}>
        {txToSign.length
          ? txToSign.map((tx) => (
              <AirdropTransaction tx={tx} api={api}></AirdropTransaction>
            ))
          : null}
      </div>
    </div>
  );
}
