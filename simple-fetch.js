import axios from "axios"; //서버 통신을 위한 라이브러리, vscode에서 정의 필요 없음요~
import { Product } from "./main.js"; //이전에 작성한 코드를 불러옴, 이전에 export해서!

//url에서 qerry를 뺀주소 = 공통된 주소 = base_url
const BASE_URL = "https://panda-market-api-crud.vercel.app";

/**
 * Product 리스트 조회c
 * @param {Object} params - 쿼리 파라미터 { page, pageSize, keyword }
 * @returns {Promise<Object>} Product 리스트 데이터
 */
export async function getProductList(params = {}) {
  try {
    validateGetProductListParams(params);

    const response = await axios.get(`${BASE_URL}/products`, { params });
    //실제로 서버 전송 시 자동으로 & 형태로 변환

    console.log("Product 리스트 조회 성공:");
    console.log(`- 총 ${response.data.list.length}개의 상품을 가져왔습니다.`);

    return response.data.list.map(productFromInfo);
  } catch (error) {
    // 요청 설정 중에 오류가 발생한 경우
    console.error("❌ Product 리스트 조회 실패:", error.message);
    throw error;
  }
}

/**
 * 특정 Product 조회
 * @param {number} productId - Product ID
 * @returns {Promise<Object>} Product 데이터
 */
export async function getProduct(productId) {
  try {
    const response = await axios.get(`${BASE_URL}/products/${productId}`);

    console.log("Product 조회 성공:");
    console.log(`- ID: ${response.data.id}, 상품명: ${response.data.name}`);

    return productFromInfo(response.data);
  } catch (error) {
    console.error(`❌ Product 조회 실패 (ID: ${productId}):`, error.message);
    throw error;
  }
}

/**
 * Product 생성
 * @param {Product} product
 * @returns {Promise<Object>} 생성된 Product 데이터
 */
export async function createProduct(product) {
  try {
    const { name, description, price, tags, images } = product;
    //가독성을 위해서임, =product 안하면 name 이런거 쓸때마다 product.name 이렇게 해야함
    const response = await axios.post(`${BASE_URL}/products`, {
      name,
      description,
      price,
      tags,
      images,
    });

    console.log("Product 생성 성공:");
    console.log(`- ID: ${response.data.id}, 상품명: ${response.data.name}`);

    return response.data;
  } catch (error) {
    console.error("❌ Product 생성 실패:", error.message);
    throw error;
  }
}

/**
 * Product 수정
 * @param {number} productId - Product ID
 * @param {Object} updateData - 수정할 데이터 (name, description, price, tags, images 중 일부 또는 전부)
 * @returns {Promise<Object>} 수정된 Product 데이터
 */
export async function patchProduct(productId, updateData) {
  try {
    const response = await axios.patch(
      `${BASE_URL}/products/${productId}`,
      updateData
    );

    console.log("Product 수정 성공:");
    console.log(`- ID: ${response.data.id}, 상품명: ${response.data.name}`);

    return response.data;
  } catch (error) {
    console.error(`❌ Product 수정 실패 (ID: ${productId}):`, error.message);
    throw error;
  }
}

/**
 * Product 삭제
 * @param {number} productId - Product ID
 * @returns {Promise<void>}
 */
export async function deleteProduct(productId) {
  try {
    await axios.delete(`${BASE_URL}/products/${productId}`);

    console.log("Product 삭제 성공:");
    console.log(`- ID: ${productId} 상품이 삭제되었습니다.`);

    return null;
  } catch (error) {
    console.error(`❌ Product 삭제 실패 (ID: ${productId}):`, error.message);
    throw error;
  }
}

/**
 * GetProductsParams 데이터 검증
 * @param {Object} params - 검증할 GetProductsParams 데이터
 * @throws {Error} 검증 실패 시 에러 발생
 */
function validateGetProductListParams(params) {
  const availableParameters = ["page", "pageSize", "orderBy", "keyword"];
  //사이트에 나와있는 name들
  validatedPropertyName(availableParameters, params);

  // 데이터 타입 검증
  if (typeof keyword !== "string") {
    throw new Error("keyword 문자열이어야 합니다.");
  }
  if (typeof page !== "number" || page < 0) {
    throw new Error("page 0 이상의 숫자여야 합니다.");
    //false 값이 number가 될 수 있기에 숫자 값을 가지는 파라미터는 ||가 추가로 있다
  }
  if (typeof pagesize !== "number" || pagesize < 0) {
    throw new Error("pagesize는 0 이상의 숫자여야 합니다.");
  }
  //orderBy 파라미터는 데이터 타입 검증을 거치지 않은 이유? 거의 항상 string이라서?
}

function validatedPropertyName(availableNames, targetObject) {
  const available = new Set(availableNames);
  const propertyNames = Object.keys(targetObject);
  if (!propertyNames.every((key) => available.has(key))) {
    throw new Error(`${propertyNames} are not in ${availableNames}`);
  }
}

const productFromInfo = ({ name, description, price, tags, images }) =>
  new Product(name, description, price, tags, images);
