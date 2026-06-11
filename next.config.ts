import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Rewrite /iclock/* to /api/iclock/* for ADMS device compatibility
  async rewrites() {
    return [
      { source: '/iclock/cdata', destination: '/api/iclock/cdata' },
      { source: '/iclock/ping', destination: '/api/iclock/ping' },
      { source: '/iclock/getrequest', destination: '/api/iclock/getrequest' },
      { source: '/iclock/devicecmd', destination: '/api/iclock/devicecmd' },
      { source: '/iclock/fdata', destination: '/api/iclock/cdata' },
      // PHP compatibility (some firmware versions use .php extension)
      { source: '/iclock/cdata.php', destination: '/api/iclock/cdata' },
      { source: '/iclock/ping.php', destination: '/api/iclock/ping' },
      { source: '/iclock/getrequest.php', destination: '/api/iclock/getrequest' },
      { source: '/iclock/devicecmd.php', destination: '/api/iclock/devicecmd' },
      // ASPX compatibility (some ZKTeco/eSSL firmware versions use .aspx extension)
      { source: '/iclock/cdata.aspx', destination: '/api/iclock/cdata' },
      { source: '/iclock/ping.aspx', destination: '/api/iclock/ping' },
      { source: '/iclock/getrequest.aspx', destination: '/api/iclock/getrequest' },
      { source: '/iclock/devicecmd.aspx', destination: '/api/iclock/devicecmd' },
    ];
  },
};

export default nextConfig;
