import Head from "next/head";
import Link from "next/link";
import React from "react";

type Props = {};

const TermsOfService = (props: Props) => {
  return (
    <>
      <Head>
        <title>Candleweb Terms of Service</title>
        <meta name="description" content="Candleweb terms of service" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="main__terms my-32 sm:!px-5 ms:px-8 lg:px-8 max-w-[1065px] mx-auto w-full">
        <h1 className="header text-center font-bold text-3xl">
          Candleweb Terms of Service/Use
        </h1>
        <p className="text-center font-[500] text-sm mt-2 mb-4">
          Last updated: 26 May 2025
        </p>

        {/* Introduction */}
        <div className="mt-6 intro">
          <h2 className="font-bold text-2xl pb-3">Introduction</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            These Terms of Service/Use (&quot;Terms&quot;) form a legally binding agreement between you (the &quot;User&quot;) and Candleweb Services Limited (&quot;Candleweb,&quot; &quot;Company,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). These Terms govern your access to and use of Candleweb Services, including our platform, applications, API integrations, and the CandleAI trading software.
          </p>
          <p className="text-sm text-[#fefefe] inter mb-4">
            By accessing or using the Services, including by clicking &quot;I Agree&quot; or similar acceptance mechanisms, you acknowledge that you have read, understood, and agree to be bound by these Terms and our{" "}
            <Link href={"/privacy"} target="_blank" className="text-primary">
              Privacy Policy
            </Link>
            . If you do not agree, you may not access or use Candleweb Services.
          </p>
          <p className="text-sm text-[#fefefe] inter mb-4">
            Candleweb provides an artificial intelligence–powered tool, CandleAI, designed to analyze historical and real-time cryptocurrency market data and execute trades on your behalf. Users authenticate with a blockchain wallet and link API keys from supported third-party exchanges. Candleweb does not hold, store, or have custody of your assets; trades are executed directly through your exchange accounts under your authorization.
          </p>
          <p className="text-sm text-[#fefefe] inter mb-4">
            Your continued use of Candleweb Services constitutes acceptance of any updated Terms. Additional terms may apply to certain services, features, or promotions. Those terms are incorporated by reference and form part of this agreement.
          </p>
          <p className="instru tracking-3 font-medium mt-3 text-sm uppercase">
            PLEASE READ THE TERMS CAREFULLY AS THEY GOVERN YOUR USE OF CANDLEWEB SERVICES.
          </p>
        </div>

        {/* Interpretation and Definitions */}
        <div className="mt-8 definitions">
          <h2 className="font-bold text-2xl pb-3">Interpretation and Definitions</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            For the purposes of these Terms of Service/Use, the following words and phrases shall have the following meanings assigned to them unless the context otherwise requires:
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3">
            <li className="text-sm text-[#fefefe] inter">
              <strong>Account:</strong> A unique virtual account created for the User to access our Service or parts of our Service.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              <strong>AI or Artificial Intelligence:</strong> A set of algorithms and mathematical models designed to perform specific tasks, simulate human cognitive functions such as learning and problem solving, and improve performance over time through experience. This includes machine learning models, neural networks, natural language processing systems, and related subsystems developed or used by Candleweb.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              <strong>CandleAI:</strong> The proprietary AI-powered trading software developed by Candleweb that analyzes historical and real-time cryptocurrency market data (including relevant news) and executes trades on connected exchanges based on strategy parameters provided by the User.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              <strong>Candleweb:</strong> Candleweb Services Limited, a company registered in Nigeria, and its affiliates, developers, operators, licensors, and successors.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              <strong>Candleweb Platform Rules:</strong> All rules, interpretations, announcements, product descriptions, statements, and updates issued by Candleweb through the website, application, or related channels.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              <strong>Company:</strong> Candleweb Services Limited.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              <strong>Device:</strong> Any device capable of accessing the Service, including but not limited to computers, smartphones, tablets, and similar internet-connected hardware.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              <strong>Digital Currencies or Digital Assets:</strong> Encrypted or digital tokens based on blockchain and cryptography technologies, including but not limited to cryptocurrencies, stablecoins, and other decentralized digital representations of value.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              <strong>Disclaimer:</strong> A statement that limits legal responsibilities or obligations.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              <strong>Exchange API:</strong> A secure software interface provided by third-party cryptocurrency exchanges through which Candleweb is authorized by the User to execute trades. These APIs do not confer custody or control over User funds to Candleweb.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              <strong>Feedback:</strong> Ideas, suggestions, or comments provided by Users regarding the features, performance, or use of Candleweb Services.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              <strong>Indemnify/Indemnity:</strong> A User&apos;s contractual obligation to compensate Candleweb or others for losses resulting from legal proceedings or violations of these Terms.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              <strong>KYC (Know Your Customer):</strong> The process by which Candleweb or its partners verify the identity of Users to comply with anti-money laundering (AML), counter-terrorist financing (CTF), or other legal requirements.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              <strong>Liability:</strong> Legal responsibility for damages, losses, or other financial obligations, whether arising in contract, tort, or by statute.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              <strong>Platform:</strong> Any Candleweb-owned or operated digital interface, software, website (including candleweb.io), mobile application, bot, or authorized API integration through which Candleweb Services are accessed.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              <strong>Products:</strong> Tools, utilities, or services offered for sale or subscription by Candleweb on its platform.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              <strong>Orders:</strong> User-initiated instructions to subscribe to services or purchase products offered by Candleweb.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              <strong>Promotions:</strong> Contests, referral programs, discounts, free trials, or similar incentive-based campaigns offered through the Service.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              <strong>Service or Services:</strong> The full suite of features, products, tools, subscriptions, and other offerings provided by Candleweb, including but not limited to the CandleAI software, website, applications, and support interfaces.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              <strong>Third-party Social Media Service:</strong> Any external service or content (such as APIs, media, or user data) provided by an independent third party that may integrate with Candleweb Services.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              <strong>User:</strong> An individual, company, or other legal entity accessing or using the Service, or on whose behalf the Service is being used.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              <strong>Wallet Authentication:</strong> A cryptographic verification method through which a User proves control over a blockchain wallet (e.g., by signing a message). This is used for identity verification and does not grant Candleweb access to User funds or wallets.
            </li>
          </ul>
        </div>

        {/* Eligibility and User Representations */}
        <div className="mt-8 eligibility">
          <h2 className="font-bold text-2xl pb-3">Eligibility and User Representations</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            By registering to use a Candleweb Account or accessing Candleweb Services, the User represents and warrants that:
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3">
            <li className="text-sm text-[#fefefe] inter">
              The User is at least 21 years old or of legal age to form a binding contract under applicable law;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              The User has full legal capacity and sufficient authority to enter into these Terms, either individually or on behalf of an entity;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              The User is not a resident of, or accessing Candleweb Services from, a Restricted Location, including but not limited to the United States, Malaysia, Ontario (Canada), or any other territory that Candleweb may designate from time to time;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              The User has not previously been suspended or removed from accessing the Candleweb Platform or Services;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              If registering or using the Services on behalf of an entity, the User is properly authorized to bind that entity and acknowledges that all terms herein shall apply to the entity as well;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              The User&apos;s access to or use of the Services is in compliance with all applicable laws and regulations, including anti-money laundering (AML), counter-terrorism financing (CTF), anti-bribery, anti-corruption, and sanctions laws.
            </li>
          </ul>
          <p className="text-sm text-[#fefefe] inter mt-4">
            Users agree and accept responsibility for remaining informed about and complying with any restrictions and/or requirements imposed by applicable laws in the jurisdiction from which they access the Services. Candleweb reserves the right to modify or expand its list of Restricted Locations without prior notice and may restrict access accordingly.
          </p>
        </div>

        {/* Account Registration and Security */}
        <div className="mt-8 account-security">
          <h2 className="font-bold text-2xl pb-3">Account Registration and Security</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            To use Candleweb Services, Users must register an Account and complete the required identity verification procedures. Users agree to:
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3">
            <li className="text-sm text-[#fefefe] inter">
              Provide accurate, current, and complete information during registration;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Promptly update any information that becomes outdated, incomplete, or inaccurate;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Maintain the confidentiality of account credentials, API keys, and device authorizations;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Use unique login credentials and not share their account with others.
            </li>
          </ul>
          <p className="text-sm text-[#fefefe] inter mt-4 mb-4">
            Users are solely responsible for maintaining the security of their accounts and any linked APIs. Candleweb assumes no liability for unauthorized account access resulting from User negligence.
          </p>
          <p className="text-sm text-[#fefefe] inter mb-4">
            Users agree to:
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3">
            <li className="text-sm text-[#fefefe] inter">
              Notify Candleweb immediately of any unauthorized use of their account or suspected breach of security;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Follow Candleweb&apos;s procedures for authentication, withdrawal, trading, and data protection;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Log out from each session securely and refrain from using insecure networks.
            </li>
          </ul>
          <p className="text-sm text-[#fefefe] inter mt-4">
            Accounts may only be accessed by the registered User. Candleweb reserves the right to suspend, freeze, or cancel accounts used by unauthorized persons. Candleweb also reserves the right to investigate accounts for fraud, policy violations, or suspicious activity, and to take appropriate action including account suspension or termination. Candleweb may share user data with third-party fraud detection, KYC vendors, payment processors, or credit agencies where required to comply with law or internal risk procedures.
          </p>
          <p className="text-sm text-[#fefefe] inter mt-4">
            If we are unable to contact a User due to invalid or outdated contact information, the User may be liable for any resulting loss. Users are responsible for keeping all contact and account information accurate and current.
          </p>
        </div>

        {/* Permitted and Prohibited Uses */}
        <div className="mt-8 permitted-uses">
          <h2 className="font-bold text-2xl pb-3">Permitted and Prohibited Uses</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            Users agree to use Candleweb Services only for lawful purposes and in compliance with these Terms. Without limitation, the User agrees not to:
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3">
            <li className="text-sm text-[#fefefe] inter">
              Use Candleweb Services for any activity that violates applicable law or regulation;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Use Candleweb Services to engage in unauthorized or unlawful market manipulation, such as pump and dump schemes, wash trading, or front-running;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Reverse-engineer, decompile, disassemble, or attempt to derive the source code of CandleAI or any proprietary feature of the Platform;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Sell, sublicense, distribute, reproduce, or commercially exploit the Services without written permission;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Circumvent or disable security-related features of the Services or use automated means (such as bots or scrapers) to access, copy, or interfere with Candleweb systems;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Upload or transmit viruses, malware, or malicious scripts;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Access or use any part of the Services in a manner that could damage, disable, overburden, or impair Candleweb infrastructure or interfere with any other party&apos;s use of the Services;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Impersonate any person or entity, or falsely state or otherwise misrepresent your affiliation with any person or entity.
            </li>
          </ul>
          <p className="text-sm text-[#fefefe] inter mt-4">
            Candleweb reserves the right to monitor and audit all activity on its platform and to suspend, block, or terminate access to any User found to be in violation of these terms or engaging in conduct that undermines platform integrity or compliance obligations.
          </p>
        </div>

        {/* Subscription, Payment, and Taxation */}
        <div className="mt-8 subscription">
          <h2 className="font-bold text-2xl pb-3">Subscription, Payment, and Taxation</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            To access Candleweb&apos;s full range of Services, including CandleAI, Users must maintain an active subscription. Subscriptions may be offered on a monthly or annual basis and are priced according to the selected tier.
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3">
            <li className="text-sm text-[#fefefe] inter">
              Subscription fees are charged in advance and are non-refundable except where required by law or expressly stated in these Terms.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              A valid form of payment must be provided and maintained. Candleweb may use third-party payment processors or accept cryptocurrency payments where available.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              If a User fails to pay subscription fees on time, Candleweb may suspend access to Services until payment is received.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Users are solely responsible for managing their subscription renewal or cancellation preferences. Failure to cancel a subscription before the next billing cycle will result in automatic renewal.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              All subscription prices are exclusive of taxes, which may be added at checkout depending on jurisdiction.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Users are responsible for all applicable sales tax, VAT, or other duties imposed by relevant authorities.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Exchange-related fees (e.g., trading fees charged by the connected exchange) are separate and not included in the subscription price.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              If Candleweb is required to withhold taxes by law, the User agrees to pay an amount sufficient to cover the full amount of fees owed as if no withholding were required.
            </li>
          </ul>
          <p className="text-sm text-[#fefefe] inter mt-4">
            By subscribing, the User authorizes Candleweb and its payment processors to charge the selected payment method on a recurring basis unless and until the subscription is canceled. This authorization remains in effect unless revoked by the User prior to the next billing date. Users may cancel their subscription at any time via the platform dashboard. Cancellation will take effect at the end of the current billing period.
          </p>
          <p className="text-sm text-[#fefefe] inter mt-4">
            Candleweb does not issue partial or full refunds for unused time unless required by applicable law. If you are dissatisfied with the Services, you may contact Candleweb support within 14 days of your initial subscription to request a discretionary refund, subject to our internal review. Refunds will not be provided for automatic renewals that occur due to a User&apos;s failure to cancel their subscription in time.
          </p>
        </div>

        {/* Risk Acknowledgment and Disclosures */}
        <div className="mt-8 risk">
          <h2 className="font-bold text-2xl pb-3">Risk Acknowledgment and Disclosures</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            The User acknowledges that the use of Candleweb Services involves significant financial risk. Cryptocurrency markets are volatile, and prices may fluctuate dramatically in short periods. By using CandleAI or any Candleweb tool to execute trades, the User confirms understanding and acceptance of these risks.
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3">
            <li className="text-sm text-[#fefefe] inter">
              The User understands that losses may exceed deposits or equal the User&apos;s entire investment, thus losing all funds in the User&apos;s exchange account. User further acknowledges that past performance is not indicative of future results.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Candleweb does not guarantee the accuracy, profitability, or reliability of any analysis or trades made using CandleAI.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              The User assumes all responsibility for enabling, disabling, or modifying trading preferences, including those set in automated strategies.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Candleweb is not liable for any damages or losses arising from API misconfiguration, market conditions, coin delisting, exchange outages, or software bugs.
            </li>
          </ul>
          <p className="text-sm text-[#fefefe] inter mt-4">
            The User warrants that they have conducted independent due diligence and consulted with legal, financial, or tax advisors where necessary before using Candleweb Services. If the User is dissatisfied with the service&apos;s performance, the user&apos;s sole remedy is to stop using the service.
          </p>
        </div>

        {/* Indemnity */}
        <div className="mt-8 indemnity">
          <h2 className="font-bold text-2xl pb-3">Indemnity</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            To the maximum extent permitted by applicable law, you agree to indemnify, defend, and hold harmless Candleweb, its affiliates, and their respective officers, employees, and agents from any claims, damages, liabilities, losses, or expenses (including reasonable legal fees) arising out of or related to:
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3">
            <li className="text-sm text-[#fefefe] inter">
              Your use or misuse of the Services;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Your violation of these Terms or applicable law; or
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Any content or data submitted via your account.
            </li>
          </ul>
        </div>

        {/* AI Outputs and User Assumption of Risk */}
        <div className="mt-8 ai-outputs">
          <h2 className="font-bold text-2xl pb-3">AI Outputs and User Assumption of Risk</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            CandleAI generates content and outputs, including strategy suggestions, trade signals, and analytical insights, based on historical market data, user-defined configurations, and adaptive algorithmic learning. CandleAI may adapt using anonymized data from all users to improve performance.
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3">
            <li className="text-sm text-[#fefefe] inter">
              CandleAI&apos;s outputs are informational and non-binding; they are not a guarantee of performance, nor do they constitute financial, legal, or investment advice.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              The User agrees that all outputs generated by CandleAI, including those based on news events or predictive modeling, are used at the User&apos;s sole discretion and risk.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Candleweb disclaims any liability for losses or decisions made based on outputs produced by CandleAI, whether automatically executed or manually reviewed by the User.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              The User is solely responsible for monitoring the behavior of CandleAI on their connected exchange accounts and making any necessary adjustments.
            </li>
          </ul>
          <p className="text-sm text-[#fefefe] inter mt-4">
            While Candleweb implements reasonable safeguards, no AI system is infallible. Output may include errors, reflect outdated information, or fail to respond to abnormal market conditions. The User accepts these limitations and uses the Services accordingly.
          </p>
          <p className="text-sm text-[#fefefe] inter mt-4">
            Candleweb is not your agent, intermediary, broker, advisor, or fiduciary. The Services are provided on a non-reliance basis. You are solely responsible for your investment decisions and strategy. Nothing in the Services constitutes investment advice, and you agree not to construe any content, feature, or performance output of CandleAI as such.
          </p>
        </div>

        {/* Intellectual Property and Content Ownership */}
        <div className="mt-8 intellectual-property">
          <h2 className="font-bold text-2xl pb-3">Intellectual Property and Content Ownership</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            Candleweb retains all rights, title, and interest in and to the Candleweb Services, including but not limited to the website, CandleAI (including anything the service produces), algorithms, interface design, source code, analytics, and associated documentation. All content provided to the user through the Services (including CandleAI&apos;s analyses or recommendations) is for the user&apos;s personal use under the foregoing license, and Candleweb retains all intellectual property rights in such content. These assets are protected by copyright, trademark, trade secret, and other intellectual property laws.
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3">
            <li className="text-sm text-[#fefefe] inter">
              The User is granted a limited, non-exclusive, non-transferable, revocable license to access and use Candleweb Services strictly in accordance with these Terms.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              The User may not reproduce, modify, create derivative works from, distribute, or publicly display any part of the Services without prior written consent from Candleweb.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Any unauthorized use of the intellectual property or proprietary features of the Services may result in legal action and termination of access rights.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Users retain ownership of their own content and configurations submitted to Candleweb, but grant Candleweb a worldwide, royalty-free license to use such content to deliver the requested Services.
            </li>
          </ul>
          <p className="text-sm text-[#fefefe] inter mt-4">
            Candleweb trademarks, trade dress, and branding may not be used in any way that implies affiliation, sponsorship, or endorsement without written approval.
          </p>
          <p className="text-sm text-[#fefefe] inter mt-4">
            All outputs generated by CandleAI, including forecasts, trading suggestions, and visualizations, are provided solely for your personal, non-commercial use. You may not reproduce, republish, resell, or distribute CandleAI-generated outputs without prior written consent. Candleweb retains all rights in and to these AI-generated outputs, even when configured based on your inputs.
          </p>
        </div>

        {/* Data Use, Storage, and Privacy */}
        <div className="mt-8 data-privacy">
          <h2 className="font-bold text-2xl pb-3">Data Use, Storage, and Privacy</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            Candleweb processes User data in accordance with its Privacy Policy and applicable data protection laws, including the Nigeria Data Protection Act (NDPA), the General Data Protection Regulation (GDPR), and relevant Web3-specific standards where applicable.
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3">
            <li className="text-sm text-[#fefefe] inter">
              By using Candleweb Services, the User consents to the collection, use, and sharing of data necessary for account operation, identity verification, fraud prevention, service optimization, and compliance with legal obligations.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Data collected may include personal identification data (e.g., name, email), technical identifiers (e.g., IP address, device info), usage metrics, and transaction metadata from connected exchange accounts.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Candleweb does not access or store private keys or custodial wallet information. Wallet authentication is used solely for identity verification.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              User API keys are encrypted and stored securely for use in executing trades. Users may revoke API access at any time through their exchange account or platform settings.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              User data may be retained for a minimum of six (6) years after account closure to meet regulatory, tax, and compliance requirements.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Users may access, update, delete, or request portability of their personal data by contacting support@candleweb.io, subject to applicable legal limitations, including identity verification and regulatory investigation.
            </li>
          </ul>
          <p className="text-sm text-[#fefefe] inter mt-4">
            The User is responsible for safeguarding access credentials and agrees to notify Candleweb of any suspected breach of their personal data or unauthorized activity.
          </p>
        </div>

        {/* Account Suspension and Termination */}
        <div className="mt-8 suspension">
          <h2 className="font-bold text-2xl pb-3">Account Suspension and Termination</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            Candleweb may suspend, restrict, or terminate access to all or part of its Services if:
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3">
            <li className="text-sm text-[#fefefe] inter">
              The User violates these Terms or applicable law;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Candleweb detects unauthorized access, suspected fraud, or activity that threatens system integrity;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Candleweb is required by law enforcement, regulatory directive, or court order to do so;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Candleweb determines in its sole discretion that continued access poses risk to the User, the Company, or the broader platform.
            </li>
          </ul>
          <p className="text-sm text-[#fefefe] inter mt-4 mb-4">
            In the event of account suspension:
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3">
            <li className="text-sm text-[#fefefe] inter">
              Candleweb may freeze API activity and disable access to subscription features;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              The User may be required to verify identity or provide additional documentation before reinstatement;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Candleweb may retain access to account data for audit and compliance purposes even after termination.
            </li>
          </ul>
          <p className="text-sm text-[#fefefe] inter mt-4">
            Users may also voluntarily request account deletion or deactivation. Such requests are subject to retention obligations under applicable law. Following confirmed termination, any remaining prepaid subscription access will not be refunded unless required by law.
          </p>
          <p className="text-sm text-[#fefefe] inter mt-4">
            Users whose accounts are terminated due to breach or fraud may be barred from future use of Candleweb Services at Candleweb&apos;s discretion.
          </p>
        </div>

        {/* Disclaimers and Limitation of Liability */}
        <div className="mt-8 disclaimers">
          <h2 className="font-bold text-2xl pb-3">Disclaimers and Limitation of Liability</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            Candleweb Services are provided &quot;as is&quot; and &quot;as available&quot; without any warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. Candleweb makes no representations or warranties:
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3">
            <li className="text-sm text-[#fefefe] inter">
              That the Services will be uninterrupted, timely, secure, or error-free;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              That the results obtained from the use of the Services will be accurate or reliable;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              That any errors in the Services will be corrected.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              That displayed third-party content (such as news articles or market data) is accurate.
            </li>
          </ul>
          <p className="text-sm text-[#fefefe] inter mt-4">
            The User acknowledges and agrees that use of Candleweb Services is at their sole risk.
          </p>
          <p className="text-sm text-[#fefefe] inter mt-4 mb-4">
            To the fullest extent permitted by applicable law, Candleweb and its affiliates, officers, directors, employees, agents, licensors, or suppliers shall not be liable for:
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3">
            <li className="text-sm text-[#fefefe] inter">
              Any indirect, incidental, special, punitive, or consequential damages;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Any loss of profits or revenues, whether incurred directly or indirectly;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Any loss of data, use, or goodwill;
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Any unauthorized access, use, or alteration of the User&apos;s transmissions or content.
            </li>
          </ul>
          <p className="text-sm text-[#fefefe] inter mt-4">
            In no event shall Candleweb&apos;s aggregate liability exceed the greater of:
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3">
            <li className="text-sm text-[#fefefe] inter">
              ONE HUNDRED UNITED STATES DOLLARS (USD $100); or
            </li>
            <li className="text-sm text-[#fefefe] inter">
              THE AMOUNT PAID BY THE USER FOR CANDLEWEB SERVICES IN THE TWO (2) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM, WHICH AMOUNT SHALL NOT INCLUDE ANY AMOUNT TRADED BY CANDLEAI ON THE USER&apos;S BEHALF.
            </li>
          </ul>
          <p className="text-sm text-[#fefefe] inter mt-4">
            Nothing in this section limits liability for fraud, willful injury, or any liability that cannot be excluded under applicable law.
          </p>
          <p className="text-sm text-[#fefefe] inter mt-4">
            Candleweb does not engage in any securities offering.
          </p>
        </div>

        {/* Governing Law and Dispute Resolution */}
        <div className="mt-8 governing-law">
          <h2 className="font-bold text-2xl pb-3">Governing Law and Dispute Resolution</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            These Terms and any dispute arising out of or relating to them or the use of the Services shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to its conflict of law principles.
          </p>
          <p className="text-sm text-[#fefefe] inter mb-4">
            Before initiating arbitration or legal proceedings, the User agrees to first attempt to resolve any issue or dispute informally by contacting Candleweb at support@candleweb.io and allowing a reasonable time for resolution.
          </p>
          <p className="text-sm text-[#fefefe] inter mb-4">
            If the dispute is not resolved informally, it shall be referred to and finally resolved by arbitration under the Arbitration and Mediation Act 2023 (or any statutory modification or re-enactment thereof). The arbitral tribunal shall consist of a sole arbitrator mutually appointed by the parties. If the parties are unable to agree, the arbitrator shall be appointed by a judge of the Federal High Court of Nigeria.
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3">
            <li className="text-sm text-[#fefefe] inter">
              The seat of arbitration shall be Abuja, Nigeria.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              The language of arbitration shall be English.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              Each party shall bear its own legal costs, and the costs of arbitration shall be shared equally unless the tribunal decides otherwise.
            </li>
            <li className="text-sm text-[#fefefe] inter">
              The decision of the arbitrator shall be final and binding.
            </li>
          </ul>
          <p className="text-sm text-[#fefefe] inter mt-4">
            To the maximum extent permitted under applicable law, the User agrees to resolve disputes with Candleweb on an individual basis and waives the right to participate in any class, collective, or representative proceeding.
          </p>
          <p className="text-sm text-[#fefefe] inter mt-4">
            Any claim arising from the Services must be filed within one (1) year from the date on which the claim arose. Claims not filed within this period shall be permanently barred, unless prohibited by applicable law.
          </p>
        </div>

        {/* Miscellaneous Provisions */}
        <div className="mt-8 miscellaneous">
          <h2 className="font-bold text-2xl pb-3">Miscellaneous Provisions</h2>
          <p className="text-sm text-[#fefefe] inter mb-4">
            If any provision of these Terms is held to be invalid or unenforceable, such provision shall be modified to reflect the parties&apos; intention or severed to the extent necessary to enforce the remaining provisions of the Terms.
          </p>
          <p className="text-sm text-[#fefefe] inter mb-4">
            No waiver of any term or condition set forth in these Terms shall be deemed a further or continuing waiver of such term or condition or any other term or condition.
          </p>
          <p className="text-sm text-[#fefefe] inter mb-4">
            All legal notices will be provided via email to the address linked to your Candleweb account or through a notification within the platform. It is your responsibility to keep your email address up to date and to monitor communications from Candleweb. Notices shall be deemed received 24 hours after being sent.
          </p>
          <p className="text-sm text-[#fefefe] inter mb-4">
            Users may not assign or transfer their rights or obligations under these Terms without prior written consent from Candleweb. Candleweb may assign its rights and obligations under these Terms freely, without restriction.
          </p>
          <p className="text-sm text-[#fefefe] inter mb-4">
            Candleweb shall not be held liable for any failure or delay in performance due to causes beyond its reasonable control, including acts of God, war, terrorism, embargo, labor disputes, pandemics, system failures, or government actions.
          </p>
          <p className="text-sm text-[#fefefe] inter mb-4">
            These Terms constitute the entire agreement between the User and Candleweb concerning the subject matter hereof and supersede all prior and contemporaneous communications and proposals, whether oral or written, between the parties.
          </p>
          <p className="text-sm text-[#fefefe] inter">
            For questions regarding these Terms, please contact Candleweb at support@candleweb.io or by visiting{" "}
            <Link href="https://candleweb.io/contact" target="_blank" className="text-primary">
              https://candleweb.io/contact
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
};

export default TermsOfService;
