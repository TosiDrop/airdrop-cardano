import useDualThemeClass from "hooks/useDualThemeClass";
import "./index.scss";

const COMPONENT_CLASS = "tx-tracker";

const TransactionTracker = () => {
  const CLASS = useDualThemeClass({ className: COMPONENT_CLASS });
  return (
    <div className={CLASS}>
      <div className={`${COMPONENT_CLASS}__row`}>
        <h2>Airdrop Transactions</h2>
      </div>
      <div className={`${COMPONENT_CLASS}__row`}></div>
    </div>
  );
};

export default TransactionTracker;
