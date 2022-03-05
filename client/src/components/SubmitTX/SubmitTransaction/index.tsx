import { Button, Input, InputNumber} from "@arco-design/web-react";
import { IconSend } from "@arco-design/web-react/icon";
import { useState } from "react";
import { useSelector, RootStateOrAny } from "react-redux";
import "./index.scss";
import { TransactionUnspentOutput, Transaction, TransactionWitnessSet } from "@emurgo/cardano-serialization-lib-asmjs";
//import SubmitTransaction from "../TokenDetail";
let Buffer = require("buffer/").Buffer;
const COMPONENT_CLASS = "submit-transaction";
export default function SubmitTransaction() {
   // export default function SubmitTransaction = async () =>  {
   // const [tx, setCustomTx] = useState<any>(0);
 const api = useSelector((state: RootStateOrAny) => state.blockchain.api);
 const [tx, setCustomTx] = useState<any>(0);
    //console.log("cbor string",tx)
  const submit = async (API:any,signed_transaction:any) => {
    //convert hex string to bytes
  const txCli = Transaction.from_bytes(Buffer.from(signed_transaction, "hex"))
    //console.log("cbor bytes",txCli)
    const txBody = txCli.body()
    const witnessSet = txCli.witness_set()
    //this clears the dummy signature from the transaction
    witnessSet.vkeys()?.free()
    const transactionWitnessSet = TransactionWitnessSet.new();
    console.log(transactionWitnessSet)
    //build new unsigned transaction
    const tx = Transaction.new(
        txBody,
        TransactionWitnessSet.from_bytes(transactionWitnessSet.to_bytes())
    )
    //send to wallet for signature
    let txVkeyWitnesses =  await api.signTx(Buffer.from(tx.to_bytes(), "utf8").toString("hex"), true);
    txVkeyWitnesses = TransactionWitnessSet.from_bytes(Buffer.from(txVkeyWitnesses, "hex"));
    transactionWitnessSet.set_vkeys(txVkeyWitnesses.vkeys());
    const signedTx = Transaction.new(
        tx.body(),
        transactionWitnessSet
    );
    //submit transaction
    const submittedTxHash =  await api.submitTx(Buffer.from(signedTx.to_bytes(), "utf8").toString("hex"));
    window.alert("submitted, hash = "+ submittedTxHash)
    

    

return {
  submit: submit,
}

};

  return (
    <div className={COMPONENT_CLASS}>
      <div className={`${COMPONENT_CLASS}__row`}>
        <span>Paste signed CBOR hex</span>
        <Input
          min={0}
          onChange={setCustomTx}
        />
      </div>
      <div className={`${COMPONENT_CLASS}__row`}>
        <Button
          onClick={() => submit(api,tx)}
        >
          Airdrop
          <IconSend />
        </Button>
      </div>
    </div>
  );
}
