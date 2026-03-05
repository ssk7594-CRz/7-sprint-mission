// src/middlewares/validate.js

import { assert } from 'superstruct';
import { SignUpStruct, SignInStruct } from '../structs/authStructs.js';

export const validateSignUp = (req, res, next) => {
  try {
    assert(req.body, SignUpStruct);
    next();
  } catch (error) {
    res.status(400).json({ 
      message: '입력 데이터 형식이 올바르지 않습니다.', 
      details: error.message 
    });
  }
};

export const validateSignIn = (req, res, next) => {
  try {
    assert(req.body, SignInStruct);
    next();
  } catch (error) {
    res.status(400).json({ 
      message: '로그인 정보 형식이 올바르지 않습니다.', 
      details: error.message 
    });
  }
};