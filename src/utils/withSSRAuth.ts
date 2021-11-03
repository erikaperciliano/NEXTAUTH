import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { destroyCookie, parseCookies } from "nookies";
import { AuthTokenError } from "../services/errors/AuthTokenError";

import decode from 'jwt-decode';

type WithSSRAuthOptions = {
    permissions ?: string[];
    roles?: string[];
}


export function withSSRAuth<P>(fn: GetServerSideProps<P>, options?: WithSSRAuthOptions) {
    return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {
        const cookies = parseCookies(ctx);
        const token =  cookies['nextauth.token'];

        if(!token) {
            return {
                redirect: {
                    destination: '/',
                    permanent: false
                }
            }
        }

        const user = decode(token);

        console.log(user);

        try {
            return await fn(ctx)
        }catch(err){
            if(err instanceof AuthTokenError) {
                destroyCookie(ctx, 'nextauth.token');
                destroyCookie(ctx, 'nextauth.refreshToken');
        
                // console.log(err instanceof AuthTokenError);
                // console.log(err);
                return {
                    redirect: {
                        destination: '/',
                        permanent: false
                    }
                }
            }
        }

    }

}