import API_BASE_URL from '../config';

export const API_URL = API_BASE_URL;
export const WS_URL = API_BASE_URL.replace(/^http/, 'ws').replace(/\/api$/, '/ws');
