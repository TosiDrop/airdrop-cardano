import { TransactionInfo } from "utils";
import { transact } from "../helper";
import "./index.scss";

const AirdropTransaction = ({ tx, api }: { tx: TransactionInfo; api: any }) => {
  return (
    <div>
      tx: {tx.description}{" "}
      <button onClick={() => transact(api, tx.cborHex, tx.description)}>
        Sign Transaction
      </button>
    </div>
  );
};

export default AirdropTransaction;
