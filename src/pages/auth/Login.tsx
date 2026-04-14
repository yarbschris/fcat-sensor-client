import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { login } from '@/routes/users';
import { useNavigate } from 'react-router-dom';
import { setAuth, setToken } from '@/lib/auth';

export const Login = () => (
    <div className="background">
        <div className="flex items-center justify-center max-w-md mx-auto my-8">
            <LoginForm />
        </div>
    </div>
);

const formSchema = z.object({
    email: z.string().email({ message: 'Invalid email' }),
    //password req: 8-20 chars, 3 out of 4 of the following: 1 uppercase, 1 lowercase, 1 number, 1 special char  password: z
    password: z
        .string()
        .regex(
            /^(?=(.*[A-Z])?)(?=(.*[a-z])?)(?=(.*\d)?)(?=(.*[!@#$%^&*()_+])?)[A-Za-z\d!@#$%^&*()_+]{8,20}$/,
            {
                message: 'invalid password',
            },
        ),
});

const LoginForm = () => {
    const navigate = useNavigate();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        const loginResponse = await login(values);
        if (!loginResponse) {
            return;
        }
        const { token, userId, userType } = loginResponse.data;
        setAuth(token, userId, userType);
        navigate('/');
    };
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage>{form.formState.errors.email?.message}</FormMessage>
                            <FormDescription>Enter your email</FormDescription>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage>
                                {form.formState.errors.password?.message}
                            </FormMessage>
                            <FormDescription>
                                Must be 8-20 characters long and contain 3 of the following:
                                uppercase, lowercase, number, special character
                            </FormDescription>
                        </FormItem>
                    )}
                />
                <FormItem>
                    <Button type="submit">Login</Button>
                </FormItem>
            </form>
        </Form>
    );
};
