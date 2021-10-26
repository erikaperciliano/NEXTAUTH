import { createContext, ReactNode, useState } from 'react';
import { setCookie } from 'nookies';
import Router from 'next/router';

import { api } from '../services/api';

type User = {
    email: string;
    permissions: string[];
    roles: string[];
}

type SignInCredentials = {
    email: string;
    password: string;
}

type AuthContextData = {
    signIn(credentials: SignInCredentials): Promise<void>;
    user: User;
    isAuthenticated: boolean;
};

type AuthProviderProps = {
    children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData)

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User>();
    const isAuthenticated = !!user; //if user is not empty

    async function signIn({ email, password }: SignInCredentials) {
        try {
            const response = await api.post('sessions', {
                email,
                password
            });

            const { token, refreshToken, permissions, roles } = response.data;
            
            setCookie(undefined, 'nextauth.token', token, {
                maxAge: 60 * 60 * 24 * 30, // time of cookie saved at browser | 30 days
                path:'/' // all address has access this cookie
            });
            setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
                maxAge: 60 * 60 * 24 * 30,
                path:'/' 
            });

            setUser({
                email,
                permissions,
                roles
            })

            Router.push('/dashboard');
        }catch(err) {
            console.log(err)
        }
        
    }

    return (
        <AuthContext.Provider value={{ signIn, isAuthenticated, user }}>
            {children}
        </AuthContext.Provider>
    )
}