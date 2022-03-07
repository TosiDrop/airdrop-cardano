import { Button, InputNumber } from "@arco-design/web-react";
import { IconSend } from "@arco-design/web-react/icon";
import { useState } from "react";
import { useSelector, RootStateOrAny } from "react-redux";
import "./index.scss";

const COMPONENT_CLASS = "token-detail";

export default function TokenDetail() {
  const { selectedToken, addressArray, totalTokenToAirdrop } = useSelector(
    (state: RootStateOrAny) => state.global
  );

  const addressArrayLength = addressArray.length;

  const sendToken = () => {
    console.log(`Sending ${totalTokenToAirdrop} ${selectedToken.name}...`);
  };

  return (
    <div className={COMPONENT_CLASS}>
      <div className={`${COMPONENT_CLASS}__row`}>
        <span>Balance in wallet</span>
        <span>
          {(selectedToken.amount / 1000000).toFixed(2)} {selectedToken.name}
        </span>
      </div>
      <div className={`${COMPONENT_CLASS}__row`}>
        <span>Total tokens to be airdropped</span>
        <span>
          {totalTokenToAirdrop} {selectedToken.name}
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
            totalTokenToAirdrop === 0 ||
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
