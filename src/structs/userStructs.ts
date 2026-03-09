import { object, string, size, optional, type Infer } from 'superstruct';

export const UpdateUserStruct = object({
  nickname: optional(string()),
  image: optional(string()),
});

export const ChangePasswordStruct = object({
  currentPassword: string(),
  newPassword: size(string(), 8, 20),
});

export type UpdateUserBody = Infer<typeof UpdateUserStruct>;
export type ChangePasswordBody = Infer<typeof ChangePasswordStruct>;