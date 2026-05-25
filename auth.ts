import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const USERS = [
  {
    id: "jay",
    name: "Jay",
    email: process.env.JAY_EMAIL ?? "",
    get hash() { return Buffer.from(process.env.JAY_PASSWORD_HASH ?? "", "base64").toString("utf-8"); },
  },
  {
    id: "raffaele",
    name: "Raffaele",
    email: process.env.RAFFAELE_EMAIL ?? "",
    get hash() { return Buffer.from(process.env.RAFFAELE_PASSWORD_HASH ?? "", "base64").toString("utf-8"); },
  },
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        const email    = (credentials?.email    as string | undefined)?.toLowerCase().trim();
        const password = (credentials?.password as string | undefined) ?? "";

        console.log("[auth] authorize called — email:", email);
        console.log("[auth] USERS loaded:", USERS.map(u => ({ email: u.email, hashLen: u.hash?.length, hashStart: u.hash?.substring(0, 10) })));

        const user = USERS.find((u) => u.email.toLowerCase() === email);
        if (!user?.hash) {
          console.log("[auth] user not found or hash empty");
          return null;
        }
        const ok = bcrypt.compareSync(password, user.hash);
        console.log("[auth] bcrypt result:", ok);
        if (!ok) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
