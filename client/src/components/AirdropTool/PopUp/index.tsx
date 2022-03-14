import useDualThemeClass from "hooks/useDualThemeClass";
import Logo from "assets/logo.png";
import { PopUpType, PopUpProps } from "utils";
import "./index.scss";
import { Button } from "@arco-design/web-react";
import { IconCheckCircle, IconCloseCircle } from "@arco-design/web-react/icon";

const CONTAINER_CLASS = "popup";

export default function PopUp({ show, type, text, closePopUp }: PopUpProps) {
  const [CLASS, EL_CLASS] = useDualThemeClass({
    main: CONTAINER_CLASS,
    el: "btn",
  });

  const getLogoClass = () => {
    let logoClass = `${CONTAINER_CLASS}__symbol`;
    if (show) {
      logoClass += ` ${CONTAINER_CLASS}__symbol-loading`;
    }
    return logoClass;
  };

  const getSymbol = (type: PopUpType) => {
    switch (type) {
      case PopUpType.LOADING:
        return <img src={Logo} className={getLogoClass()}></img>;
      case PopUpType.FAIL:
        return (
          <IconCloseCircle
            className={`${CONTAINER_CLASS}__symbol ${CONTAINER_CLASS}__symbol-fail`}
          />
        );
      case PopUpType.SUCCESS:
        return (
          <IconCheckCircle
            className={`${CONTAINER_CLASS}__symbol ${CONTAINER_CLASS}__symbol-success`}
          />
        );
    }
  };

  return show ? (
    <div className={`${CONTAINER_CLASS}-container`}>
      <div className={CLASS}>
        <h2>{text}</h2>
        {getSymbol(type)}
        <Button onClick={() => closePopUp()} className={EL_CLASS}>
          Close
        </Button>
      </div>
    </div>
  ) : null;
}
