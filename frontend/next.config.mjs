/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    tsconfigPath: './tsconfig.json'
  },
  webpack: (config, { isServer }) => {
    config.externals.push('pino-pretty', 'encoding');
    
    // Handle optional dependencies from MetaMask SDK
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
    };
    
    return config;
  }
};

export default nextConfig;
