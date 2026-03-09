import { assert } from 'superstruct';
import { SignUpStruct, SignInStruct } from '../structs/authStructs'; 
import type { Request, Response, NextFunction } from 'express';


export const validateSignUp = (req: Request, res: Response, next: NextFunction) => {
  try {
    // req.body가 SignUpStruct 구조와 일치하는지 확인
    assert(req.body, SignUpStruct);
    next();
  } catch (error: any) {
    res.status(400).json({ 
      message: '입력 데이터 형식이 올바르지 않습니다.', 
      details: error.message 
    });
  }
};


export const validateSignIn = (req: Request, res: Response, next: NextFunction) => {
  try {
    assert(req.body, SignInStruct);
    next();
  } catch (error: any) {
    res.status(400).json({ 
      message: '로그인 정보 형식이 올바르지 않습니다.', 
      details: error.message 
    });
  }
};