import { useDispatch } from "react-redux";
import { setPopUp } from "reducers/globalSlice";
import { PopUpType } from "utils";

const usePopUp = () => {
  const dispatch = useDispatch();
  const setPopUpError = (errorMessage: string) => {
    dispatch(
      setPopUp({
        show: true,
        type: PopUpType.FAIL,
        text: errorMessage,
      })
    );
  };
  const setPopUpLoading = (loadingMessage: string) => {
    dispatch(
      setPopUp({
        show: true,
        type: PopUpType.LOADING,
        text: loadingMessage,
      })
    );
  };
  const setPopUpSuccess = (successMessage: string) => {
    dispatch(
      setPopUp({
        show: true,
        type: PopUpType.SUCCESS,
        text: successMessage,
      })
    );
  };
  const closePopUp = () => {
    dispatch(
      setPopUp({
        show: false,
        type: PopUpType.SUCCESS,
        text: "",
      })
    );
  };
  return {
    setPopUpError,
    setPopUpLoading,
    setPopUpSuccess,
    closePopUp,
  };
};

export default usePopUp;
