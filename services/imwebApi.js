const axios = require("axios");

class ImwebApiService {
  constructor() {
    this.baseURL = "https://api.imweb.me/v2";
    this.token = null;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5분
  }

  getCacheKey(endpoint, params) {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  async initialize() {
    try {
      const response = await axios.get(`${this.baseURL}/auth`, {
        params: {
          key: process.env.IMWEB_API_KEY,
          secret: process.env.IMWEB_SECRET_KEY,
        },
      });
      this.token = response.data.access_token;
    } catch (error) {
      console.error("API 토큰 발급 실패:", error);
      throw error;
    }
  }

  async getDashboardStats() {
    try {
      if (!this.token) await this.initialize();

      // API 호출 시 간격 추가
      const membersRes = await this.getMembersList();
      console.log('회원 데이터 응답:', membersRes);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const ordersRes = await this.getOrders();
      console.log('주문 데이터 응답:', ordersRes);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const productsRes = await this.getProducts();
      console.log('상품 데이터 응답:', productsRes);

      // 각 API 응답 개별 처리
      const members = membersRes?.data?.list || [];
      const orders = ordersRes?.data?.list || [];
      const products = productsRes?.data?.list || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 최근 7일간의 매출 데이터 계산
      const last7Days = [...Array(7)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const salesByDay = orders.reduce((acc, order) => {
        if (!order.order_time) return acc;
        const date = new Date(order.order_time * 1000).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + (order.payment?.payment_amount || 0);
        return acc;
      }, {});

      const stats = {
        members: {
          total: members.length,
          newToday: members.filter(m => {
            const joinTime = m.join_time ? new Date(m.join_time * 1000) : null;
            return joinTime && joinTime >= today;
          }).length,
          activeToday: members.filter(m => {
            const lastLoginTime = m.last_login_time ? new Date(m.last_login_time * 1000) : null;
            return lastLoginTime && lastLoginTime >= today;
          }).length
        },
        products: {
          total: products.length,
          totalStock: products.reduce((acc, p) => acc + (p.stock?.stock_no_option || 0), 0),
          avgPrice: products.length ? Math.round(products.reduce((acc, p) => acc + (p.price || 0), 0) / products.length) : 0
        },
        sales: {
          total: orders.reduce((acc, o) => acc + (o.payment?.payment_amount || 0), 0),
          labels: last7Days,
          data: last7Days.map(date => salesByDay[date] || 0)
        },
        recentOrders: orders.slice(0, 5).map(order => ({
          order_no: order.order_no || '',
          orderer_name: order.orderer?.name || '알 수 없음',
          order_time: order.order_time ? new Date(order.order_time * 1000).toLocaleString() : '-',
          product_name: order.items?.[0]?.product_name || '알 수 없음',
          payment_amount: order.payment?.payment_amount || 0,
          status: order.status || '알 수 없음'
        }))
      };

      console.log('생성된 통계 데이터:', stats);
      return stats;

    } catch (error) {
      console.error("대시보드 통계 조회 실패:", error);
      return {
        members: { total: 0, newToday: 0, activeToday: 0 },
        products: { total: 0, totalStock: 0, avgPrice: 0 },
        sales: { total: 0, labels: [], data: [] },
        recentOrders: []
      };
    }
  }

  async getRecentOrders() {
    try {
      if (!this.token) await this.initialize();
      
      const response = await this.getOrders({ limit: 5 });
      if (!response?.data?.data?.list) {
        return [];
      }

      const orders = response.data.data.list;
      return orders.map((order) => ({
        order_no: order.order_no || '',
        order_time: order.order_time ? new Date(order.order_time * 1000).toLocaleString() : '-',
        orderer_name: order.orderer?.name || '알 수 없음',
        product_name: order.items?.[0]?.product_name || '알 수 없음',
        payment_amount: order.payment?.payment_amount || 0,
        status: order.status || '알 수 없음'
      }));
    } catch (error) {
      console.error("최근 주문 조회 실패:", error);
      return [];
    }
  }

  async getMembersList(params = {}) {
    if (!this.token) await this.initialize();
    return this.request("GET", "/member/members", params);
  }

  async getOrders(params = {}) {
    if (!this.token) await this.initialize();
    return this.request("GET", "/shop/orders", params);
  }

  async getProducts(params = {}) {
    if (!this.token) await this.initialize();
    return this.request("GET", "/shop/products", params);
  }

  async request(method, endpoint, params = {}) {
    if (!this.token) await this.initialize();

    const cacheKey = this.getCacheKey(endpoint, params);
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios({
        method,
        url: `${this.baseURL}${endpoint}`,
        params,
        headers: {
          "Content-Type": "application/json",
          "access-token": this.token,
        },
      });

      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(
        `API 요청 실패 (${endpoint}):`,
        error.response?.data || error.message
      );
      throw error;
    }
  }
}

module.exports = new ImwebApiService();
