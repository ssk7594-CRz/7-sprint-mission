import express from "express";
import cors from "cors";
import articleRouter from "./routes/article.route.js";
import { HttpError } from "./errors/customErrors.js";

import { config } from "dotenv";
config(); // .env 읽어서 process.env.아래 위치시키기

const app = express();
app.use(express.json());
app.use(cors());

app.use("/articles", articleRouter);

app.get("/", (req, res) => {
  res.json({
    message: "RESTful API server",
    endpoints: ["/products", "/articles"],
  });
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err);
  console.error(err.stack);

  // HttpError 인스턴스인 경우 (400, 404 등 커스텀 에러)
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        statusCode: err.statusCode,
      },
    });
  }

  // Prisma 에러 처리
  if (err.code) {
    // Prisma unique constraint violation
    if (err.code === "P2002") {
      return res.status(400).json({
        error: {
          message: "이미 존재하는 데이터입니다.",
          statusCode: 400,
        },
      });
    }
    // Prisma record not found
    if (err.code === "P2025") {
      return res.status(404).json({
        error: {
          message: "요청한 데이터를 찾을 수 없습니다.",
          statusCode: 404,
        },
      });
    }
  }

  // 기본 500 에러 (예상치 못한 에러)
  res.status(500).json({
    error: {
      message: "서버 내부 오류가 발생했습니다.",
      statusCode: 500,
    },
  });
});

const apiPort = process.env.API_PORT; // 읽어온 port 설정
app.listen(apiPort, () => {
  console.log(`떴다 ${apiPort}`);
});

app.use("/api/profile", require("./routes/profile"));
app.use("/uploads", express.static("uploads"));
