// import { NextAuthOptions } from "next-auth";
// import NextAuth from "next-auth/next";
// import CredentialsProvider from "next-auth/providers/credentials";
// import TwitterProvider from "next-auth/providers/twitter";
// import GoogleProvider from "next-auth/providers/google";
import { axiosApi } from "../../../lib/axiosApi";

// export const authOptions: NextAuthOptions = {
//   providers: [
//     CredentialsProvider({
//       name: "Candleweb",
//       credentials: {
//         wallet_address: {
//           label: "Wallet Address",
//           type: "text",
//           placeholder: "0x34D****",
//         },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(credentials, req) {
//         const { wallet_address, password } = credentials as any;
//         return (
//           axiosApi
//             .post("/user/login/", { wallet_address, password })
//             .then((response) => {
//               return axiosApi
//                 .get("/user/profile/", {
//                   headers: {
//                     Authorization: `Bearer ${response.data.access_token}`,
//                   },
//                 })
//                 .then((res) => {
//                   let myData = res.data;
//                   myData.access_token = response.data.access_token;
//                   myData.refresh_token = response.data.refresh_token;
//                   return myData;
//                 })
//                 .catch((error) => {
//                   const message =
//                     (error.response &&
//                       error.response.data &&
//                       error.response.data.message) ||
//                     error.message ||
//                     error.toString();
//                   throw new Error(message);
//                 });
//             })
//             .catch((error) => {
//               const message =
//                 (error.response &&
//                   error.response.data &&
//                   error.response.data.message) ||
//                 error.message ||
//                 error.toString();
//               throw new Error(message);
//             }) || null
//         );
//       },
//     }),
//   ],
//   session: {
//     strategy: "jwt",
//   },
//   pages: {
//     signIn: "/register",
//     signOut: "/",
//   },
//   // TODO: fix this in production
//   secret: "thisismysecretkey",
//   // secret: process.env.NEXTAUTH_SECRET,
//   callbacks: {
//     async jwt({ token, trigger, session, user }) {
//       if (trigger === "update" && session) {
//         return { ...token, ...session?.user };
//       }

//       return { ...token, ...user };
//     },
//     async session({ session, token, user }) {
//       const newUser = {
//         ...session.user,
//         ...token,
//         email: token.email!,
//       };
//       session.user = newUser;
//       return session;
//     },
//   },
// };

// export default NextAuth(authOptions);
