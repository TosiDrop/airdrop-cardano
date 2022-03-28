import { useSelector, RootStateOrAny } from "react-redux";

export default function useDualThemeClassBtn() {
  const darkTheme = useSelector(
    (state: RootStateOrAny) => state.global.darkTheme
  );
  const MAIN_CLASS = 'tosidrop-btn';

  if (darkTheme) {
    return `${MAIN_CLASS} ${MAIN_CLASS}-dark` 
  } else {
    return `${MAIN_CLASS} ${MAIN_CLASS}-light` 
  }
}
