import { useSelector, RootStateOrAny } from "react-redux";
import TokenSelect from "./TokenSelect";
import TokenDetail from "./TokenDetail";
import FileUpload from "./FileUpload";
import AddressList from "./AddressList";
import PopUp from "./PopUp";
import useDualThemeClass from "hooks/useDualThemeClass";
import { AddressAmount, AirdropRequestBody, Token, PopUpType } from "utils";
import { useState } from "react";
import axios from "axios";
import {
  TransactionUnspentOutput,
  Transaction,
  TransactionWitnessSet,
} from "@emurgo/cardano-serialization-lib-asmjs";
import "./index.scss";

const Buffer = require("buffer/").Buffer;
const COMPONENT_CLASS = "airdrop-tool";

export default function AirdropTool() {
  const [CLASS, CHILD_CLASS] = useDualThemeClass({
    main: COMPONENT_CLASS,
    el: "child",
  });

  const { selectedToken, addressArray, totalAmountToAirdrop, walletAddress } =
    useSelector((state: RootStateOrAny) => state.global);

  const [popUpProps, setPopUpProps] = useState({
    show: false,
    type: PopUpType.LOADING,
    text: "",
  });

  const sendToken = async () => {
    setPopUpProps({
      show: true,
      type: PopUpType.LOADING,
      text: "Validating request",
    });

    const requestBody = prepareBody(
      walletAddress,
      selectedToken,
      addressArray,
      totalAmountToAirdrop
    );
    const url = process.env.REACT_APP_API_TX;

    try {
      const txData = await axios.post(`${url}/api/v0/validate`, requestBody);
      /**
       * TODO: get estimated total fee
       */
      setPopUpProps({
        show: true,
        type: PopUpType.LOADING,
        text: `Sending ${totalAmountToAirdrop} ${selectedToken.name}`,
      });
      const submitAirdrop = await axios.post(
        `${url}/api/v0/submit`,
        requestBody
      );
      const cborHexInString = submitAirdrop.data;
      /**
       * Hi TOM! :)
       * please continue here
       */
    } catch (e: any) {
      console.log(e);
      switch (e.response?.status) {
        case 406: {
          setPopUpProps({
            show: true,
            type: PopUpType.FAIL,
            text: "Balance in wallet is not enough",
          });
          return;
        }
      }
    }
  };

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
        <TokenDetail sendToken={sendToken}></TokenDetail>
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
  addressArray: AddressAmount[],
  totalAmountToAirdrop: number
) {
  const sourceAddresses = [];
  let estimatedAdaNeeded = (2 + addressArray.length * 2) * Math.pow(10, 6);
  let totalAmountToAirdropInCompleteDecimal = totalAmountToAirdrop;
  for (let addressAmountObject of selectedToken.addressContainingToken) {
    totalAmountToAirdropInCompleteDecimal -= addressAmountObject.amount;
    if (addressAmountObject.adaAmount) {
      estimatedAdaNeeded -= addressAmountObject.adaAmount;
    }
    sourceAddresses.push(addressAmountObject.address);
    if (totalAmountToAirdropInCompleteDecimal < 0 && estimatedAdaNeeded < 0)
      break;
  }
  const body: AirdropRequestBody = {
    source_addresses: sourceAddresses,
    change_address: walletAddress,
    token_name: `${selectedToken.policyId}.${selectedToken.nameHex}`,
    addresses: addressArray.map((addr: AddressAmount) => ({
      [addr.address]: addr.amount * Math.pow(10, selectedToken.decimals),
    })),
  };
  return body;
}
