import axios from 'axios';
// const API_BASE_URL=`https://ramanasoftwebsite-production.up.railway.app`
const API_BASE_URL=`http://localhost:5000`

const apiService = {
  post: (endpoint, data, config = {}) => {
    return axios.post(`${API_BASE_URL}${endpoint}`, data, config);
  },
  get: (endpoint, config = {}) => {
    return axios.get(`${API_BASE_URL}${endpoint}`, config);
  },
  put: (endpoint, data, config = {}) => {
    return axios.put(`${API_BASE_URL}${endpoint}`, data, config);
  },
  delete: (endpoint, config = {}) => {
    return axios.delete(`${API_BASE_URL}${endpoint}`, config);
  },

  getWithResponseType: (endpoint, responseType = 'json', config = {}) => {
    return axios.get(`${API_BASE_URL}${endpoint}`, {
      ...config,
      responseType,
    });
}
}

export default apiService;
