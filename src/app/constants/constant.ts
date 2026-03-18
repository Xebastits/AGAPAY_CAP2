 import { arcTestnet } from "thirdweb/chains";

export const NETWORK = arcTestnet;

export const AGAPAY_TOKEN_ADDRESS = "0x562f8FFd7814f396AeC7627c9998Be13d8bD9b9f"; 

export const AGAPAY_TOKEN_INFO = {
    address: AGAPAY_TOKEN_ADDRESS,
    name: "Agapay PHPC",
    symbol: "PHPC",
    icon: "", 
};

export const ADMIN_ADDRESSES = [
  "0x8C11b2592173895afA6CefaAa7085bFc909815f1",
  "0x5e18f607D5b8fD776D1634527395CC98224d059B",
];

export const isAdmin = (address: string | undefined): boolean => {
  if (!address) return false;
  
  return ADMIN_ADDRESSES.some(
    (admin) => admin.toLowerCase() === address.toLowerCase()
  );
};

export const CROWDFUNDING_FACTORY = "0x00e97582D5C4971Fd45EA7Fed88F1D91E86B0D77";
