import { Button, Spin } from "@arco-design/web-react";
import { IconCheckCircle, IconCloseCircle } from "@arco-design/web-react/icon";
import { useState } from "react";
import { ClassNames, TransactionInfo } from "utils";
import { transact, checkTxStatus, sleep } from "../helper";
import "./index.scss";

const COMPONENT_CLASS = "airdrop-tx";

enum TransactionState {
  LOADING = "loading",
  UNSIGNED = "unsigned",
  SUCCESSSFUL = "successful",
  UNSUCCESSSFUL = "unsuccessful",
}

const AirdropTransaction = ({
  tx,
  api,
  i,
}: {
  tx: TransactionInfo;
  api: any;
  i: number;
}) => {
  const [txState, setTxState] = useState<TransactionState>(
    TransactionState.UNSIGNED
  );

  const getStatus = () => {
    switch (txState) {
      case TransactionState.UNSIGNED:
        return "Unsigned";
      case TransactionState.LOADING:
        return <Spin />;
      case TransactionState.SUCCESSSFUL:
        return <IconCheckCircle />;
      case TransactionState.UNSUCCESSSFUL:
        return <IconCloseCircle />;
    }
  };

  const signTx = async () => {
    try {
      const txHash = await transact(api, tx.cborHex, tx.description);
      setTxState(TransactionState.LOADING);
      let txAdopted = false;
      while (!txAdopted) {
        txAdopted = await checkTxStatus(txHash.airdrop_hash);
        await sleep(500);
      }
      setTxState(TransactionState.SUCCESSSFUL);
    } catch (e) {
      setTxState(TransactionState.UNSUCCESSSFUL);
    }
  };

  return (
    <div className={COMPONENT_CLASS}>
      <div className={`${COMPONENT_CLASS}__header`}>
        <span>Transaction {i}</span>
        <Button
          onClick={() => signTx()}
          className={`${COMPONENT_CLASS}__sign-btn  ${ClassNames.TOSIDROP_BTN}`}
          disabled={txState !== TransactionState.UNSIGNED}
        >
          Sign Transaction
        </Button>
        <div
          className={`${COMPONENT_CLASS}__status ${COMPONENT_CLASS}__status-${txState}`}
        >
          {getStatus()}
        </div>
      </div>
      <div className={`${COMPONENT_CLASS}__body`}></div>
    </div>
  );
};

export default AirdropTransaction;
