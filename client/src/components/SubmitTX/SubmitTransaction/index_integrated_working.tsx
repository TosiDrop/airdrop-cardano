import { Button, Input, InputNumber} from "@arco-design/web-react";
import { IconSend } from "@arco-design/web-react/icon";
import { useState } from "react";
import { useSelector, RootStateOrAny } from "react-redux";
//import  submitTX from "hooks/submit"
import "./index.scss";
import { TransactionUnspentOutput, Transaction, TransactionWitnessSet } from "@emurgo/cardano-serialization-lib-asmjs";
let Buffer = require("buffer").Buffer;
const COMPONENT_CLASS = "token-detail";

export default function TokenDetail() {
  const [tx, setCustomTx] = useState<any>(0);
  const api = useSelector((state: RootStateOrAny) => state.blockchain.api);

  const submit = (API:any,signed_transaction:any) => {
    
  const txCli = Transaction.from_bytes(Buffer.from(signed_transaction, "hex"))
  console.log(txCli)
    const txBody = txCli.body()
    const witnessSet = txCli.witness_set()
    witnessSet.vkeys()?.free()
    const transactionWitnessSet = TransactionWitnessSet.new();

    const tx = Transaction.new(
        txBody,
        TransactionWitnessSet.from_bytes(transactionWitnessSet.to_bytes())
    )
    let txVkeyWitnesses =  API.signTx(Buffer.from(tx.to_bytes(), "utf8").toString("hex"), true);
    txVkeyWitnesses = TransactionWitnessSet.from_bytes(Buffer.from(txVkeyWitnesses, "hex"));

    transactionWitnessSet.set_vkeys(txVkeyWitnesses.vkeys());

    const signedTx = Transaction.new(
        tx.body(),
        transactionWitnessSet
    );

    const submittedTxHash =  API.submitTx(Buffer.from(signedTx.to_bytes(), "utf8").toString("hex"));
    console.log(submittedTxHash)
    

    

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
