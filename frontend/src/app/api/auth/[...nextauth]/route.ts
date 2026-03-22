import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        try {
          const endpoint = credentials.email.includes('admin') ? '/auth/login-admin' : '/auth/login';
          const res = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'POST',
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
            headers: { 'Content-Type': 'application/json' }
          });
          
          const json = await res.json();
          if (res.ok && json.data?.token) {
            // Store the backend JWT as the NextAuth user ID
            return { id: json.data.token, email: credentials.email, name: credentials.email.split('@')[0] };
          }
        } catch (error) {
          console.error('Backend auth error', error);
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id; // user.id holds our backend JWT
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        // Expose backend JWT via session.user.id
        (session.user as any).id = token.id;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
  },
  secret: 'fec-vsm-demo-secret-key-not-for-production',
});

export { handler as GET, handler as POST };
