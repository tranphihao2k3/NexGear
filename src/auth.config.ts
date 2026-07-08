import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    basePath: "/api/auth",
    trustHost: true,
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            return true
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = (user as any).id;
                token.role = (user as any).role;
                token.siteId = (user as any).siteId ?? 'laptopthanhvo';
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).siteId = token.siteId ?? 'laptopthanhvo';
            }
            return session;
        },
    },
    providers: [], // Add providers with Node dependencies in auth.ts
} satisfies NextAuthConfig
