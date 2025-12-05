// prisma/seed.js
import { prisma } from "./prisma.js";

async function main() {
  // 기존 데이터 삭제 (초기화)
  console.log("--- 시딩 시작 ---");
  console.log("Delete previous data");
  await prisma.article.deleteMany();

  // 더미 데이터 생성
  console.log("Seed dummies");
  const payload = await prisma.article.createMany({
    data: [
      {
        title: "title1",
        content: "content1",
      },
      {
        title: "title2",
        content: "content2",
      },
      {
        title: "title3",
        content: "content3",
      },
    ],
  });

  console.log(payload.count, " dummies seeded");
  console.log("--- 시딩 끝 ---");
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
