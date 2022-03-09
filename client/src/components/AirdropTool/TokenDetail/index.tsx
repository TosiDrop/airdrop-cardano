import { Button, InputNumber } from "@arco-design/web-react";
import { IconSend } from "@arco-design/web-react/icon";
import { useState } from "react";
import { useSelector, RootStateOrAny } from "react-redux";
import "./index.scss";

const COMPONENT_CLASS = "token-detail";

export default function TokenDetail() {
  const { selectedToken, addressArray, totalAmountToAirdrop } = useSelector(
    (state: RootStateOrAny) => state.global
  );

  const addressArrayLength = addressArray.length;

  const sendToken = () => {
    console.log(`Sending ${totalAmountToAirdrop} ${selectedToken.name}...`);
  };

  return (
    <div className={COMPONENT_CLASS}>
      <div className={`${COMPONENT_CLASS}__row`}>
        <span>Balance in wallet</span>
        <span>
          {(
            selectedToken.amount / Math.pow(10, selectedToken.decimals)
          ).toFixed(2)}{" "}
          {selectedToken.name}
        </span>
      </div>
      <div className={`${COMPONENT_CLASS}__row`}>
        <span>Total tokens to be airdropped</span>
        <span>
          {totalAmountToAirdrop} {selectedToken.name}
        </span>
      </div>
      <div className={`${COMPONENT_CLASS}__row`}>
        <span>Fee</span>
        <span>0.3 ADA</span>
      </div>
      <div className={`${COMPONENT_CLASS}__row`}>
        <Button
          onClick={sendToken}
          disabled={
            totalAmountToAirdrop === 0 ||
            selectedToken.name === "" ||
            addressArrayLength === 0
          }
        >
          Airdrop
          <IconSend />
        </Button>
      </div>
    </div>
  );
}
