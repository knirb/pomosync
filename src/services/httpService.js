import axios from "axios";

axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL;

axios.interceptors.request.use(null, (error) => {
  const expectedError =
    error.response &&
    error.response.status >= 400 &&
    error.respons.status < 500;
  if (!expectedError) {
    // // TODO: logger.log(error)
    //toast.error(
    //  "something terrible has gone wrong, oh no! It's not your fault!"
    //);
  }
  return Promise.reject(error);
});

const http = {
  get: axios.get,
  post: axios.post,
  put: axios.put,
  delete: axios.delete,
};

export default http;
