
import axios from 'axios';

if (process.env.REACT_APP_API_URL) {
    axios.defaults.baseURL = process.env.REACT_APP_API_URL;
}

export const setToken = (token: string) => localStorage.setItem(('token'), token);
export const getToken = () => localStorage.getItem('token');
export const clearToekn = () => localStorage.removeItem('token');

export const setAuth = (token: string, userId: string, userType: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    localStorage.setItem('userType', userType);
    axios.defaults.headers.common['token'] = token;
    axios.defaults.headers.common['userid'] = userId;
    axios.defaults.headers.common['usertype'] = userType;
};

export const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    delete axios.defaults.headers.common['token'];
    delete axios.defaults.headers.common['userid'];
    delete axios.defaults.headers.common['usertype'];
};

// TODO: isAuthenticated just checks if a token key exists -- it doesn't validate the token, fine for demo, but will need to be fixed later
export const isAuthenticated = () => !!localStorage.getItem('token');

export const restoreAuth = () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userType = localStorage.getItem('userType');
    if (token && userId && userType) {
        axios.defaults.headers.common['token'] = token;
        axios.defaults.headers.common['userid'] = userId;
        axios.defaults.headers.common['usertype'] = userType;
    }
};
