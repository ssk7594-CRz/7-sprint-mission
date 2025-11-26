export const logAndThrow = (messsage, error) => {
  console.error(`Error fetching :${messsage}`, error);
  throw error;
};
