// main.js

// Product 클래스 - 추상화와 캡슐화를 고려
export class Product {
  //외부에서 가져갈 수 있도록 export 사용, import통해 가져가기 가능
  #favoriteCount; // private 필드로 캡슐화, 밖에서 컨택하지 못하게 함

  constructor(name, description, price, tags = [], images = []) {
    //여기는 객체 아님 {}금지
    // =[]은 기본값 설정한 것임, name, descriptino, price는 필수 값이라는 뜻!
    //favoriteCount가 파라미터로 들어가지 않은 이유는 외부에서 받는 정보가 아니기 때문임
    this.name = name;
    this.description = description;
    this.price = price;
    this.tags = tags;
    this.images = images;

    this.#favoriteCount = 0; //새로운 객체가 생성될때마다 카운트(초기화)해주기 위해 =0 할당함
  }

  // 찜하기 메소드
  favorite() {
    this.#favoriteCount++;
  }
  //getter 이용해 외부에서도 Count 되는걸 볼 수 있게함, 해당 문제에서는 없어도 ㄱㅊ
  get favoriteCount() {
    return this.#favoriteCount;
  }
}

/**
 * Product 데이터 검증
 * @param {Object} productData - 검증할 Product 데이터
 * @throws {Error} 검증 실패 시 에러 발생
 */
function validateProduct(name, description, price, tags, images) {
  // 필수 필드 존재 여부 확인
  const missingFields = [];
  if (name === undefined) missingFields.push("name");
  if (description === undefined) missingFields.push("description");
  if (price === undefined || price === null) missingFields.push("price");
  if (!tags) missingFields.push("tags");
  if (!images) missingFields.push("images");
  //조건이 안맞을때마다 missingFields에 해당 파라미터가 추가되어지고 밑의 함수로 인해 걸러짐

  if (missingFields.length > 0) {
    throw new Error(`필수 필드가 누락되었습니다: ${missingFields.join(", ")}`);
  }
  // 추가된 파라미터가 하나라도 있을 시 필수필드가 누락되어짐을 알려주는 코드이다

  // 데이터 타입 검증
  if (typeof name !== "string") {
    throw new Error("name은 문자열이어야 합니다.");
  }
  if (typeof description !== "string") {
    throw new Error("description은 문자열이어야 합니다.");
  }
  if (typeof price !== "number" || price < 0) {
    throw new Error("price는 0 이상의 숫자여야 합니다.");
  }
  if (!Array.isArray(tags)) {
    throw new Error("tags는 배열이어야 합니다.");
  }
  if (!Array.isArray(images)) {
    throw new Error("images는 배열이어야 합니다.");
  }
}

// ElectronicProduct 클래스 - 상속
export class ElectronicProduct extends Product {
  constructor(name, description, price, tags = [], images = [], manufacturer) {
    super(name, description, price, tags, images);
    this.manufacturer = manufacturer;
  }

  // 다형성: 부모 클래스의 메소드를 오버라이드할 수 있음
  //favorite()은 메소드, favoriteCount는 필드이므로 상속되어도 favoriteCount 불가능
  favorite() {
    super.favorite();
  }
}

// Article 클래스
export class Article {
  #likeCount; // private 필드로 캡슐화
  #createdAt; // private 필드로 캡슐화

  constructor(title, content, image) {
    this.title = title;
    this.content = content;
    this.image = image;
    this.#likeCount = 0;
    this.#createdAt = new Date(); // 현재 시간 저장
  }

  // 좋아요 메소드
  like() {
    this.#likeCount++;
  }

  // get likeCount() {
  //   return this.#likeCount;
  // }
}
