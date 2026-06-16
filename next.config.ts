import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // dev 서버를 LAN IP(다른 기기/브라우저)로 접근할 때 JS 자산이 차단되지 않도록 허용
  allowedDevOrigins: ["192.168.45.59", "192.168.219.127"],
};

export default nextConfig;
