import axios from "axios";
import { logAndThrow } from "./util.js";
import { ElectronicProduct, Product } from "./product.js";

// ## Product 요청 함수 구현하기

// - [https://panda-market-api-crud.vercel.app/docs](https://panda-market-api-crud.vercel.app/docs) 의 Product API를 이용하여 아래 함수들을 구현해 주세요.

//     - `getProductList()` : GET 메소드를 사용해 주세요.
//         - `page`, `pageSize`, `keyword` 쿼리 파라미터를 이용해 주세요.

const BASE_URL = "https://panda-market-api-crud.vercel.app/products";

export async function getProductList(params) {
  try {
    if (typeof params !== "object") {
      throw new Error("invalid parameter", { cause: params });
    }
    const response = await axios.get(BASE_URL, { params });
    if (response.status !== 200) {
      throw new Error("response failed", { cause: response });
    }
    return response.data.list.map(productFromInfo);
  } catch (e) {
    logAndThrow("getting product list", e);
  }
}

//     - `getProduct()` : GET 메소드를 사용해 주세요.
export async function getProduct(productId) {
  try {
    const response = await axios.get(`${BASE_URL}/${productId}`);
    if (response.status !== 200) {
      throw new Error("response failed", { cause: response });
    }
    return productFromInfo(response.data);
  } catch (e) {
    logAndThrow("getting product", e);
  }
}

//     - `createProduct()` : POST 메소드를 사용해 주세요.
//         - request body에 `title`, `content`, `image` 를 포함해 주세요.
export async function createProduct(product) {
  try {
    const response = await axios.post(BASE_URL);
    if (response.status !== 200) {
      throw new Error("response failed", { cause: response });
    }
    return response.data;
  } catch (e) {
    logAndThrow("creating product", e);
  }
}

//     - `patchProduct()` : PATCH 메소드를 사용해 주세요.
export async function patchProduct(id, product) {
  try {
    const response = await axios.patch(`${BASE_URL}/${productId}`, product);
    if (response.status !== 200) {
      throw new Error("response failed", { cause: response });
    }
    return response.data;
  } catch (e) {
    logAndThrow("patching product", e);
  }
}

//     - `deleteProduct()` : DELETE 메소드를 사용해 주세요.
export async function deleteProduct(productId) {
  try {
    const response = await axios.delete(`${BASE_URL}/${productId}`);
    if (response.status !== 200) {
      throw new Error("response failed", { cause: response });
    }
    return response.data.id;
  } catch (e) {
    logAndThrow("deleting product", e);
  }
} //     - ElectronicProduct 클래스는 Product를 상속하며, 추가로 `manufacturer`(제조사) 프로퍼티를 가집니다.

function productFromInfo({
  name,
  description,
  price,
  tags,
  images,
  manufacturer,
}) {
  if (tags.includes("전자제품")) {
    return ElectronicProduct(
      name,
      description,
      price,
      tags,
      images,
      manufacturer
    );
  }

  return Product(name, description, price, tags, images);
}
