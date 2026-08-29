import Head from "next/head";
import AuthPanel from "../components/Auth/AuthPanel";

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Log in | Candleweb</title>
        <meta
          name="description"
          content="Log in to Candleweb with Google or a wallet."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AuthPanel initialMode="login" />
    </>
  );
}
