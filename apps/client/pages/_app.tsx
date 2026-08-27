import Layout from "../components/Layout";
import "ui/styles/tailwind.css";
import "ui/styles/global.css";
import "../styles/tailwind.css";
import "../styles/globals.css";
import "../styles/landing.css";
import "../styles/about.css";
import "../styles/blog.css";
import "../styles/blog-detail.css";
import type { AppProps } from "next/app";
import { Toaster } from "react-hot-toast";
import { Provider } from "react-redux";
import { wrapper } from "../redux/store";
import CookieConsent from "react-cookie-consent";
import Script from "next/script";

export default function App({ Component, pageProps }: AppProps) {
  const { store, props } = wrapper.useWrappedStore(pageProps);

  return (
    <>
      <Provider store={store}>
        <Layout>
          <Component {...props.pageProps} />
          <CookieConsent
            style={{
              background: "var(--card-bg)",
            }}
            buttonStyle={{
              background: "var(--primary)",
              borderRadius: "30px",
              fontWeight: "bold",
              padding: "8px 20px",
            }}
            buttonText={"Accept"}
          >
            This website uses cookies to enhance the user experience.
          </CookieConsent>
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
