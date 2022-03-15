import { useSelector, RootStateOrAny } from "react-redux";
import TokenSelect from "./TokenSelect";
import TokenDetail from "./TokenDetail";
import FileUpload from "./FileUpload";
import AddressList from "./AddressList";
import PopUp from "./PopUp";
import useDualThemeClass from "hooks/useDualThemeClass";
import { AddressAmountMap, AirdropRequestBody, Token, PopUpType } from "utils";
import { useState } from "react";
import axios from "axios";
import "./index.scss";

const COMPONENT_CLASS = "airdrop-tool";

export default function AirdropTool() {
  const [CLASS, CHILD_CLASS] = useDualThemeClass({
    main: COMPONENT_CLASS,
    el: "child",
  });

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

  const sendToken = () => {
    setPopUpProps({
      show: true,
      type: PopUpType.LOADING,
      text: "Validating request",
    });

    const requestBody = prepareBody(walletAddress, selectedToken, addressArray);
    const url = process.env.REACT_APP_API_TX;

    axios
      .post(`${url}/api/v0/validate`, requestBody)
      .then((res) => {
        console.log(res);
        setPopUpProps({
          show: true,
          type: PopUpType.LOADING,
          text: `Sending ${totalAmountToAirdrop} ${selectedToken.name}`,
        });
        axios.post(`${url}/api/v0/submit`, requestBody).then((res) => {
          console.log(res);
        });
      })
      .catch((e) => {
        switch (e.response.status) {
          case 406:
            setPopUpProps({
              show: true,
              type: PopUpType.FAIL,
              text: "Balance in wallet is not enough",
            });
            return;
        }
      });
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
  addressArray: AddressAmountMap[]
) {
  const body: AirdropRequestBody = {
    source_addresses: [walletAddress],
    token_name: `${selectedToken.policyId}.${selectedToken.nameHex}`,
    addresses: addressArray.map((addr: AddressAmountMap) => ({
      [addr.address]: addr.amount * Math.pow(10, selectedToken.decimals),
    })),
  };
  return body;
}

/*
const submit = async (API: any, signed_transaction: any) => {
  //convert hex string to bytes
  const txCli = Transaction.from_bytes(Buffer.from(signed_transaction, "hex"));
  //console.log("cbor bytes",txCli)
  const txBody = txCli.body();
  const witnessSet = txCli.witness_set();
  //this clears the dummy signature from the transaction
  witnessSet.vkeys()?.free();
  const transactionWitnessSet = TransactionWitnessSet.new();
  console.log(transactionWitnessSet);
  //build new unsigned transaction
  const tx = Transaction.new(
    txBody,
    TransactionWitnessSet.from_bytes(transactionWitnessSet.to_bytes())
  );
  //send to wallet for signature
  let txVkeyWitnesses = await api.signTx(
    Buffer.from(tx.to_bytes(), "utf8").toString("hex"),
    true
  );
  txVkeyWitnesses = TransactionWitnessSet.from_bytes(
    Buffer.from(txVkeyWitnesses, "hex")
  );
  transactionWitnessSet.set_vkeys(txVkeyWitnesses.vkeys());
  const signedTx = Transaction.new(tx.body(), transactionWitnessSet);
  // convert array to hex string
  const hexSigned = Buffer.from(signedTx.to_bytes(), "utf8").toString("hex");
  console.log(hexSigned);
  //submit transaction
  //const submittedTxHash =  await api.submitTx(Buffer.from(signedTx.to_bytes(), "utf8").toString("hex"));
  //window.alert("submitted, hash = "+ submittedTxHash)

  return {
    submit: submit,
  };
};
*/
