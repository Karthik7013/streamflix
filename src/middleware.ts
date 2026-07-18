import { proxy } from "@/lib/proxy";

export const config = {
  matcher: "/api/:path*",
};

export default proxy;
