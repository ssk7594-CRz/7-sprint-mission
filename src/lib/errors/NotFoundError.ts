class NotFoundError extends Error {
  constructor(modelName: string, id: string | number) {
    super(`${modelName} with id ${id} not found`);
    
    this.name = 'NotFoundError';

    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export default NotFoundError;