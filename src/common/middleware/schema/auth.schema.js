import * as z from "zod";
import { GenderEnum } from "../../enum/user.enum.js";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, {
  message: "Invalid ObjectId",
});

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100);

export const signUpSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(3).max(50),
      email: z.string().trim().toLowerCase().email(),
      password: passwordSchema,
      rePassword: z.string(),
      gender: z.enum(Object.values(GenderEnum)).optional(),
      phone: z
        .string()
        .regex(/^01[0125]\d{8}$/, {
          message: "Invalid phone number",
        })
        .optional(),
    })
    .refine((data) => data.password === data.rePassword, {
      message: "Passwords do not match",
      path: ["rePassword"],
    }),
});

export const signInSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1),
  }),
});

export const resetPasswordSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    newPassword: passwordSchema,
  }),
});

export const updatePasswordSchema = z.object({
  body: z
    .object({
      oldPassword: passwordSchema,

      newPassword: passwordSchema,

      rePassword: z.string(),
    })
    .refine((data) => data.newPassword === data.rePassword, {
      message: "Passwords do not match",
      path: ["rePassword"],
    }),
});

export const employeesStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});
