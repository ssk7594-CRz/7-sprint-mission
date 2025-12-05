// Product 스키마를 작성해 주세요.
// id, name, description, price, tags, createdAt, updatedAt필드를 가집니다.
// 필요한 필드가 있다면 자유롭게 추가해 주세요.

import { DESTRUCTION } from "dns";
import { describe } from "node:test";
import { Pool } from "pg";

export class Product {
  constructor(id, name, description, price, tags, createdAt, updatedAt) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.price = price;
    this.tags = tags;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromEntity({
    id,
    name,
    description,
    price,
    tags,
    created_at,
    updated_at,
  }) {
    const info = {
      id: id.toString(), // bigInt => string
      name: name,
      description: description,
      price: price,
      tags: tags,
      createdAt: created_at, // created_at => createdAt
      updatedAt: updated_at, // updated_at => updatedAt
    };
    validateProductInfo(info);
    // 출입국 심사... imigration입니다...

    return new Product(
      info.id,
      info.name,
      info.description,
      info.price,
      info.tags,
      info.createdAt,
      info.updatedAt
    );
  }
}

export class UnregisteredProduct {
  // 외부에서 쓰지 못한다.
  constructor(name, description, price) {
    this.name = name;
    this.description = description;
    this.price = price;
  }

  static fromInfo({ name, description, price }) {
    const info = {
      name,
      description,
      price,
    };
    validateUnregisteredProductInfo(info);
    // 출입국 심사... imigration입니다...

    return new UnregisteredProduct(info.name, info.description, info.price);
  }
}

function validateId(id) {
  if (typeof id !== "string") {
    throw new Error(`Invalid id type ${typeof id}}`);
  }
}

function validateName(name) {
  if (!name) throw new Error("Falsy name");
}

function validateDescription(description) {
  if (!description) throw new Error("Falsy description");
}

function validatePrice(price) {
  if (price === null || price === undefined) {
    throw new Error("Price must be provided.");
  }
  if (isNaN(price) || Number(price) < 0) {
    throw new Error(`Invalid price value, ${price}`);
  }
}

function validatdCreatedAt(createaT) {
  if (new Date("2024-01-01") > createat) {
    throw new Error(`Invalid createAT ${createat.toString()}`);
  }
}

function validateUpdatedAt(updatedat) {
  if (new Date("2024-01-01") > updatedat) {
    throw new Error(`Invalid updatedAt ${updatedat.toString()}`);
  }
}

function validateProductInfo({
  id,
  name,
  description,
  price,
  tags,
  createdAt,
  updatedAt,
}) {
  validateId(id);
  validateName(name);
  validateDescription(description);
  validatePrice(price);
  validateTags(tags);
  validatdCreatedAt(createdAt);
  validateUpdatedAt(updatedAt);
}

function validateUnregisteredProductInfo({ name, description, price }) {
  validateName(name);
  validateDescription(description);
  validatePrice(price);
}
