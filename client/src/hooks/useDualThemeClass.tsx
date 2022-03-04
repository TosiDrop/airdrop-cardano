import { useSelector, RootStateOrAny } from "react-redux";

interface Props {
  main: string;
  el: string;
}

export default function useDualThemeClass({ main, el }: Props) {
  const darkTheme = useSelector(
    (state: RootStateOrAny) => state.global.darkTheme
  );
  const MAIN_CLASS = main;
  const ADD_CLASS = MAIN_CLASS + (darkTheme ? "-dark" : "-light");
  const CLASS = `${MAIN_CLASS} ${ADD_CLASS}`;
  const EL_CLASS = `${MAIN_CLASS}__${el} ${ADD_CLASS}__${el}`;
  return [CLASS, EL_CLASS];
}
