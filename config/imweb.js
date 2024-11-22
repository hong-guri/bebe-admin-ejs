const axios = require('axios');

const IMWEB_API_BASE_URL = 'https://api.imweb.me/v2';

// API 토큰 발급 함수
async function getAccessToken() {
    try {
        const response = await axios.get(`${IMWEB_API_BASE_URL}/auth`, {
            params: {
                key: process.env.IMWEB_API_KEY,
                secret: process.env.IMWEB_SECRET_KEY
            }
        });

        if (response.data.code === 200) {
            return response.data.access_token;
        } else {
            throw new Error('토큰 발급 실패');
        }
    } catch (error) {
        console.error('아임웹 토큰 발급 에러:', error.message);
        throw error;
    }
}

// API 요청을 위한 axios 인스턴스 생성
const imwebAPI = axios.create({
    baseURL: IMWEB_API_BASE_URL,
    timeout: 10000
});

// 요청 인터셉터 설정
imwebAPI.interceptors.request.use(async (config) => {
    // 토큰이 없으면 새로 발급
    const token = await getAccessToken();
    config.headers['Authorization'] = `Bearer ${token}`;
    return config;
});

module.exports = {
    getAccessToken,
    imwebAPI
}; 