import { object, string, size } from 'superstruct';

export const SignUpStruct = object({
  email: string(),
  nickname: string(),
  password: size(string(), 8, 20), // 예시: 8~20자 사이
});

export const SignInStruct = object({
  email: string(),
  password: string(),
});