import "@arco-design/web-react/dist/css/arco.css";
import "../styles/globals.css";
import theme from "styles/Theme.module.scss";
import type { AppProps } from "next/app";

function MyApp({ Component, pageProps }: AppProps) {
  return <div className={`${theme.Wrapper} ${theme.Light}`}>
     <Component {...pageProps} />
  </div>;
}

export default MyApp;
