import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().nonempty('Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z
  .object({
    email: z.string().nonempty('Email is required').email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    passwordConfirmation: z.string().min(6, 'Password confirmation is required'),
    agreeToTerms: z.boolean().refine(val => val === true, {
      message: 'You must agree to the Terms and Privacy Policy',
    }),
  })
  .refine(data => data.password === data.passwordConfirmation, {
    message: "Passwords don't match",
    path: ['passwordConfirmation'],
  });
