import Head from "next/head";
import Link from "next/link";
import LegalLayout, { TocItem } from "../components/legal/LegalLayout";
/* eslint-disable react/no-unescaped-entities */

const TOC: TocItem[] = [
  { id: "s1", label: "What Candleweb is" },
  { id: "s2", label: "Who can use it" },
  { id: "s3", label: "Your account" },
  { id: "s4", label: "Exchange access" },
  { id: "s5", label: "Bots and decisions" },
  { id: "s6", label: "Your content" },
  { id: "s7", label: "Trading risk" },
  { id: "s8", label: "Fees" },
  { id: "s9", label: "Availability" },
  { id: "s10", label: "Acceptable use" },
  { id: "s11", label: "Liability" },
  { id: "s12", label: "Ending the agreement" },
  { id: "s13", label: "Changes" },
  { id: "s14", label: "Law and contact" },
];

export default function TermsOfService() {
  return (
    <>
      <Head>
        <title>Terms of Service | Candleweb</title>
        <meta
          name="description"
          content="The terms that govern your use of Candleweb — exchange access, trading risk and liability covered plainly."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <LegalLayout
        active="terms"
        title="Terms of Service"
        updated="28 August 2026"
        intro="These terms govern your use of Candleweb. They are written to be read, not to be skimmed past — the sections on exchange access, trading risk and liability are the ones that matter most."
        toc={TOC}
      >
        <section className="legal-sec" id="s1">
          <h2>1. What Candleweb is</h2>
          <div className="legal-keybox">
            <b>In short</b>
            <p>
              Candleweb is infrastructure for agentic trading. We send market
              data to a trading agent, receive its decision, and place and manage
              the resulting order on an exchange account you own.
            </p>
            <p>
              We are not an investment adviser, fund manager, broker-dealer or
              custodian. We do not give financial advice, we do not manage money,
              and we never hold your funds.
            </p>
          </div>
          <p>
            Candleweb is operated by Candleweb Ltd ("Candleweb", "we", "us").
            Registration details and registered address are set out in section
            14.
          </p>
          <p>
            Nothing on our website, in our product, or in any output produced by
            CandleAI or by bot review is a recommendation to buy or sell any
            asset, or advice about whether any transaction is suitable for you.
            All trading decisions are yours, whether you make them yourself, write
            the logic that makes them, or choose to let CandleAI make them on
            your behalf within limits you set.
          </p>
        </section>

        <section className="legal-sec" id="s2">
          <h2>2. Who can use Candleweb</h2>
          <p>
            You may use Candleweb if you are at least 18 years old, legally able
            to enter into a contract, and not barred from using our services or
            from trading digital assets under the laws that apply to you.
          </p>
          <p>
            You are responsible for determining whether your use of Candleweb,
            and your trading activity, is lawful where you live. If it is not, do
            not use the service.
          </p>
          <p>
            You may not use Candleweb if you are subject to sanctions, or located
            in a jurisdiction subject to comprehensive sanctions, that would make
            providing the service to you unlawful.
          </p>
        </section>

        <section className="legal-sec" id="s3">
          <h2>3. Your account</h2>
          <p>
            You are responsible for everything that happens under your account,
            including trades placed by any bot you connect. Keep your login
            credentials and your developer key secure. Your developer key
            authorises trading decisions on your account — treat it as you would
            a password.
          </p>
          <p>
            Tell us promptly if you believe your account or your developer key
            has been compromised. You can regenerate your developer key at any
            time from the dashboard, which takes effect immediately.
          </p>
          <p>
            One person or organisation, one account. Do not share access or
            resell access to Candleweb.
          </p>
        </section>

        <section className="legal-sec" id="s4">
          <h2>4. Exchange access and your funds</h2>
          <div className="legal-keybox">
            <b>We never hold your money</b>
            <p>
              Candleweb has no wallet, no pooled balance and no deposit address.
              Your funds remain in an exchange account in your own name at all
              times. We act only through API keys you create and can revoke.
            </p>
          </div>
          <p>
            You grant us access by adding API keys with trade permission. We ask
            you not to grant withdrawal permission, and we will never use it if
            you do. If we detect that a key carries withdrawal permission we will
            flag it and ask you to replace it.
          </p>
          <p>
            Amounts you "allocate" to a trade are a limit enforced by Candleweb,
            not by your exchange. Your funds are not moved, locked or held in
            escrow; we simply refuse orders from a trade that would exceed the
            amount you set aside for it.
          </p>
          <p>
            You can revoke our access at any moment by deleting the key on your
            exchange. Orders already placed and stop instructions already resting
            with the exchange are not affected by revocation, and you remain
            responsible for managing any position that is open at that time.
          </p>
          <p>
            Your relationship with your exchange is governed by that exchange's
            own terms. Candleweb holds broker partnerships with certain
            exchanges; this does not make us a party to your account with them,
            and does not change who holds your funds.
          </p>
        </section>

        <section className="legal-sec" id="s5">
          <h2>5. Bots, decisions and execution</h2>
          <p>
            You choose which bot decides for each trade — your own, or CandleAI.
            In both cases the decision is acted on within limits you configure:
            risk per trade, allocated capital, maximum position size, direction
            and stop behaviour.
          </p>
          <p>
            We will make reasonable efforts to deliver market data on time, to
            relay decisions promptly, and to place and manage orders as
            instructed. We do not guarantee that every candle is delivered, that
            every decision is received, or that every order is filled at any
            particular price. Markets gap, exchanges go down, connections fail,
            and orders can be rejected or partially filled.
          </p>
          <p>
            If your bot does not respond within the timeout you set, we apply the
            fallback rule you chose for that bot. Stop instructions remain in
            force regardless.
          </p>
          <p>
            <strong>CandleAI.</strong> Where you choose CandleAI, we write the
            decision logic. We do not guarantee any outcome, we do not promise
            profit, and CandleAI's past behaviour is not an indication of how it
            will behave in future. You remain responsible for the limits you set
            and for the decision to switch it on.
          </p>
          <p>
            <strong>Bot review.</strong> Review produces observations about your
            past trades and suggestions you may choose to apply. Suggestions are
            not advice and are not predictions. We never change your prompt or
            your settings for you.
          </p>
        </section>

        <section className="legal-sec" id="s6">
          <h2>6. Your content and your strategy</h2>
          <p>
            Your prompts, rules, bot configurations and trade history remain
            yours. You grant us only the licence we need to operate the service
            for you: to store this material, process it to run your trades, and
            analyse it to produce your own bot review.
          </p>
          <p>
            We do not use your prompts or strategies to trade on our own account,
            we do not share them with other users, and we do not sell them. Where
            we use aggregated, de-identified data to improve the service, it will
            not identify you or reveal your strategy.
          </p>
          <p>
            You confirm that you have the right to submit whatever you connect to
            Candleweb, and that it does not infringe anyone else's rights.
          </p>
        </section>

        <section className="legal-sec" id="s7">
          <h2>7. Trading risk</h2>
          <div className="legal-warnbox">
            <b>You can lose all of your money</b>
            <p>
              Trading digital assets carries substantial risk. Prices move
              sharply and without warning, and automated systems can lose money
              faster than a person would. Never allocate money you cannot afford
              to lose entirely.
            </p>
          </div>
          <p>
            Automation does not reduce market risk. A bot that performed well in
            one period can lose in the next. Stop-losses reduce but do not
            eliminate loss: in fast markets an order may fill materially below
            the stop price, and an exchange outage may prevent a stop from
            executing at all.
          </p>
          <p>
            We make no representation about the performance of any strategy,
            including CandleAI. Past results, whether shown in your own records or
            anywhere else, do not indicate future results.
          </p>
        </section>

        <section className="legal-sec" id="s8">
          <h2>8. Fees</h2>
          <p>
            Current fees are set out on our pricing page. Fees are for access to
            the service. We do not take a share of your trading profits and we do
            not charge a commission on your trades. Exchange trading fees, funding
            fees and network fees are charged by your exchange or provider, not by
            us.
          </p>
          <p>
            Where you purchase a course through Candleweb Academy, the amount
            stated is a course fee, payable once, and is separate from any
            Candleweb service fee.
          </p>
          <p>
            We will give reasonable notice before changing fees. Continuing to
            use the service after a change takes effect means you accept the new
            fees.
          </p>
        </section>

        <section className="legal-sec" id="s9">
          <h2>9. Availability and changes to the service</h2>
          <p>
            We aim to keep Candleweb running continuously, but we do not
            guarantee uninterrupted availability. We may suspend the service for
            maintenance, and parts of it depend on third parties — exchanges,
            data providers, payment processors — whose availability we do not
            control.
          </p>
          <p>
            We may add, change or withdraw features. If we withdraw something you
            depend on, we will give reasonable notice where we can.
          </p>
        </section>

        <section className="legal-sec" id="s10">
          <h2>10. Acceptable use</h2>
          <p>You must not use Candleweb to:</p>
          <ul>
            <li>
              break any law that applies to you, or to trade on information you
              should not have;
            </li>
            <li>
              manipulate a market, including wash trading, spoofing or layering;
            </li>
            <li>
              place load on our systems beyond documented rate limits, or attempt
              to circumvent them;
            </li>
            <li>
              gain unauthorised access to our systems, another user's account, or
              any exchange account not your own;
            </li>
            <li>
              resell, sublicense or white-label the service without our written
              agreement.
            </li>
          </ul>
          <p>
            We may suspend an account that appears to be doing any of these, and
            will tell you why where we are permitted to.
          </p>
        </section>

        <section className="legal-sec" id="s11">
          <h2>11. Limitation of liability</h2>
          <p>
            Candleweb is provided as-is. To the fullest extent the law allows, we
            exclude implied warranties of merchantability, fitness for a
            particular purpose and non-infringement.
          </p>
          <p>
            We are not liable for trading losses. That includes losses arising
            from decisions made by your bot or by CandleAI, from orders that
            filled at a worse price than expected, from stops that did not
            execute as intended, from exchange outages or rejections, or from
            market movement of any kind.
          </p>
          <p>
            Where we are found liable despite the above, our total liability to
            you in any twelve-month period is limited to the fees you paid us for
            the service in that period.
          </p>
          <p>
            Nothing in these terms excludes liability that cannot be excluded by
            law, including liability for fraud or for death or personal injury
            caused by negligence.
          </p>
        </section>

        <section className="legal-sec" id="s12">
          <h2>12. Ending the agreement</h2>
          <p>
            You can stop using Candleweb at any time. Pause or delete your
            trades, revoke your API keys on your exchange, and close your account
            from settings. Closing your account does not close positions that are
            open on your exchange — those remain yours to manage.
          </p>
          <p>
            We may suspend or close your account if you breach these terms, if we
            are required to by law, or if we stop offering the service. Except
            where the law requires otherwise or you have seriously breached these
            terms, we will give you reasonable notice and time to wind down.
          </p>
        </section>

        <section className="legal-sec" id="s13">
          <h2>13. Changes to these terms</h2>
          <p>
            We may update these terms. When we make a material change we will
            tell you by email or in the product before it takes effect, and
            update the date at the top of this page. If you do not accept a
            change, stop using the service before it takes effect.
          </p>
        </section>

        <section className="legal-sec" id="s14">
          <h2>14. Governing law and contact</h2>
          <p>
            These terms are governed by the laws of the Federal Republic of
            Nigeria, and the courts of Nigeria have exclusive jurisdiction,
            except where mandatory consumer protection law in your own country
            gives you additional rights.
          </p>
          <div className="legal-tw">
            <table className="legal-table">
              <tbody>
                <tr>
                  <td>Entity</td>
                  <td>Candleweb Ltd — [registration number]</td>
                </tr>
                <tr>
                  <td>Registered address</td>
                  <td>[registered address]</td>
                </tr>
                <tr>
                  <td>Email</td>
                  <td>legal@candleweb.io</td>
                </tr>
                <tr>
                  <td>Support</td>
                  <td>support@candleweb.io</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="legal-foot">
            <b>Related:</b> our <Link href="/privacy">Privacy Policy</Link>{" "}
            explains what data we hold and why. Our{" "}
            <Link href="/privacy">Risk Disclosure</Link> sets out trading risk in
            more detail.
          </p>
        </section>
      </LegalLayout>
    </>
  );
}
