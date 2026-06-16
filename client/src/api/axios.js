import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000' // Aquí apunta a tu backend que ya está corriendo
});

export default api;