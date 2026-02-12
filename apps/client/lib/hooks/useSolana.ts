import { useState } from "react";
// import { useDispatch } from "react-redux";
// import { WalletAdapterNetwork, WalletError } from "@solana/wallet-adapter-base";
// import {
//   Keypair,
//   PublicKey,
//   clusterApiUrl,
//   Cluster,
//   Connection,
//   Transaction,
//   SystemProgram,
//   LAMPORTS_PER_SOL,
//   sendAndConfirmTransaction,
// } from "@solana/web3.js";
// import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
// import {
//   ConnectionProvider,
//   WalletProvider,
// } from "@solana/wallet-adapter-react";
// import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
// import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
// import { useMemo } from "react";
// import { AppDispatch } from "../../redux/store";
// import useAxiosAuth from "./useAxiosAuth";
// import { useMediaQuery } from "@react-hook/media-query";

const useSolana = () => {
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);
  //   const [loading, setLoading] = useState(false);
  //   const dispatch = useDispatch<AppDispatch>();
  //   const isMobile = useMediaQuery("only screen and (max-width: 768px)");
  //   const axiosToken = useAxiosAuth();
  //   const getSolanaWallet = () => {};
  //   const connectWallet = () => {};
  //   const sendSPL = (fromKey: Keypair, toAddress: string, amount: number) => {
  //     const connection = new Connection(clusterApiUrl("devnet"), "confirmed"); //TODO: Check this later for updated version
  //     console.log({ fromKey, toAddress, amount });
  //     //     const secret=[100, 77, 466, 4663, 372, 477]; // Replace with your secret key
  //     // const from = Keypair.fromSecretKey(new Uint8Array(secret));
  //     // const binaryData = Buffer.from(fromUser.toString(), "hex");
  //     // const uintpk = new Uint8Array(binaryData);
  //     // const from = Keypair.fromSecretKey(uintpk);
  //     // const mintPublicKey = new PublicKey(
  //     //   `yghde2deh2763h.....` // Token ID
  //     // );
  //     const toPublicKey = new PublicKey(toAddress);
  //     //       const toPublicKey = new PublicKey(
  //     //   `2kmfLy...` // Public key of destination wallet
  //     // );
  //     console.log({ toPublicKey });
  //     try {
  //       (async () => {
  //         const transaction = new Transaction().add(
  //           SystemProgram.transfer({
  //             fromPubkey: fromKey.publicKey,
  //             toPubkey: toPublicKey,
  //             lamports: amount * LAMPORTS_PER_SOL,
  //           })
  //         );
  //         console.log("TRANSACTION", transaction);
  //         // Sign transaction, broadcast, and confirm
  //         const signature = await sendAndConfirmTransaction(
  //           connection,
  //           transaction,
  //           [fromKey]
  //         );
  //         console.log("SIGNATURE", signature);
  //       })();
  //       // const toTokenAccount = await getOrCreateAssociatedTokenAccount(
  //       //   connection,
  //       //   keyPair,
  //       //   mintPublicKey,
  //       //   toPublicKey
  //       // );
  //       // const signature = await mintTo(
  //       //   connection,
  //       //   keyPair,
  //       //   mintPublicKey,
  //       //   toTokenAccount.address,
  //       //   keyPair.publicKey,
  //       //   amount // TODO: Check conversion amount
  //       // );
  //       // console.log(`Mint signature ${signature}`);
  //     } catch (err) {
  //       console.log(err);
  //     }
  //   };
  //   const airdropSPL = async (from: PublicKey) => {
  //     const connection = new Connection(clusterApiUrl("devnet"), "confirmed"); //TODO: Check this later for updated version
  //     // const binaryData = Buffer.from("testingbuffer", "hex");
  //     // const uintpk = new Uint8Array(binaryData);
  //     // const from = Keypair.fromSecretKey(uintpk);
  //     console.log({ pkey: from.toString() });
  //     console.log({ skey: from });
  //     let balanace = await connection.getBalance(from);
  //     console.log("Balance: ", balanace);
  //     var fromAirdropSignature = await connection.requestAirdrop(
  //       from,
  //       LAMPORTS_PER_SOL //A lamport has a value of 0.000000001 SOL.
  //     );
  //     // Wait for airdrop confirmation
  //     const latestBlockHash = await connection.getLatestBlockhash();
  //     var confirm = await connection.confirmTransaction({
  //       blockhash: latestBlockHash.blockhash,
  //       lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
  //       signature: fromAirdropSignature,
  //     });
  //     console.log("Confirm: ", confirm);
  //     balanace = await connection.getBalance(from);
  //     console.log("Balance after adding 1 SOL: ", balanace);
  //   };
  //   //   const transferSPL = async (from: string, amount: number) => {
  //   //     try {
  //   //         const fromPublicKey = new PublicKey(from);
  //   //         const toPublicKey = new PublicKey("");
  //   //         const mintAddress = new PublicKey(Config.TOKEN_MINT_ADDRESS)
  //   //         const binaryData = Buffer.from(privateKey.data.privateKey, 'hex')
  //   //         const uintpk = new Uint8Array(binaryData)
  //   //         const keyPair = Keypair.fromSecretKey(uintpk);
  //   //         let sourceAccount = await getOrCreateAssociatedTokenAccount(
  //   //             SolanaWeb3,
  //   //             keyPair,
  //   //             mintAddress,
  //   //             fromPublicKey
  //   //         );
  //   //         console.log(Source Account: ${sourceAccount.address.toString()});
  //   //         let destinationAccount = await getOrCreateAssociatedTokenAccount(
  //   //             SolanaWeb3,
  //   //             keyPair,
  //   //             mintAddress,
  //   //             toPublicKey
  //   //         );
  //   //         const numberDecimals = await this.getNumberDecimals(mintAddress);
  //   //         const tx = new Transaction();
  //   //         tx.add(createTransferInstruction(
  //   //             sourceAccount.address,
  //   //             destinationAccount.address,
  //   //             fromPublicKey,
  //   //             amount * Math.pow(10, numberDecimals)
  //   //         ))
  //   //         const latestBlockHash = await SolanaWeb3.getLatestBlockhash('confirmed');
  //   //         tx.recentBlockhash = await latestBlockHash.blockhash;
  //   //         const signature = await sendAndConfirmTransaction(SolanaWeb3, tx, [keyPair]);
  //   //         return signature
  //   //     } catch (error) {
  //   //         throw error;
  //   //     }
  //   // }
  //   return {
  //     airdropSPL,
  //     sendSPL,
  //   };
};

// export default useSolana;
