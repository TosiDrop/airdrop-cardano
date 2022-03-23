import { useSelector, RootStateOrAny, useDispatch } from "react-redux";
import TokenSelect from "./TokenSelect";
import TokenDetail from "./TokenDetail";
import FileUpload from "./FileUpload";
import AddressList from "./AddressList";
import PopUp from "components/PopUp";
import useDualThemeClass from "hooks/useDualThemeClass";
import {
  AddressAmount,
  AirdropRequestBody,
  Token,
  PopUpType,
  lovelaceToAda,
} from "utils";
import { useState } from "react";
import axios from "axios";
import "./index.scss";
import usePopUp from "hooks/usePopUp";
import {
  Transaction,
  TransactionWitnessSet,
} from "@emurgo/cardano-serialization-lib-asmjs";
import { resolve } from "node:path/win32";
import { createNextState } from "@reduxjs/toolkit";
import { sign } from "node:crypto";

/// I added these two

const Buffer = require("buffer/").Buffer;

const COMPONENT_CLASS = "airdrop-tool";

export default function AirdropTool() {
  const dispatch = useDispatch();

  const { setPopUpLoading, setPopUpSuccess, setPopUpError } = usePopUp();
  const [txFee, setTxFee] = useState(0);
  const [adaToSpend, setAdaToSpend] = useState(0);
  const [isAbleToAirdrop, setTsAbleToAirdrop] = useState(false);
  const [multiTx, setMultiTx] = useState(false);

  const [CLASS, CHILD_CLASS] = useDualThemeClass({
    main: COMPONENT_CLASS,
    el: "child",
  });

  const {
    selectedToken,
    addressArray,
    totalAmountToAirdrop,
    walletAddress,
    addressContainingAda,
    api,
  } = useSelector((state: RootStateOrAny) => state.global);

  const sendToken = async () => {
    setPopUpLoading(`Sending ${totalAmountToAirdrop} ${selectedToken.name}`);

    const requestBody = prepareBody(
      walletAddress,
      selectedToken,
      addressArray,
      totalAmountToAirdrop,
      addressContainingAda
    );

    const url = process.env.REACT_APP_API_TX;
    /// Submit the first transaction after validation
    try {
      const submitAirdrop = await axios.post(
        `${url}/api/v0/submit`,
        requestBody
      );
      const cborHexInString = submitAirdrop.data.cborHex;
      // the API uses the transaction id as a unique identifier.
      // cardano serialization lib modifies it. We us the description
      // field of the transaction json to pass along the original value.

      const txId = submitAirdrop.data.description;

      // functions to  erase witnesses, sign, and submit to api
      const cleared = await clearSignature(cborHexInString);
      const signed = await walletSign(cleared[0], cleared[1], txId);
      const submitted = await submit_transaction(signed, url);

      //check single or multi transaction
      if (!multiTx) {
        setPopUpSuccess(`${submitted.status}`);
      } else {
        setPopUpLoading(`negotiating UTXOs...`);
        await handleMultiTxAirdrop(url, submitted.airdrop_hash, txId);
      }
    } catch (e: any) {}
  };

  const handleMultiTxAirdrop = async (
    url: any,
    airdropHash: any,
    txId: any
  ) => {
    setPopUpLoading("Waiting for the first confirmation");
    try {
      let initialTxAdopted: boolean = false;
      while (!initialTxAdopted) {
        initialTxAdopted = await checkInitialTxStatus(url, airdropHash, txId);
        await sleep(500);
      }
      getAirdrop(url, airdropHash);
    } catch (e: any) {
      console.log(e);
    }
  };

  const checkInitialTxStatus = async (
    url: any,
    airdropHash: any,
    txId: any
  ) => {
    const response = await axios.get(
      `${url}/api/v0/airdrop_status/${airdropHash}`
    );
    const txStatus = response.data.transactions[0].transaction_status;
    if (txStatus == "transaction adopted") return true;
    return false;
  };

  // get the airdrop transactions
  const getAirdrop = async (url: any, airdropHash: any) => {
    const transactions = await axios.get(
      `${url}/api/v0/get_transactions/${airdropHash}`
    );
    console.log(transactions)
    return 
    const length = transactions.data.length;
    // const cborHex = transactions.data.cborHex
    // const txId = transactions.data.description
    //setPopUpLoading(`you will sign ${length} transactions`);
    const loop = await forLoop(transactions, url);
  };
  //// this is the loop that cycles through the transactions.
  /// the walletSight function seems to return the unsigned function in this case.
  // the same functions without the loop work good for a single transaction.
  const forLoop = async (transactions: any, url: any) => {
    const length = transactions.data.length;
    for (let i = 0; i < length; i++) {
      const cborHex = transactions.data[i].cborHex;
      let txId = transactions.data[i].description;
      let cleared = await clearSignature(cborHex);
      let tx = cleared[0];
      let tWS = cleared[1];
      let signed = await walletSign(cleared[0], cleared[1], txId);
      let submitted = await submit_transaction(signed, url);

      // const submitted = await submit_transaction(signed,url)
    }
  };
  // code to wipe the transaction witnesses. This is required to prepare
  /// cardano-cli tx for cardano-serialization-lib signing.
  const clearSignature = async (cborHex: any) => {
    const txCli = Transaction.from_bytes(Buffer.from(cborHex, "hex"));
    //begin signature
    const txBody = txCli.body();
    const witnessSet = txCli.witness_set();
    //this clears the dummy signature from the transaction
    witnessSet.vkeys()?.free();
    //build new unsigned transaction
    var transactionWitnessSet = TransactionWitnessSet.new();
    var tx = Transaction.new(
      txBody,
      TransactionWitnessSet.from_bytes(transactionWitnessSet.to_bytes())
    );
    return [tx, transactionWitnessSet];
  };

  //signing funcion and creating json object

  const walletSign = async (tx: any, transactionWitnessSet: any, txId: any) => {
    let txVkeyWitnesses = await api.signTx(
      Buffer.from(tx.to_bytes(), "utf8").toString("hex"),
      true
    );
    txVkeyWitnesses = TransactionWitnessSet.from_bytes(
      Buffer.from(txVkeyWitnesses, "hex")
    );
    transactionWitnessSet.set_vkeys(txVkeyWitnesses.vkeys());
    const signedTx = Transaction.new(tx.body(), transactionWitnessSet);
    const hexSigned = await Buffer.from(signedTx.to_bytes(), "utf8").toString(
      "hex"
    );
    const txFormatted = `{ \n\t\"type\": \"Tx AlonzoEra\",\n\t\"description\": \"${txId}",\n\t\"cborHex\": \"${hexSigned}\"\n}`;
    const txJson = JSON.parse(txFormatted);
    return txJson;
  };

  const submit_transaction = async (txJson: any, url: any) => {
    const txSubmit = await axios.post(
      `${url}/api/v0/submit_transaction`,
      txJson
    );
    const submission = txSubmit.data;
    return submission;
  };

  const validateAirdropRequest = async () => {
    setPopUpLoading("Validating request");

    const requestBody = prepareBody(
      walletAddress,
      selectedToken,
      addressArray,
      totalAmountToAirdrop,
      addressContainingAda
    );

    const url = process.env.REACT_APP_API_TX;

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

  return (
    <div className={CLASS}>
      <div className={`${COMPONENT_CLASS}__row ${CHILD_CLASS}`}>
        <h2>Airdrop Parameters</h2>
      </div>
      <div
        className={`${COMPONENT_CLASS}__token_input ${COMPONENT_CLASS}__row ${CHILD_CLASS}`}
      >
        <TokenSelect />
        <FileUpload></FileUpload>
      </div>
      <div className={`${COMPONENT_CLASS}__row ${CHILD_CLASS}`}>
        <AddressList></AddressList>
      </div>
      <div className={`${COMPONENT_CLASS}__row ${CHILD_CLASS}`}>
        <TokenDetail
          adaToSpend={adaToSpend}
          fee={txFee}
          sendToken={sendToken}
          validateAirdropRequest={validateAirdropRequest}
          isAbleToAirdrop={isAbleToAirdrop}
        ></TokenDetail>
      </div>
    </div>
  );
}

function prepareBody(
  walletAddress: string,
  selectedToken: Token,
  addressArray: AddressAmount[],
  totalAmountToAirdrop: number,
  addressContainingAda: AddressAmount[]
) {
  const sourceAddresses = [];
  let estimatedAdaNeeded = (2 + addressArray.length * 2) * Math.pow(10, 6);
  let totalAmountToAirdropInCompleteDecimal = totalAmountToAirdrop;

  for (let addressAmountObject of selectedToken.addressContainingToken) {
    if (totalAmountToAirdropInCompleteDecimal < 0 && estimatedAdaNeeded < 0)
      break;
    totalAmountToAirdropInCompleteDecimal -= addressAmountObject.amount;
    if (addressAmountObject.adaAmount) {
      estimatedAdaNeeded -= addressAmountObject.adaAmount;
    }
    sourceAddresses.push(addressAmountObject.address);
  }

  for (let addressAmountObject of addressContainingAda) {
    if (estimatedAdaNeeded < 0) break;
    if (!sourceAddresses.includes(addressAmountObject.address)) {
      estimatedAdaNeeded -= addressAmountObject.amount;
    }
  }

  const body: AirdropRequestBody = {
    source_addresses: sourceAddresses,
    change_address: walletAddress,
    token_name: `${selectedToken.policyId}.${selectedToken.nameHex}`,
    addresses: addressArray.map((addr: AddressAmount) => ({
      [addr.address]: addr.amount * Math.pow(10, selectedToken.decimals),
    })),
  };
  return body;
}

//sleep function
const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
