import axios from 'axios';

type LoginBody = { email: string; password: string };
export const login = ({ email, password }: LoginBody) => {
    try {
        return axios.post('/api/users/login', {
            email,
            password,
        }) as Promise<{ data: { token: string; userId: string; userType: string } }>;
    } catch (error) {
        console.error(error);
    }
};
