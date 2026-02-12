import React from "react";
import { Fade } from "react-awesome-reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Heading,
} from "ui";

type Props = {};

const FAQ = (props: Props) => {
  const faqContent: {
    header: string;
    desc: string;
  }[] = [
      {
        header: " How does the affiliate program and rewards work?",
        desc: "The affiliate program and rewards in CandleAI work by allowing users to earn a commission for referring other users to the platform. Users earn 13% commission of every successful referral’s first month subscription plan",
      },
      {
        header: " What are the pricing plans for CandleAI?",
        desc: `Freemium: This package is free, it comes with limited access to our bot’s functions. 
Starter - Starter will be priced at $15/month. 
Explorer – Intermediate will be priced at $45/month. 
Whale – Advanced will be priced at $140/month.
CandleAI also have a trial version, it is free, and it lasts for a time period of 4 days.`,
      },
      // {
      //   header: "Can I connect my existing exchange accounts to CandleAI?",
      //   desc: "Yes, users can connect their existing exchange accounts to CandleAI using your exchange API keys.",
      // },
      // {
      //   header:
      //     "Can I see my profit/loss report and trade history on the platform?",
      //   desc: "Yes, users can see their profit/loss report and trade history on our platform.",
      // },
      // {
      //   header:
      //     "Does CandleAI have any built-in security measures to protect my assets?",
      //   desc: "CandleAI has built-in security measures such as two-factor authentication and encrypted communication to protect user assets.",
      // },
      // {
      //   header:
      //     "Is there a trial period or demo account to test CandleAI's features before subscribing?",
      //   desc: "Yes, CandleAI comes with a demo account with dummy funds, and we also have a free package for new users to explore.",
      // },
      // {
      //   header:
      //     "Are there any additional costs or fees associated with using CandleAI?",
      //   desc: "No, There are no additional costs or charges associated with using CandleAI.",
      // },
      // {
      //   header:
      //     "Is the AI in CandleAI continuously learning and adapting to market conditions?",
      //   desc: "CandleAI uses artificial intelligence that is designed to continuously learn and adapt to market conditions.",
      // },
      // {
      //   header:
      //     "How does CandleAI determine which trading strategy to use in different market conditions?",
      //   desc: "CandleAI determines the appropriate trading strategy based on its analysis of market conditions.",
      // },
      // {
      //   header: "Is there a mobile app for CandleAI?",
      //   desc: "There will be a mobile app for CandleAI.",
      // },
      {
        header: "How does the auto-profit taking feature work?",
        desc: "The auto-profit taking feature in CandleAI is designed to automatically execute trades to lock in profits when certain conditions are met.",
      },
      {
        header:
          "Are there any limitations on the number of trades or assets that can be traded with CandleAI?",
        desc: `Our packages gives our users access to different frequency daily trades and tradable assets.
Freemium: 3 trades weekly and 1 tradable asset
Starter: 10 trades daily and 10 tradable asset
Explorer: 20 trades daily and 20 tradable asset
Whale: 50 trades daily and all tradable asset`,
      },
      // {
      //   header: "Can I trade multiple cryptocurrency pairs on CandleAI?",
      //   desc: "Yes, users can trade multiple cryptocurrency pairs on CandleAI.",
      // },
      // {
      //   header: "Does CandleAI use charts or indicators for market analysis?",
      //   desc: "CandleAI uses a combination of charts and technical indicators for market analysis. These charts and indicators will not be visible to our users though, as 100% of Candllebot’s trading process is automated.",
      // },
      // {
      //   header: "Can I set my own risk management parameters?",
      //   desc: "Yes, our users can set their own risk management parameters.",
      // },
      {
        header: "How does CandleAI gather and analyze market information?",
        desc: "CandleAI gathers and analyzes market information from a variety of sources including  market data providers, news feeds, and trusted market analysis platforms.",
      },
      // {
      //   header: " Does CandleAI have stop loss and take profit features?",
      //   desc: "Yes, CandleAI has auto stop-loss and auto take-profit features. These futures are implemented by the bot, so our users do not have to worry about manually setting them.",
      // },
      // {
      //   header: "What is the total supply of Candle Token ($CDE)?",
      //   desc: "The total supply of Candle Token ($CDE) is 14 million.",
      // },
      {
        header: "How will $CDE be used in the Candleweb ecosystem?",
        desc: "$CDE will be used as a utility token in the Candleweb ecosystem for accessing premium services, staking, and participating in governance.",
      },
      // {
      //   header:
      //     "What are the discounts offered to $CDE holders for their subscription plans?",
      //   desc: "Discounts for $CDE holders are ****",
      // },
      // {
      //   header: "Where can I buy $CDE?",
      //   desc: "$CDE can be bought on our partner launchpads, and Uniswap after launch.",
      // },
      // {
      //   header: "How will the platform be marketed officially?",
      //   desc: "The platform will be marketed officially through various channels including online and offline advertising, social media marketing, and community building.",
      // },
      // {
      //   header: "Are there any partnerships planned in the future?",
      //   desc: "Yes, CandleAI is looking to secure a bunch of profitable partnerships in future.",
      // },
      // {
      //   header: "What is the team's plan for expansion?",
      //   desc: "As CandleAI continues to grow, our team will continue to expand, this expansion will be aimed at planting our offices in different countries, hiring more staff to handle the growing numbers of subscribers, and hiring more profession team members.",
      // },
      // {
      //   header:
      //     "Has the smart contract been audited and deployed on the mainnet?",
      //   desc: "Our smart contract will be fully audited before we launch/deploy it o mainnet.",
      // },
    ];
  return (
    <div>
      <div className="faq__section sm:my-[68px] my-[151px]">
        <Heading textsize="xl" classstyle="sm:text-lg uppercase font-medium" align="center">
          Frequently asked questions
        </Heading>
        <div className="faq__content mt-5">
          <Accordion type="multiple" classstyle="">
            {faqContent.map((faq, index) => (
              <AccordionItem
                value={`item-${index + 1}`}
                key={index}
                classstyle="faq__bottom"
              >
                <AccordionTrigger>{faq.header}</AccordionTrigger>
                <AccordionContent>{faq.desc}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
