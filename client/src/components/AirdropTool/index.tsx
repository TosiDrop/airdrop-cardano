import { useSelector, RootStateOrAny, useDispatch } from "react-redux";
import TokenSelect from "./TokenSelect";
import TokenDetail from "./TokenDetail";
import FileUpload from "./FileUpload";
import AddressList from "./AddressList";
import PopUp from "components/PopUp";
import useDualThemeClass from "hooks/useDualThemeClass";
import {
  AddressAmount,
  AirdropRequestBody,
  Token,
  PopUpType,
  lovelaceToAda,
} from "utils";
import { useState } from "react";
import axios from "axios";
import "./index.scss";
import usePopUp from "hooks/usePopUp";

const COMPONENT_CLASS = "airdrop-tool";

export default function AirdropTool() {
  const dispatch = useDispatch();

  const { setPopUpLoading, setPopUpSuccess, setPopUpError } = usePopUp();
  const [txFee, setTxFee] = useState(0);
  const [adaToSpend, setAdaToSpend] = useState(0);
  const [isAbleToAirdrop, setTsAbleToAirdrop] = useState(false);

  const [CLASS, CHILD_CLASS] = useDualThemeClass({
    main: COMPONENT_CLASS,
    el: "child",
  });

  const {
    selectedToken,
    addressArray,
    totalAmountToAirdrop,
    walletAddress,
    addressContainingAda,
  } = useSelector((state: RootStateOrAny) => state.global);

  const sendToken = async () => {
    setPopUpLoading(`Sending ${totalAmountToAirdrop} ${selectedToken.name}`);

    const requestBody = prepareBody(
      walletAddress,
      selectedToken,
      addressArray,
      totalAmountToAirdrop,
      addressContainingAda
    );
    const url = process.env.REACT_APP_API_TX;

    try {
      const submitAirdrop = await axios.post(
        `${url}/api/v0/submit`,
        requestBody
      );
      const cborHexInString = submitAirdrop.data;
      /**
       * Hi TOM! :)
       * please continue here
       */
    } catch (e: any) {}
  };

  const validateAirdropRequest = async () => {
    setPopUpLoading("Validating request");

    const requestBody = prepareBody(
      walletAddress,
      selectedToken,
      addressArray,
      totalAmountToAirdrop,
      addressContainingAda
    );

    const url = process.env.REACT_APP_API_TX;

    try {
      const txData = await axios.post(`${url}/api/v0/validate`, requestBody);
      const adaToSpendForTxInAda = lovelaceToAda(
        txData.data.spend_amounts.lovelace
      );
      const txFeeInAda = lovelaceToAda(txData.data.tx_fee);
      setTxFee(txFeeInAda);
      setAdaToSpend(adaToSpendForTxInAda);
      setTsAbleToAirdrop(true);
      setPopUpSuccess(
        `Airdrop is validated. You can proceed with the airdrop.`
      );
    } catch (e: any) {
      switch (e.response?.status) {
        case 406: {
          setPopUpError("Balance in wallet is not enough");
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
        <TokenDetail
          adaToSpend={adaToSpend}
          fee={txFee}
          sendToken={sendToken}
          validateAirdropRequest={validateAirdropRequest}
          isAbleToAirdrop={isAbleToAirdrop}
        ></TokenDetail>
      </div>
    </div>
  );
}

function prepareBody(
  walletAddress: string,
  selectedToken: Token,
  addressArray: AddressAmount[],
  totalAmountToAirdrop: number,
  addressContainingAda: AddressAmount[]
) {
  const sourceAddresses = [];
  let estimatedAdaNeeded = (2 + addressArray.length * 2) * Math.pow(10, 6);
  let totalAmountToAirdropInCompleteDecimal = totalAmountToAirdrop;

  for (let addressAmountObject of selectedToken.addressContainingToken) {
    if (totalAmountToAirdropInCompleteDecimal < 0 && estimatedAdaNeeded < 0)
      break;
    totalAmountToAirdropInCompleteDecimal -= addressAmountObject.amount;
    if (addressAmountObject.adaAmount) {
      estimatedAdaNeeded -= addressAmountObject.adaAmount;
    }
    sourceAddresses.push(addressAmountObject.address);
  }

  for (let addressAmountObject of addressContainingAda) {
    if (estimatedAdaNeeded < 0) break;
    if (!sourceAddresses.includes(addressAmountObject.address)) {
      estimatedAdaNeeded -= addressAmountObject.amount;
    }
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
