import { Html, Head, Main, NextScript } from 'next/document'

/* One preference for the whole product, applied before first paint so neither
   the landing pages nor the dashboard flash the wrong theme.

   Both attributes are set from the same value: the public stylesheets key off
   `data-site-theme`, the dashboard's off `data-theme`. Light is the default.
   `cw-site-theme` is read once as a fallback so anyone who had already chosen a
   theme on the public pages keeps it when this build first loads. */
const themeScript = `try{var k=localStorage.getItem('cw-theme');if(k!=='light'&&k!=='dark'){var o=localStorage.getItem('cw-site-theme');k=(o==='dark')?'dark':'light';localStorage.setItem('cw-theme',k);}var d=document.documentElement;d.dataset.theme=k;d.dataset.siteTheme=k;}catch(e){var d2=document.documentElement;d2.dataset.theme='light';d2.dataset.siteTheme='light';}`

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
