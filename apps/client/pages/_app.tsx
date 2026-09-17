import Layout from "../components/Layout";
import "ui/styles/tailwind.css";
import "ui/styles/global.css";
import "../styles/tailwind.css";
import "../styles/globals.css";
import "../styles/public-shell.css";
import "../styles/landing.css";
import "../styles/about.css";
import "../styles/academy.css";
import "../styles/candleai.css";
import "../styles/legal.css";
import "../styles/auth.css";
import "../styles/docs.css";
import "../styles/dashboard-focus.css";
import "../styles/blog.css";
import "../styles/blog-detail.css";
import type { AppProps } from "next/app";
import { Toaster } from "react-hot-toast";
import { Provider } from "react-redux";
import { wrapper } from "../redux/store";
import Script from "next/script";

export default function App({ Component, pageProps }: AppProps) {
  const { store, props } = wrapper.useWrappedStore(pageProps);

  return (
    <>
      <Provider store={store}>
        <Layout>
          <Component {...props.pageProps} />
          <Script
            id="custom-script"
            strategy="afterInteractive" // Load script after the page is interactive
            dangerouslySetInnerHTML={{
              __html: `
            var _scq = _scq || []; 
            var _scs = _scs || {};  
            _scs.teamId = 'Xqd38aWOFtUNtTMZiW1rBj'; 
            (function() { 
              var dc = document.createElement('script'); 
              dc.type = 'text/javascript';
              dc.async = true;
              dc.src = '//cdn.sendx.io/prod/Xqd38aWOFtUNtTMZiW1rBj.js';  
              var s = document.getElementsByTagName('script')[0];
              s.parentNode.insertBefore(dc, s); 
            })();
          `,
            }}
          />
        </Layout>

        <Toaster position="top-center" reverseOrder={false} />
      </Provider>
    </>
  );
}
