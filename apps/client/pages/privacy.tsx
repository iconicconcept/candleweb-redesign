import Head from "next/head";
import Link from "next/link";
import LegalLayout, { TocItem } from "../components/legal/LegalLayout";
/* eslint-disable react/no-unescaped-entities */

const TOC: TocItem[] = [
  { id: "p1", label: "What we collect" },
  { id: "p2", label: "Your exchange keys" },
  { id: "p3", label: "Your prompts" },
  { id: "p4", label: "Why we use it" },
  { id: "p5", label: "Who we share with" },
  { id: "p6", label: "Where data is held" },
  { id: "p7", label: "How long we keep it" },
  { id: "p8", label: "Your rights" },
  { id: "p9", label: "Security" },
  { id: "p10", label: "Cookies" },
  { id: "p11", label: "Children" },
  { id: "p12", label: "Changes and contact" },
];

function Table({
  head,
  rows,
}: {
  head?: [string, string];
  rows: [string, React.ReactNode][];
}) {
  return (
    <div className="legal-tw">
      <table className="legal-table">
        {head && (
          <thead>
            <tr>
              <th>{head[0]}</th>
              <th>{head[1]}</th>
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map(([label, value], index) => (
            <tr key={index}>
              <td>{label}</td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | Candleweb</title>
        <meta
          name="description"
          content="What Candleweb collects, why we hold it, and what we will never do with it — your exchange keys and your prompts covered first."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <LegalLayout
        active="privacy"
        title="Privacy Policy"
        updated="28 August 2026"
        intro="What we collect, why we hold it, and what we will never do with it. The two sections people care about most — your exchange keys and your prompts — are near the top."
        toc={TOC}
      >
        <section className="legal-sec" id="p1">
          <h2>1. What we collect</h2>
          <Table
            head={["Category", "What it includes"]}
            rows={[
              [
                "Account",
                "Email address, username, password hash. If you sign in with Google or a wallet, the identifier that provider returns.",
              ],
              [
                "Exchange access",
                "API key, secret and passphrase for exchanges you connect. Encrypted — see section 2.",
              ],
              [
                "Trading configuration",
                "Your trades: pair, timeframe, indicators, allocation, risk settings, which bot is assigned.",
              ],
              [
                "Bot configuration",
                "Bot name, platform, webhook URL, prompt or rules, model, developer key.",
              ],
              [
                "Trading activity",
                "Decisions received, orders placed, fills, stop movements, closed trades, and the market data behind each one.",
              ],
              [
                "Balances",
                "Balances and positions read from your exchange, so we can show them and enforce your limits.",
              ],
              [
                "Payments",
                "Handled by Paystack. We receive confirmation and the last four digits of a card — never full card numbers.",
              ],
              [
                "Technical",
                "IP address, browser and device type, timestamps, error logs.",
              ],
            ]}
          />
          <p>
            We do not collect your national identification number, your bank
            account details, or documents proving your identity, because we do
            not hold money and do not need them.
          </p>
        </section>

        <section className="legal-sec" id="p2">
          <h2>2. Your exchange keys</h2>
          <div className="legal-keybox">
            <b>What we ask for and what we can do with it</b>
            <p>
              API keys are stored encrypted at rest and are used only to read
              your balance and to place, manage and close orders on trades you
              configured. We ask you never to grant withdrawal permission, and we
              will not use it if you do.
            </p>
            <p>
              Keys are never shown back to you in full after saving, never
              written to logs, never sent to any third party, and never used for
              anything outside your own trades.
            </p>
          </div>
          <p>
            Delete the key on your exchange and our access ends immediately.
            Delete the connection in Candleweb and we remove our stored copy.
          </p>
        </section>

        <section className="legal-sec" id="p3">
          <h2>3. Your prompts and strategies</h2>
          <div className="legal-keybox">
            <b>Your strategy stays yours</b>
            <p>
              The prompt or rules you give us are stored so that bot review can
              compare what your bot was told to do against what it actually did.
              That is the only purpose.
            </p>
            <p>
              We do not run your prompt ourselves, we do not trade on it, we do
              not show it to other users, and we do not use it to train models —
              ours or anyone else's.
            </p>
          </div>
          <p>
            You can edit or delete a stored prompt at any time from the bot's
            settings. Deleting it removes it from future review; past trade
            records keep a note of which version was in use at the time, because
            a record you cannot reconstruct is not a record.
          </p>
        </section>

        <section className="legal-sec" id="p4">
          <h2>4. Why we use your data</h2>
          <ul>
            <li>
              <strong>To run the service</strong> — deliver market data, relay
              decisions, place and monitor orders, enforce your limits. This is
              necessary to perform our contract with you.
            </li>
            <li>
              <strong>To keep it working</strong> — diagnose failures,
              investigate a bot that stopped responding, monitor for abuse. Our
              legitimate interest in a functioning, secure service.
            </li>
            <li>
              <strong>To produce your bot review</strong> — analyse your own
              trades and prompt to generate recommendations for you. Part of the
              service you asked for.
            </li>
            <li>
              <strong>To contact you</strong> — service notices, failure alerts
              you switched on, and, if you opted in, occasional product email.
              You can turn marketing email off without losing service notices.
            </li>
            <li>
              <strong>To meet legal obligations</strong> — tax, accounting, and
              lawful requests from authorities.
            </li>
          </ul>
          <p>
            We do not sell your personal data, and we do not share it with
            advertisers.
          </p>
        </section>

        <section className="legal-sec" id="p5">
          <h2>5. Who we share with</h2>
          <Table
            head={["Who", "What they receive, and why"]}
            rows={[
              [
                "Your exchange",
                "The orders we place on your behalf, authenticated with your key. Governed by their own policy.",
              ],
              [
                "Your bot",
                "Market data for your trades, sent to the URL you configured, carrying your developer key.",
              ],
              [
                "Paystack",
                "Payment details when you buy a course or subscription. We never see full card numbers.",
              ],
              [
                "Yellow Card",
                "Only if you choose to fund through them. You deal with them directly; we pass nothing across unless you initiate it.",
              ],
              [
                "Infrastructure providers",
                "Hosting, database and email delivery, under contract and bound to confidentiality.",
              ],
              [
                "Authorities",
                "Where we are legally required. We will tell you unless we are prohibited from doing so.",
              ],
            ]}
          />
        </section>

        <section className="legal-sec" id="p6">
          <h2>6. Where your data is held</h2>
          <p>
            Candleweb operates from Nigeria and processes data in line with the
            Nigeria Data Protection Act 2023. Some of our infrastructure
            providers hold data outside Nigeria; where they do, we use providers
            that offer an adequate standard of protection and contractual
            safeguards.
          </p>
        </section>

        <section className="legal-sec" id="p7">
          <h2>7. How long we keep it</h2>
          <Table
            rows={[
              [
                "Account data",
                "While your account is open, then 90 days after closure.",
              ],
              [
                "Exchange keys",
                "Deleted immediately when you remove the connection or close your account.",
              ],
              [
                "Trade records",
                "Kept while your account is open so review and your own history stay intact. Exportable at any time.",
              ],
              ["Prompts", "Until you delete them, or your account closes."],
              [
                "Payment records",
                "As long as tax and accounting law requires, typically six years.",
              ],
              ["Technical logs", "Up to 12 months."],
            ]}
          />
        </section>

        <section className="legal-sec" id="p8">
          <h2>8. Your rights</h2>
          <p>
            You can ask us to give you a copy of your data, correct it, delete
            it, restrict how we use it, or object to a particular use. Most of
            this you can do yourself from the dashboard — export your records,
            edit or delete a prompt, remove an exchange connection, close your
            account.
          </p>
          <p>
            For anything else, email{" "}
            <Link href="mailto:privacy@candleweb.io">privacy@candleweb.io</Link>.
            We will respond within 30 days. If you are not satisfied you may
            complain to the Nigeria Data Protection Commission, or to the data
            protection authority where you live.
          </p>
        </section>

        <section className="legal-sec" id="p9">
          <h2>9. Security</h2>
          <p>
            Exchange keys and developer keys are encrypted at rest. Traffic is
            encrypted in transit. Access to production systems is limited to
            staff who need it and is logged.
          </p>
          <p>
            Your part matters too: use a strong, unique password, keep your
            developer key private, restrict your exchange key to our IP address
            where your exchange supports it, and never grant withdrawal
            permission.
          </p>
          <p>
            If a breach affects your data, we will tell you and the regulator
            within the timeframes the law requires, and we will tell you what we
            know rather than waiting until we know everything.
          </p>
        </section>

        <section className="legal-sec" id="p10">
          <h2>10. Cookies</h2>
          <p>
            We use cookies that are necessary to keep you signed in and to keep
            the service secure. We use a small amount of privacy-respecting
            analytics to understand which pages are used. We do not use
            advertising cookies and we do not allow third parties to track you
            across other sites from ours.
          </p>
        </section>

        <section className="legal-sec" id="p11">
          <h2>11. Children</h2>
          <p>
            Candleweb is not for anyone under 18. We do not knowingly collect
            data from children. If you believe a child has given us data, contact
            us and we will delete it.
          </p>
        </section>

        <section className="legal-sec" id="p12">
          <h2>12. Changes and contact</h2>
          <p>
            If we change this policy materially we will tell you by email or in
            the product before it takes effect, and update the date at the top.
          </p>
          <Table
            rows={[
              ["Entity", "Candleweb Ltd — [registration number]"],
              ["Registered address", "[registered address]"],
              ["Data protection contact", "privacy@candleweb.io"],
            ]}
          />
          <p className="legal-foot">
            <b>Related:</b> our <Link href="/terms">Terms of Service</Link> set
            out the agreement between us, including how exchange access and
            trading risk work.
          </p>
        </section>
      </LegalLayout>
    </>
  );
}
