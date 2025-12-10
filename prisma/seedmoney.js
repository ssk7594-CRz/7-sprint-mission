import { prisma } from "./prisma.js";

async function main() {
  console.log("시딩 시작");

  await prisma.product.deleteMany();
  await prisma.article.deleteMany();

  // 1. Product 모델 데이터 생성

  const product1 = await prisma.product.create({
    data: {
      name: "무선 마우스",
      description: "게이밍 무선 마우스",
      price: 85.0,
      tags: ["무선", "게이밍"],
    },
  });

  console.log(product1);

  // 2. Article 모델 데이터 생성

  const article1 = await prisma.article.create({
    data: {
      title: "Prisma 마이그레이션 핵심 정리",
      content: "데이터베이스 스키마 관리를 위한 마이그레이션 명령어 사용법.",
    },
  });

  console.log(article1);

  console.log("시딩 끝");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
