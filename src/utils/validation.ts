import { z } from 'zod';

export const phoneSchema = z.string().regex(/^\+228[0-9]{8}$/, {
  message: "Le numéro doit être au format +228XXXXXXXX (8 chiffres après l'indicatif)",
});

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export const registrationSchema = loginSchema.extend({
  fullName: z.string().min(2, "Le nom complet est requis"),
  role: z.enum(['buyer', 'seller']).default('buyer'),
});
