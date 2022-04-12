import type { AppProps } from "next/app";
import { Provider } from "react-redux";
import store from "reducers/store";
import "styles/globals.css";
import "styles/App.scss";
import "components/PopUp/index.scss"
import "components/Navbar/index.scss"
import "components/Navbar/ThemeSwitch/index.scss"
import "components/AirdropTool/index.scss"
import "components/AirdropTool/TokenDetail/index.scss"
import "components/AirdropTool/AirdropTransaction/index.scss"
import "components/AirdropTool/AddressList/index.scss"
import "@arco-design/web-react/dist/css/arco.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <Component {...pageProps} />
    </Provider>
  );
}

export default MyApp;
