import TokenSelect from "./TokenSelect";
import TokenDetail from "./TokenDetail";
import useDualThemeClass from "hooks/useDualThemeClass";
import FileUpload from "./FileUpload";
import AddressList from "./AddressList";
import "./index.scss";

const COMPONENT_CLASS = "airdrop-tool";

export default function AirdropTool() {
  const [CLASS, CHILD_CLASS] = useDualThemeClass({
    main: COMPONENT_CLASS,
    el: "child",
  });

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
        <TokenDetail></TokenDetail>
      </div>
    </div>
  );
}
