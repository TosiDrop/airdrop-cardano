import '../styles/globals.css'
import '../styles/App.scss'
import type { AppProps } from 'next/app'
import { Provider } from 'react-redux'
import store from '../reducers/store'

function MyApp({ Component, pageProps }: AppProps) {
  return <Provider store={store}>
  <Component {...pageProps} />
  </Provider>
}

export default MyApp
