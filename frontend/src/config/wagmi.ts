import { http, createConfig } from 'wagmi';
import {
  mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
  avalanche,
  sepolia,
  polygonMumbai,
} from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

export const config = getDefaultConfig({
  appName: 'Basket Enhanced',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID || 'YOUR_PROJECT_ID',
  chains: [mainnet, polygon, arbitrum, optimism, base, avalanche, sepolia, polygonMumbai],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [avalanche.id]: http(),
    [sepolia.id]: http(),
    [polygonMumbai.id]: http(),
  },
});
