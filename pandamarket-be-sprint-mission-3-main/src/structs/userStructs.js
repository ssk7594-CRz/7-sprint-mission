import { object, string, size, optional } from 'superstruct';

export const UpdateUserStruct = object({
  nickname: optional(string()),
  image: optional(string()),
});

export const ChangePasswordStruct = object({
  currentPassword: string(),
  newPassword: size(string(), 8, 20),
});