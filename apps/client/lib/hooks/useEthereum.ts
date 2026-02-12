import { useState } from "react";
import { ethers } from "ethers";
// import { busdApproveAddress, mainContractAddress } from "../../utils/constants";
import newContractABI from "../../utils/ContractABI.json";
import busdApproveABI from "../../utils/BUSDApprove.json";
import { error } from "../../components/alert/Toast";
import { useMediaQuery } from "@react-hook/media-query";
import Web3Modal from "web3modal";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../redux/store";
import subscriptionService from "../../services/subscriptionService";
import useAxiosAuth from "./useAxiosAuth";
import referralService from "../../services/referralService";
import { AxiosInstance } from "axios";

// declare global window ethereum instance here
declare global {
  interface Window {
    ethereum: any;
  }
}

/**
 * Custom hook to work with Ethereum
 */
export const useEthereum = () => {
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const isMobile = useMediaQuery("only screen and (max-width: 768px)");
  const axiosToken = useAxiosAuth();

  // connect to provider and obtain signer for transactions
  const getEthereumContract = (): ethers.Contract => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    // const transactionContract = new ethers.Contract(
    //   contractAddress,
    //   contractABI,
    //   signer
    // );
    const transactionContract = new ethers.Contract(
      process.env.NEXT_PUBLIC_MAIN_CONTRACT_ADDRESS as string,
      newContractABI,
      signer
    );

    // console.log(transactionContract);

    return transactionContract;
  };

  /**
   * Connects to a mobile wallet using Web3Modal and signs a message if not signing in.
   * @param isNotSignin - Optional flag indicating whether to skip signing the message.
   * @returns An object containing the wallet address and signed message (if applicable).
   */
  const mobileConnectWallet = async (
    isNotSignin?: boolean
  ): Promise<{ walletAddress: string; signMessage: string } | null> => {
    try {
      const web3Modal = new Web3Modal({
        network: "mainnet",
        cacheProvider: true,
      });

      const provider = await web3Modal.connect(); // Connect to the wallet

      const web3Provider = new ethers.providers.Web3Provider(provider); // Create an Ethers.js provider

      const signer = web3Provider.getSigner(); // Get the signer from the provider

      const walletAddress = await signer.getAddress(); // Get the wallet address

      let signMessage = ""; // Initialize signMessage as empty string
      if (!isNotSignin) {
        signMessage = await signer.signMessage(
          "Hi there from Candleweb Sign this message to prove you have access to this wallet and we’ll log you in. This won’t cost you any Ether."
        ); // Sign the message if not signing in
      }

      return { walletAddress, signMessage }; // Return the wallet address and signed message
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      return null;
      // throw error; // Rethrow the error after logging
    }
  };

  const getEthereumBUSDContract = (): ethers.Contract => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const transactionContract = new ethers.Contract(
      process.env.NEXT_PUBLIC_BUSD_APPROVE_ADDRESS as string,
      busdApproveABI,
      signer
    );

    return transactionContract;
  };

  // Connect the metamask wallet
  const connectWallet = async (isNotSignin?: boolean) => {
    try {
      let account = "";
      // if (isMobile) {
      //   return await mobileConnectWallet(isNotSignin);
      // } else {
      if (!window.ethereum) {
        if (!isMobile) error("Please install metamask wallet extension");
        return null;
      }
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      account = accounts[0];
      // }

      return await loadBlockchainData(account, isNotSignin);
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  // Load and set blockchain data
  const loadBlockchainData = async (account: string, isNotSignin?: boolean) => {
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const walletAddress = await signer.getAddress();
      const signMessage = !isNotSignin
        ? await signer.signMessage(
            "Hi there from Candleweb! Sign this message to prove you have access to this wallet and we’ll log you in. This won’t cost you any Ether."
          )
        : "";

      setConnectedAccount(walletAddress);

      return {
        walletAddress,
        signMessage,
      };
    } catch (err: any) {
      console.error({ err }, "New error");
      // error(err.reason);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const approveTransaction = async (amount: string): Promise<boolean> => {
    try {
      const multipledAmount = ethers.utils.parseUnits(amount, 18); // Convert decimal value to BigNumber

      const transactionContract = getEthereumBUSDContract();
      const transactionHash = await transactionContract.approve(
        process.env.NEXT_PUBLIC_MAIN_CONTRACT_ADDRESS as string,
        multipledAmount
      );

      await transactionHash.wait();

      return true;
    } catch (err: any) {
      console.log({ err });
      // Extract the relevant information from the error object
      const action = err.action; // action field from the error object
      const code = err.code; // code field from the error object

      // Display a user-friendly message based on the error code
      let errorMessage = "";
      if (code === "ACTION_REJECTED") {
        errorMessage = "Transaction rejected by the user.";
      } else if (code === ethers.utils.Logger.errors.UNPREDICTABLE_GAS_LIMIT) {
        errorMessage = "Transaction failed: Gas limit issue. Please try again.";
      } else if (code === ethers.utils.Logger.errors.INSUFFICIENT_FUNDS) {
        errorMessage = "Transaction failed: Insufficient fund.";
      } else if (code === ethers.utils.Logger.errors.NETWORK_ERROR) {
        errorMessage = "Transaction failed: Network error.";
      } else {
        errorMessage = `${code}: An error occurred during the transaction.`;
      }

      error(errorMessage); // Display only the important information to the user
      return false;
    }
  };

  const claimReferralReward = async (referred: string) => {
    setLoading(true);
    try {
      // console.log({ referred });
      const transactionContract = getEthereumContract();

      const transactionHash = await transactionContract.claimReward(referred);

      await transactionHash.wait();

      // console.log({ transactionHash });

      if ((transactionHash.hash as string).length > 0) {
        dispatch(
          referralService.claimReward({
            api: axiosToken,
            data: {
              referred,
              hash: transactionHash.hash,
            },
          })
        );
      }
    } catch (err: any) {
      // Extract the relevant information from the error object
      const action = err.action; // action field from the error object
      const code = err.code; // code field from the error object

      // Display a user-friendly message based on the error code
      let errorMessage = "";
      if (code === "ACTION_REJECTED") {
        errorMessage = "Transaction rejected by the user.";
      } else if (code === ethers.utils.Logger.errors.UNPREDICTABLE_GAS_LIMIT) {
        errorMessage = "Transaction failed: Gas limit issue. Please try again.";
      } else if (code === ethers.utils.Logger.errors.INSUFFICIENT_FUNDS) {
        errorMessage = "Transaction failed: Insufficient fund.";
      } else if (code === ethers.utils.Logger.errors.NETWORK_ERROR) {
        errorMessage = "Transaction failed: Network error.";
      } else {
        errorMessage = `${code}: An error occurred during the transaction.`;
      }

      error(errorMessage); // Display only the important information to the user
    } finally {
      setLoading(false);
    }
  };

  //Create trade
  const createTrade = async ({
    pair,
    exchange_name,
    amount,
    take_profit,
    active,
  }: {
    pair: string;
    exchange_name: string;
    amount: string;
    take_profit: boolean;
    active: boolean;
  }) => {
    setLoading(true);
    try {
      const transactionContract = getEthereumContract();
      // console.log({
      //   pair,
      //   exchange_name,
      //   amount,
      //   take_profit,
      //   active,
      //   transactionContract,
      // });
      const transactionHash = await transactionContract.createTrade(
        pair,
        exchange_name,
        parseInt(amount),
        take_profit,
        active
      );

      // console.log({ transactionHash });

      await transactionHash.wait();
      // console.log({ transactionHash });
    } catch (err: any) {
      // Extract the relevant information from the error object
      const action = err.action; // action field from the error object
      const code = err.code; // code field from the error object
      console.log(err);

      // Display a user-friendly message based on the error code
      let errorMessage = "";
      if (code === "ACTION_REJECTED") {
        errorMessage = "Transaction rejected by the user.";
      } else if (code === ethers.utils.Logger.errors.UNPREDICTABLE_GAS_LIMIT) {
        errorMessage = "Transaction failed: Gas limit issue. Please try again.";
      } else if (code === ethers.utils.Logger.errors.INSUFFICIENT_FUNDS) {
        errorMessage = "Transaction failed: Insufficient fund.";
      } else if (code === ethers.utils.Logger.errors.NETWORK_ERROR) {
        errorMessage = "Transaction failed: Network error.";
      } else {
        errorMessage = `${code}: An error occurred during the transaction.`;
      }

      error(errorMessage); // Display only the important information to the user
    } finally {
      setLoading(false);
    }
  };

  // Send the transaction
  const paySubscription = async (
    dollarAmount: string,
    subId: number,
    expiry_date: string,
    network: number,
    units: number,
    isFromPrice?: boolean,
    router?: any,
    axiosT?: AxiosInstance
  ) => {
    setLoading(true);
    try {
      // console.log({
      //   amount: Math.ceil(parseFloat(dollarAmount) * units).toFixed(0),
      //   dollarAmount,
      //   units,
      // });
      const parsedDollarAmount = ethers.utils.parseUnits(dollarAmount, 18);
      const totalAmount = parsedDollarAmount.mul(units);

      const approve = await approveTransaction(
        ethers.utils.formatUnits(totalAmount, 18)
      );
      if (approve) {
        const transactionContract = getEthereumContract();

        const time = Date.now();

        const gasEstimate =
          await transactionContract.estimateGas.paySubscription(
            totalAmount,
            time
          );
        const transactionHash = await transactionContract.paySubscription(
          totalAmount,
          time,
          { gasLimit: gasEstimate }
        );

        await transactionHash.wait();

        if (transactionHash.hash) {
          dispatch(
            subscriptionService.createSubscription({
              api: axiosT ?? axiosToken,
              data: {
                subscription_id: subId,
                transaction_hash: transactionHash.hash,
                expiry_date,
                payment_id: network,
                tokens: units,
              },
              onSuccess: async (data) => {
                const referrerIds = data.map((d) => d.referrer_id);
                const rewardAmounts = data.map((d) => {
                  const amount = parseFloat(d.reward_amount ?? "0");
                  // Ensure the amount is valid and non-negative
                  if (isNaN(amount) || amount < 0) {
                    throw new Error("Invalid reward amount");
                  }
                  return ethers.utils.parseUnits(amount.toString(), 18);
                });

                // Check if arrays are valid
                if (referrerIds.length !== rewardAmounts.length) {
                  throw new Error(
                    "Referrer IDs and Reward Amounts length mismatch"
                  );
                }

                const gasEstimateReferral =
                  await transactionContract.estimateGas.setReferralReward(
                    referrerIds,
                    rewardAmounts,
                    time
                  );
                const hash = await transactionContract.setReferralReward(
                  referrerIds,
                  rewardAmounts,
                  time,
                  { gasLimit: gasEstimateReferral }
                );

                await hash.wait();

                if (isFromPrice) {
                  router.push("/dashboard/subscription");
                }
              },
            })
          );
        }

        // const receipt = await transactionHash.wait();
      }
    } catch (err: any) {
      console.log({ err });
      // Extract the relevant information from the error object
      const action = err.action; // action field from the error object
      const code = err.code; // code field from the error object

      // Display a user-friendly message based on the error code
      let errorMessage = "";
      if (code === "ACTION_REJECTED") {
        errorMessage = "Transaction rejected by the user.";
      } else if (code === ethers.utils.Logger.errors.UNPREDICTABLE_GAS_LIMIT) {
        errorMessage = "Transaction failed: Gas limit issue. Please try again.";
      } else if (code === ethers.utils.Logger.errors.INSUFFICIENT_FUNDS) {
        errorMessage = "Transaction failed: Insufficient fund.";
      } else if (code === ethers.utils.Logger.errors.NETWORK_ERROR) {
        errorMessage = "Transaction failed: Network error.";
      } else {
        errorMessage = `${code}: An error occurred during the transaction.`;
      }

      error(errorMessage); // Display only the important information to the user
    } finally {
      setLoading(false);
    }
  };

  return {
    connectWallet,
    paySubscription,
    connectedAccount,
    loading,
    createTrade,
    getEthereumContract,
    claimReferralReward,
    mobileConnectWallet,
    // setReward,
  };
};

export default useEthereum;
