import { Html, Head, Main, NextScript } from 'next/document'

const themeScript = `try{var t=localStorage.getItem('cw-dash-theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}}catch(e){}
try{var s=localStorage.getItem('cw-site-theme');document.documentElement.dataset.siteTheme=(s==='dark')?'dark':'light';}catch(e){document.documentElement.dataset.siteTheme='light';}`

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
