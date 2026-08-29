import Head from "next/head";
import AuthPanel from "../components/Auth/AuthPanel";

export default function RegisterPage() {
  return (
    <>
      <Head>
        <title>Create account | Candleweb</title>
        <meta
          name="description"
          content="Create a Candleweb account with Google or a wallet, then connect your exchange and point your agent at us."
        />
        <meta
          name="keywords"
          content="AI crypto trading, trading bots, automation, CandleWeb, CandleAI"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AuthPanel initialMode="signup" />
    </>
  );
}
