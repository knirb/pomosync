const homeSchema = {
  room: {
    maxLength: {
      value: 30,
      message: "Max 30 characters",
    },
  },
  username: {
    maxLength: {
      value: 30,
      message: "Max 30 characters",
    },
  },
};
export default homeSchema;
