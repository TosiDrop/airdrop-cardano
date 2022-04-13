import React, { useState } from "react";
import style from "./ToolSelector.module.scss";
import { Radio } from "@arco-design/web-react";

const RadioGroup = Radio.Group;

const ToolSelector = () => {
  const [tool, setTool] = useState("airdrop");

  return (
    <RadioGroup
      className={style.ToolSelector}
      type="button"
      value={tool}
      onChange={setTool}
    >
      <Radio value="airdrop">airdrop</Radio>
      <Radio value="claim">claim</Radio>
    </RadioGroup>
  );
};

export default ToolSelector;
