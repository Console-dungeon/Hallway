import { z } from "zod";

/** Enforced by Better Auth in the API and by the forms in the web app. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

const email = z.email("Podaj poprawny adres e-mail");

const newPassword = z
  .string()
  .min(
    PASSWORD_MIN_LENGTH,
    `Hasło musi mieć co najmniej ${PASSWORD_MIN_LENGTH} znaków`,
  )
  .max(PASSWORD_MAX_LENGTH, "Hasło jest za długie");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Podaj hasło"),
});

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Podaj imię i nazwisko")
    .max(100, "Imię i nazwisko są za długie"),
  email,
  password: newPassword,
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({ password: newPassword });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
