import { useSelector, RootStateOrAny } from "react-redux";
import PopUp from "components/AirdropTool/PopUp";
import { Button } from "@arco-design/web-react";
import { IconSend } from "@arco-design/web-react/icon";
import "./index.scss";
import { useState } from "react";
import { AddressAmountMap, AirdropRequestBody, PopUpType, Token } from "utils";

const COMPONENT_CLASS = "token-detail";

export default function TokenDetail() {
  const { selectedToken, addressArray, totalAmountToAirdrop } = useSelector(
    (state: RootStateOrAny) => state.global
  );
  const { walletAddress } = useSelector(
    (state: RootStateOrAny) => state.blockchain
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

    if (
      selectedToken.amount <
      totalAmountToAirdrop * Math.pow(10, selectedToken.decimals)
    ) {
      setPopUpProps({
        show: true,
        type: PopUpType.FAIL,
        text: "Balance in wallet is not enough",
      });
      return;
    }

    const requestBody = prepareBody(walletAddress, selectedToken, addressArray);

    setPopUpProps({
      show: true,
      type: PopUpType.LOADING,
      text: `Sending ${totalAmountToAirdrop} ${selectedToken.name}`,
    });

    /**
     * axios happens here
     */
    setTimeout(() => {
      setPopUpProps({
        show: true,
        type: PopUpType.SUCCESS,
        text: "Airdrop successful",
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

function prepareBody(
  walletAddress: string,
  selectedToken: Token,
  addressArray: AddressAmountMap[]
) {
  const body: AirdropRequestBody = {
    source_addresses: [walletAddress],
    token_name: `${selectedToken.policyId}.${selectedToken.nameHex}`,
    addresses: addressArray.map((addr: AddressAmountMap) => ({
      [addr.address]: addr.amount * Math.pow(10, selectedToken.decimals),
    })),
  };
  return body
}
