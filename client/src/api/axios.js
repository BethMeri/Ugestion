import axios from 'axios';

const api = axios.create({
    baseURL: 'https://ugestion-backend.onrender.com/api' 
});

export default api;