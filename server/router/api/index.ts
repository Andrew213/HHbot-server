import axios, { AxiosInstance } from 'axios';
import { Response } from 'express';

class API {
    protected axiosInstance: AxiosInstance;

    constructor() {
        this.axiosInstance = axios.create({
            baseURL: 'https://api.hh.ru/',
            headers: {
                'User-Agent': 'HHbot (mega.zip2013@gmail.com)'
            },
            withCredentials: true,
            validateStatus: status => status >= 200 && status < 300
        });
    }
    public setAuthHeader(access_token: string) {
        this.axiosInstance.defaults.headers.common[
            'Authorization'
        ] = `Bearer ${access_token}`;
    }
    public async getData(endPoint: string, data?: Record<string, any>) {
        try {
            const response = await this.axiosInstance.get(endPoint);

            return response;
        } catch (error) {
            throw error.response;
        }
    }

    public async postData(endPoint: string, data?: Record<string, any>) {
        try {
            const response = await this.axiosInstance.post(endPoint, data);

            return response;
        } catch ({ response }) {
            throw response;
        }
    }

    public getHeaders() {
        return this.axiosInstance.defaults.headers;
    }
}

const api = new API();

export { api, API };
