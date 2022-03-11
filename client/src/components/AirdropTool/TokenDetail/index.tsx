import { useSelector, RootStateOrAny } from "react-redux";
import PopUp from "components/AirdropTool/PopUp";
import { Button } from "@arco-design/web-react";
import { IconSend } from "@arco-design/web-react/icon";
import "./index.scss";
import { useState } from "react";
import { PopUpType } from "utils";

const COMPONENT_CLASS = "token-detail";

export default function TokenDetail() {
  const { selectedToken, addressArray, totalAmountToAirdrop } = useSelector(
    (state: RootStateOrAny) => state.global
  );

  const [popUpProps, setPopUpProps] = useState({
    show: false,
    type: PopUpType.LOADING,
    text: "",
  });

  const addressArrayLength = addressArray.length;

  const sendToken = () => {
    /**
     * Check then send tokens
     */
    setPopUpProps({
      show: true,
      type: PopUpType.LOADING,
      text: `Sending ${totalAmountToAirdrop} ${selectedToken.name}`,
    });
    setTimeout(() => {
      setPopUpProps({
        show: false,
        type: PopUpType.LOADING,
        text: "",
      });
    }, 5000);
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
      <PopUp
        {...popUpProps}
        closePopUp={() =>
          setPopUpProps({
            show: false,
            type: PopUpType.LOADING,
            text: "",
          })
        }
      ></PopUp>
    </div>
  );
}
