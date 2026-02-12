import { ethers } from "ethers";

export const isValidEthereumAddress = (address: string): boolean => {
  return ethers.utils.isAddress(address);
};
