import { z } from 'zod';

export const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  subject: z.string().min(1, 'Subject is required').min(5, 'Subject must be at least 5 characters'),
  message: z
    .string()
    .min(1, 'Message is required')
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters'),
  category: z.enum(['technical', 'billing', 'feature-request', 'other'], {
    message: 'Please select a category',
  }),
});

export type IContactFormInput = z.infer<typeof contactFormSchema>;
