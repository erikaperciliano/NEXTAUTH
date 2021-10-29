import { rejects } from 'assert';
import axios, { AxiosError } from 'axios';
import { parseCookies, setCookie } from 'nookies';
import { signOut } from '../context/AuthContext';
import { AuthTokenError } from './errors/AuthTokenError';

let isRefreshing = false;
let faileRequestsQueue = [];

export function setupAPIClient(ctx = undefined) {
    let cookies = parseCookies(ctx);

    const api = axios.create({
        baseURL: 'http://localhost:3333',
        headers: {
            Authorization: `Bearer ${cookies['nextauth.token']}`
        }
    });
    
    
    api.interceptors.response.use(response => {
        return response;
    }, (error: AxiosError) => {
        if(error.response.status === 401) {
            if(error.response.data?.code === 'token.expired') {
                // renew the token
                cookies = parseCookies(ctx);
    
                const { 'nextauth.refreshToken': refreshToken } = cookies;
                const originalConfig = error.config;
    
                if(!isRefreshing) {
                    isRefreshing = true;
    
                    api.post('/refresh', {
                        refreshToken,
                    }).then(response => {
                        const { token } = response.data;
        
                        setCookie(ctx, 'nextauth.token', token, {
                            maxAge: 60 * 60 * 24 * 30, 
                            path:'/'
                        });
                        setCookie(ctx, 'nextauth.refreshToken', response.data.refreshToken, {
                            maxAge: 60 * 60 * 24 * 30,
                            path:'/' 
                        });
        
                        api.defaults.headers['Authorization'] = `Beare ${token}`;
    
                        faileRequestsQueue.forEach(request => request.onSuccess(token));
                        faileRequestsQueue = []; //cleaning the row
        
                    }).catch(err => {
                        faileRequestsQueue.forEach(request => request.onFaile(err));
                        faileRequestsQueue = []; 
    
                        if(process.browser) {
                            signOut();
                        }
                    }).finally(() => {
                        isRefreshing = false;
                    });
                }
    
                return new Promise((resolve, reject) => {
                    faileRequestsQueue.push({
                        onSuccess: (token: string) => {
                            originalConfig.headers['Authorization'] = `Bearer ${token}`
                            
                            resolve(api(originalConfig)); // It´s the same that using async (it´s not possibel in this case)
                        },
                        onFaile: (err: AxiosError) => {
                            reject(err);
                        } 
                    })
                })
            } else {
                //log out the user
                if(process.browser) {
                    signOut();
                }else {
                    return Promise.reject( new AuthTokenError())
                }
            }
        }
    
        return Promise.reject(error);
    });

    return api;
}