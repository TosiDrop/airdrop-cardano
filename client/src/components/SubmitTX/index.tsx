import SubmitTransaction from "./SubmitTransaction";
import useDualThemeClass from "hooks/useDualThemeClass";
import "./index.scss";


const COMPONENT_CLASS = "submit-tx";

export default function SubmitTool() {
  const [CLASS, CHILD_CLASS] = useDualThemeClass({
    main: COMPONENT_CLASS,
    el: "child",
  });

  return (
    <div className={CLASS}>
      <div className={`${COMPONENT_CLASS}__row ${CHILD_CLASS}`}>
        <h2>Submit a Custom Transaction</h2>
      </div>
      <div className={`${COMPONENT_CLASS}__row ${CHILD_CLASS}`}>
        <SubmitTransaction></SubmitTransaction>
      </div>
    </div>
  );
}
