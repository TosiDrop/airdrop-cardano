import axios from "axios";
import {
  Transaction,
  TransactionWitnessSet,
} from "@emurgo/cardano-serialization-lib-asmjs";
import {
  AddressAmount,
  AirdropRequestBody,
  Token,
  lovelaceToAda,
  TransactionInfo,
} from "utils";

const Buffer = require("buffer/").Buffer;
const url = process.env.REACT_APP_API_TX;

export const prepareBody = (
  selectedToken: Token,
  addressArray: AddressAmount[],
  totalAmountToAirdrop: number,
  addressContainingAda: AddressAmount[]
) => {
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
    token_name: `${selectedToken.policyId}.${selectedToken.nameHex}`,
    addresses: addressArray.map((addr: AddressAmount) => ({
      [addr.address]: addr.amount * Math.pow(10, selectedToken.decimals),
    })),
  };
  return body;
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const checkFirstAirdropTxStatus = async (airdropHash: any) => {
  const response = await axios.get(
    `${url}/api/v0/airdrop_status/${airdropHash}`
  );
  const txStatus = response.data.transactions[0].transaction_status;
  if (txStatus == "transaction adopted") return true;
  return false;
};

// code to wipe the transaction witnesses. This is required to prepare
/// cardano-cli tx for cardano-serialization-lib signing.
export const clearSignature = async (cborHex: any) => {
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

export const walletSign = async (
  api: any,
  tx: any,
  transactionWitnessSet: any,
  txId: any
) => {
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

export const submitTransaction = async (txJson: any) => {
  try {
    const txSubmit = await axios.post(
      `${url}/api/v0/submit_transaction`,
      txJson
    );
    const submission = txSubmit.data;
    return submission;
  } catch (e) {
    console.log(e);
  }
};

// get the airdrop transactions
export const getAirdrop = async (airdropHash: any) => {
  const response = await axios.get(
    `${url}/api/v0/get_transactions/${airdropHash}`
  );
  const transactions = response.data;
  const transactionsToSign: TransactionInfo[] = [];
  const txHashMap: { [key: string]: boolean } = {};
  let txDesc: string;
  for (let tx of transactions) {
    txDesc = tx.description;
    if (txHashMap[txDesc] == null) {
      txHashMap[txDesc] = true;
      transactionsToSign.push({ ...tx });
    }
  }
  return transactionsToSign;
};

export const transact = async (api: any, cborHex: string, txId: string) => {
  const clearedTx = await clearSignature(cborHex);
  const signedTx = await walletSign(api, clearedTx[0], clearedTx[1], txId);
  const submittedTx = await submitTransaction(signedTx);
  return submittedTx;
};
