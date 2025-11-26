import axios from "axios";
import { Article } from "./main.js";

// ## Article 요청 함수 구현하기

// - [https://panda-market-api-crud.vercel.app/docs]
// (https://panda-market-api-crud.vercel.app/docs)의 Article API를 이용하여 아래 함수들을 구현해 주세요.

//     - `getArticleList()`: GET 메소드를 사용해 주세요.
//         - `page`,`pageSize`,`keyword`쿼리 파라미터를 이용해 주세요.
// https://panda-market-api-crud.vercel.app/articles

//catch문 사용위해 error 문 작성 해놓기
const logAndThrow = (error) => {
  console.error("Error fetching article list:", error); //console.error문 설명듣기
  throw error;
};

const articleFromInfo = ({ title, content, image }) =>
  new Article(title, content, image); //인스턴스 선언

// getArticleList() : GET 메소드를 사용해 주세요.
// page, pageSize, keyword 쿼리 파라미터를 이용해 주세요

function getArticleList(params) {
  return axios
    .get("https://panda-market-api-crud.vercel.app/articles", { params })
    .then((response) => response.data.list.map(articleFromInfo))
    .catch(logAndThrow);
}

//`getArticle()`: GET 메소드를 사용해 주세요.
function getArticle(articleId) {
  return axios
    .get(`https://panda-market-api-crud.vercel.app/articles/${articleId}`)
    .then(articleFromInfo)
    .catch(logAndThrow);
}
// , 안쓰고 $ 쓴이유

//     - `createArticle()`: POST 메소드를 사용해 주세요.
//         - request body에`title`,`content`,`image`를 포함해 주세요.
function createArticle(article) {
  return axios
    .post("https://panda-market-api-crud.vercel.app/articles", article)
    .catch(logAndThrow);
}

//     - `patchArticle()`: PATCH 메소드를 사용해 주세요.
function patchArticle(id, article) {
  return axios
    .patch(
      `https://panda-market-api-crud.vercel.app/articles/${articleId}`,
      article
    )
    .catch(logAndThrow);
}

//     - `deleteArticle()`: DELETE 메소드를 사용해 주세요.
function deleteArticle(articleId) {
  return axios
    .delete(`https://panda-market-api-crud.vercel.app/articles/${articleId}`)
    .then(({ id }) => id)
    .catch(logAndThrow);
}
