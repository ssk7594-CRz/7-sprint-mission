import { nonempty, object, partial, string, type Infer } from 'superstruct';
import { CursorParamsStruct } from './commonStructs';

export const CreateCommentBodyStruct = object({
  content: nonempty(string()),
});

export const GetCommentListParamsStruct = CursorParamsStruct;
export const UpdateCommentBodyStruct = partial(CreateCommentBodyStruct);

export type CreateCommentBody = Infer<typeof CreateCommentBodyStruct>;
export type GetCommentListParams = Infer<typeof GetCommentListParamsStruct>;
export type UpdateCommentBody = Infer<typeof UpdateCommentBodyStruct>;