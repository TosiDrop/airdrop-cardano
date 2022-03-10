import ReactDOM from "react-dom";
import App from "App";
import { Provider } from "react-redux";
import store from "./store";
import "@arco-design/web-react/dist/css/arco.css";
import "index.css";

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
);
