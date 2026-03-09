import { coerce, integer, object, string, defaulted, optional, enums, nonempty, type Infer } from 'superstruct';

const integerString = coerce(integer(), string(), (value) => parseInt(value, 10));

export const IdParamsStruct = object({
  id: integerString,
});

export const PageParamsStruct = object({
  page: defaulted(integerString, 1),
  pageSize: defaulted(integerString, 10),
  orderBy: optional(enums(['recent'])),
  keyword: optional(nonempty(string())),
});

export const CursorParamsStruct = object({
  cursor: defaulted(integerString, 0),
  limit: defaulted(integerString, 10),
  orderBy: optional(enums(['recent'])),
  keyword: optional(nonempty(string())),
});


export type IdParams = Infer<typeof IdParamsStruct>;
export type PageParams = Infer<typeof PageParamsStruct>;
export type CursorParams = Infer<typeof CursorParamsStruct>;