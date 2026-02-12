import Head from "next/head";
import Link from "next/link";
import React from "react";

type Props = {};

const PrivacyPolicy = (props: Props) => {
  return (
    <>
      <Head>
        <title>Candleweb Privacy Policy</title>
        <meta name="description" content="Candleweb privacy policy" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="main__privacy my-32 sm:!px-5 ms:px-8 lg:px-8 max-w-[1065px] mx-auto w-full">
        <h1 className="header text-center font-bold text-3xl">
          Candleweb Privacy Policy
        </h1>
        <p className="text-center font-[500] text-sm mt-2 mb-4">
          Last updated: May 2025
        </p>

        {/* Introduction */}
        <div className="mt-6 intro">
          <p className="text-sm text-[#fefefe] inter mb-4">
            At Candleweb, we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and disclose your personal data when you use our AI product, CandleAI. This Privacy Policy is designed to comply with the Nigerian Data Protection Act 2023 and, where applicable, the General Data Protection Regulation (EU) 2016/679 (GDPR).
          </p>
        </div>

        {/* Data Controller */}
        <div className="mt-8 data-controller">
          <h2 className="font-bold text-2xl pb-3">Data Controller</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            Candleweb Services Limited is the data controller responsible for the processing of your personal data under this Privacy Policy. For questions or concerns, contact us at{" "}
            <Link href="mailto:support@candleweb.io" className="text-primary">
              support@candleweb.io
            </Link>
            .
          </p>
        </div>

        {/* Scope of Application */}
        <div className="mt-8 scope">
          <h2 className="font-bold text-2xl pb-3">Scope of Application</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            This Privacy Policy applies to users in Nigeria and, where applicable, to users in the European Economic Area (EEA) whose personal data we may process.
          </p>
        </div>

        {/* Data Collection */}
        <div className="mt-8 data-collection">
          <h2 className="font-bold text-2xl pb-3">1. Data Collection</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            We collect the following categories of personal data:
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3">
            <li className="text-sm text-[#fefefe] inter">
              <strong>Personal information:</strong> name, email address, date of birth; KYC IDs (where required by AML law), and other identifying information you provide.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              <strong>Financial information:</strong> crypto wallet addresses and transaction data. Wallet addresses may be pseudonymous identifiers but may become personal data if linked to your identity.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              <strong>Usage information:</strong> logs of your activity on our platform, including trades executed by our tool and API key usage.
            </li>
          </ul>
          <p className="text-sm text-[#fefefe] inter mt-4 bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
            <strong>Note:</strong> Candleweb is a non-custodial platform. We do not hold or store your funds. You authenticate using your crypto wallet, and connect your exchange accounts to Candleweb via secure API keys. Our AI executes trades through those exchange APIs; we do not control your wallet or funds.
          </p>
        </div>

        {/* Use of Personal Data */}
        <div className="mt-8 use-of-data">
          <h2 className="font-bold text-2xl pb-3">2. Use of Personal Data</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            We use your personal data to:
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3">
            <li className="text-sm text-[#fefefe] inter">
              Provide our AI crypto trading services and related customer support.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Execute trades via your connected wallet API.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Communicate with you regarding your account and services.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Improve our services and develop new features.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Fulfill legal or regulatory obligations.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Prevent, detect and investigate fraud, abuse or security incidents.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Analyze anonymized usage data to enhance system performance.
            </li>
          </ul>
          <p className="text-sm text-[#fefefe] inter mt-4">
            Our tool includes automated decision-making and profiling to execute trades based on market conditions and your strategy preferences. You have the right to object to certain types of automated processing and may disable trading automation from your dashboard.
          </p>
        </div>

        {/* Legal Basis for Processing */}
        <div className="mt-8 legal-basis">
          <h2 className="font-bold text-2xl pb-3">3. Legal Basis for Processing</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            We process your data on the following legal bases:
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3">
            <li className="text-sm text-[#fefefe] inter">
              Your consent (e.g., for marketing communications).
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Performance of a contract (e.g., providing our AI trading services).
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Compliance with legal obligations.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Our legitimate interests (e.g., improving our platform, preventing fraud).
            </li>
          </ul>
        </div>

        {/* Data Sharing */}
        <div className="mt-8 data-sharing">
          <h2 className="font-bold text-2xl pb-3">4. Data Sharing</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            We may share your data with:
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3">
            <li className="text-sm text-[#fefefe] inter">
              Service providers under contractual obligations (e.g., hosting, analytics, security providers).
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Regulatory authorities, if legally required or to protect our rights or the rights of others.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Business partners involved in delivering the service (under strict data protection terms).
            </li>
          </ul>
          <p className="text-sm text-[#fefefe] inter mt-4">
            All third-party processors are bound by data processing agreements ensuring compliance with applicable data protection laws.
          </p>
        </div>

        {/* Data Security */}
        <div className="mt-8 data-security">
          <h2 className="font-bold text-2xl pb-3">5. Data Security</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            We implement technical and organizational safeguards including:
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3">
            <li className="text-sm text-[#fefefe] inter">
              TLS encryption
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Database access control
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Secure API gateways
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Regular security audits
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Breach response protocols
            </li>
          </ul>
          <p className="text-sm text-[#fefefe] inter mt-4">
            We reserve the right to implement third-party penetration tests and bug-bounty programs.
          </p>
        </div>

        {/* Data Retention */}
        <div className="mt-8 data-retention">
          <h2 className="font-bold text-2xl pb-3">6. Data Retention</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            We retain data for as long as necessary to:
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3">
            <li className="text-sm text-[#fefefe] inter">
              Maintain your account
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Provide you with services
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Comply with regulatory requirements
            </li>
          </ul>
          <p className="text-sm text-[#fefefe] inter mt-4">
            API tokens are retained for up to six years (five years statutory record-keeping + one-year contingency). User account data is deleted 90 days after you close your account unless legal retention applies.
          </p>
        </div>

        {/* Your Rights */}
        <div className="mt-8 your-rights">
          <h2 className="font-bold text-2xl pb-3">7. Your Rights</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            You have the following rights regarding your personal data:
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3">
            <li className="text-sm text-[#fefefe] inter">
              Access your personal data
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Request rectification of inaccurate data
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Request erasure of personal data
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Restrict or object to processing
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Request data portability in a machine-readable format
            </li>
          </ul>
          <p className="text-sm text-[#fefefe] inter mt-4">
            To exercise your rights, contact us at{" "}
            <Link href="mailto:support@candleweb.io" className="text-primary">
              support@candleweb.io
            </Link>
            . We aim to respond within 30 days.
          </p>
        </div>

        {/* Transfers of Personal Data */}
        <div className="mt-8 data-transfers">
          <h2 className="font-bold text-2xl pb-3">8. Transfers of Personal Data</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            Where we transfer data outside your country of residence, we use legally approved mechanisms and standard contractual clauses to ensure your data remains protected.
          </p>
        </div>

        {/* Cookies and Similar Technologies */}
        <div className="mt-8 cookies">
          <h2 className="font-bold text-2xl pb-3">9. Cookies and Similar Technologies</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            We use cookies and similar technologies to collect technical and usage information. Non-essential cookies require your consent. A cookie banner and preferences panel will be provided.
          </p>
        </div>

        {/* Marketing Communications */}
        <div className="mt-8 marketing">
          <h2 className="font-bold text-2xl pb-3">10. Marketing Communications</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            We will only send you marketing communications with your consent. You may withdraw this consent at any time via unsubscribe links or by contacting us.
          </p>
        </div>

        {/* Children's Privacy */}
        <div className="mt-8 childrens-privacy">
          <h2 className="font-bold text-2xl pb-3">11. Children&apos;s Privacy</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            Our services are not intended for individuals under the age of 21. We do not knowingly collect data from children. KYC requirements are the responsibility of the exchanges connected to our service through the API keys.
          </p>
        </div>

        {/* Blockchain and Web3-Specific Disclosures */}
        <div className="mt-8 blockchain-disclosures">
          <h2 className="font-bold text-2xl pb-3">12. Blockchain and Web3-Specific Disclosures</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            Candleweb does not control or modify blockchain-based data. Wallet addresses and transactions may be visible on public ledgers and cannot be altered or erased. We recommend users exercise caution when linking personal information to blockchain addresses. Smart-contract interactions are public and immutable; if you publicly associate your wallet with your identity, that linkage may be permanent.
          </p>
        </div>

        {/* Changes to this Privacy Policy */}
        <div className="mt-8 policy-changes">
          <h2 className="font-bold text-2xl pb-3">13. Changes to this Privacy Policy</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            We may update this policy periodically. The latest version will always be available on our website. Last updated: May 2025
          </p>
        </div>

        {/* Contact Us */}
        <div className="mt-8 contact">
          <h2 className="font-bold text-2xl pb-3">14. Contact Us</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            If you have any questions or concerns regarding our privacy policy or our handling of your personal data, please contact us at{" "}
            <Link href="mailto:support@candleweb.io" className="text-primary">
              support@candleweb.io
            </Link>
            . We aim to respond within 30 days.
          </p>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
