import NextAuth, { DefaultSession } from "next-auth";
import { AuthOptions } from "../../../../lib/authOptions";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      name: string;
      email: string;
    } & DefaultSession["user"];
  }
}

const handler = NextAuth(AuthOptions);

export { handler as GET, handler as POST };
