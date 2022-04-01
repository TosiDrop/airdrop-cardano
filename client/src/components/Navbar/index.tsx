import { useEffect, useState } from "react";
import { RootStateOrAny, useSelector } from "react-redux";
import ThemeSwitch from "components/Navbar/ThemeSwitch";
import { Button, Popover } from "@arco-design/web-react";
import useDualThemeClass from "hooks/useDualThemeClass";
import useWallet from "hooks/useWallet";
import { supportedWallets, shortenAddress, ClassNames } from "utils";
import Logo from "assets/logo.png";
import "./index.scss";

const CONTAINER_CLASS = "navbar";

export default function Navbar() {
  const CLASS = useDualThemeClass({
    className: CONTAINER_CLASS,
  });
  const { enableWallet } = useWallet();
  const [btnText, setBtnText] = useState("Connect wallet");
  const walletAddress = useSelector(
    (state: RootStateOrAny) => state.global.walletAddress
  );
  const loadingApi = useSelector(
    (state: RootStateOrAny) => state.global.loadingApi
  );
  const [selectedWallet, setSelectedWallet] = useState("");

  useEffect(() => {
    if (walletAddress) {
      setBtnText(shortenAddress(walletAddress));
    }
    const selectedWalletInLS = localStorage.getItem("wallet");
    if (selectedWalletInLS) {
      setSelectedWallet(selectedWalletInLS);
    }
  }, [walletAddress]);

  const selectWalletBtns = () => {
    return (
      <div className={`${CONTAINER_CLASS}__select-wallet`}>
        {supportedWallets.map((wallet) => {
          const isSelectedWallet = selectedWallet === wallet.name;
          return (
            <Button
              key={wallet.name}
              onClick={() => enableWallet(wallet.name)}
              disabled={isSelectedWallet}
            >
              {wallet.displayName}
            </Button>
          );
        })}
      </div>
    );
  };

  return (
    <div className={CLASS}>
      <ThemeSwitch></ThemeSwitch>
      <Popover
        trigger="hover"
        position="bottom"
        title="Select Wallet"
        content={selectWalletBtns()}
      >
        <Button
          className={`${ClassNames.TOSIDROP_BTN} ${CONTAINER_CLASS}__button`}
        >
          {btnText}
          {loadingApi ? <div className="lds-dual-ring"></div> : null}
        </Button>
      </Popover>
      <img className={`${CONTAINER_CLASS}__logo`} src={Logo} alt="logo"></img>
    </div>
  );
}
