import { object, string, size, type Infer } from 'superstruct';

export const SignUpStruct = object({
  email: string(), 
  nickname: string(),
  password: size(string(), 8, 20),
});

export const SignInStruct = object({
  email: string(),
  password: string(),
});

export type SignUpBody = Infer<typeof SignUpStruct>;
export type SignInBody = Infer<typeof SignInStruct>;