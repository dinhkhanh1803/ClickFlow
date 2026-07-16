'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { notifyMockSignIn } from '@/lib/feedback/toast-feedback';
const schema=z.object({email:z.string().email('Enter a valid email address.'),password:z.string().min(8,'Use at least 8 characters.')}); type FormValues=z.infer<typeof schema>;
export function LoginForm(){const {register,handleSubmit,formState:{errors,isSubmitSuccessful}}=useForm<FormValues>({resolver:zodResolver(schema)}); return <form onSubmit={handleSubmit(()=>notifyMockSignIn())} className="space-y-4" noValidate><div><label htmlFor="email" className="mb-1 block text-sm font-medium">Email address</label><Input id="email" type="email" {...register('email')} aria-invalid={Boolean(errors.email)} placeholder="name@company.com"/>{errors.email&&<p role="alert" className="mt-1 text-sm text-rose-600">{errors.email.message}</p>}</div><div><label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label><Input id="password" type="password" {...register('password')} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"/>{errors.password&&<p role="alert" className="mt-1 text-sm text-rose-600">{errors.password.message}</p>}</div><Button className="w-full" type="submit">Sign in</Button>{isSubmitSuccessful&&<p role="status" className="text-sm text-emerald-600">Mock sign-in successful.</p>}</form>}