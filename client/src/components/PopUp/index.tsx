import useDualThemeClass from "hooks/useDualThemeClass";
import Logo from "assets/logo.png";
import { ClassNames, PopUpType } from "utils";
import { Button } from "@arco-design/web-react";
import { IconCheckCircle, IconCloseCircle } from "@arco-design/web-react/icon";
import { useDispatch, useSelector, RootStateOrAny } from "react-redux";
import "./index.scss";
import usePopUp from "hooks/usePopUp";

const CONTAINER_CLASS = "popup";

export default function PopUp() {
  const dispatch = useDispatch();
  const { popUp } = useSelector((state: RootStateOrAny) => state.global);
  const { show, text, type } = popUp;
  const { closePopUp } = usePopUp();

  const CLASS = useDualThemeClass({
    className: CONTAINER_CLASS,
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

  return (
    <div
      className={`${getVisibilityClass(
        show,
        CONTAINER_CLASS + "-container"
      )} ${CONTAINER_CLASS}-container`}
    >
      <div className={`${CLASS} ${getVisibilityClass(show, CONTAINER_CLASS)}`}>
        <h2>{text}</h2>
        {getSymbol(type)}
        <Button
          onClick={() => closePopUp()}
          className={ClassNames.TOSIDROP_BTN}
        >
          Close
        </Button>
      </div>
    </div>
  );
}

function getVisibilityClass(show: boolean, classname: string) {
  if (show) {
    return `${classname}-show`;
  } else {
    return `${classname}-hide`;
  }
}
