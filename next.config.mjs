/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "react-globe.gl",
    "globe.gl",
    "three-render-objects",
    "three-globe",
  ],
  webpack: (config) => {
    // three/tsl is a WebGPU shading module not needed for our globe
    config.resolve.alias = {
      ...config.resolve.alias,
      "three/tsl":    false,
      "three/webgpu": false,
    };
    return config;
  },
};

export default nextConfig;
