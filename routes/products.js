const express = require("express");
const router = express.Router();
const axios = require("axios");

const IMWEB_API_URL = "https://api.imweb.me/v2";

// 상품 목록 조회
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      category,
      prod_status = "sale",
      orderby = "recent",
    } = req.query;

    const accessToken = req.session.accessToken;
    if (!accessToken) {
      throw new Error("인증 토큰이 없습니다.");
    }

    const headers = {
      "Content-Type": "application/json",
      "access-token": accessToken,
    };

    const params = {
      page,
      prod_status,
      orderby,
    };

    if (category) params.category = category;

    const response = await axios.get(`${IMWEB_API_URL}/shop/products`, {
      params,
      headers,
    });

    console.log(JSON.stringify(response.data.data, null, 2));
    // 이미지 URL 변환
    const products = response.data.data.list.map((product) => {
      if (product.images && product.images.length > 0) {
        const imageUrls = product.images.map((imageId) => {
          const imagePath = product.image_url[imageId];
          return `https://cdn-optimized.imweb.me/upload/${imagePath}`;
        });
        return { ...product, imageUrls };
      }
      return product;
    });

    res.render("products/index", {
      products: products || [],
      pagination: response.data.data.pagenation,
      query: req.query,
    });
  } catch (error) {
    console.error(
      "상품 목록 조회 에러:",
      error.response?.data || error.message
    );
    res.render("products/index", {
      products: [],
      error: "상품 목록을 불러오는데 실패했습니다.",
      query: req.query,
    });
  }
});

// 상품 상세 정보 조회
router.get("/:productNo", async (req, res) => {
  try {
    const { productNo } = req.params;
    const accessToken = req.session.accessToken;

    if (!accessToken) {
      throw new Error("인증 토큰이 없습니다.");
    }

    const headers = {
      "Content-Type": "application/json",
      "access-token": accessToken,
    };

    const response = await axios.get(
      `${IMWEB_API_URL}/shop/products/${productNo}`,
      { headers }
    );

    const product = response.data.data;
    
    // 이미지 URL 변환
    if (product.images && product.images.length > 0) {
      product.imageUrls = product.images.map((imageId) => {
        const imagePath = product.image_url[imageId];
        return `https://cdn-optimized.imweb.me/upload/${imagePath}`;
      });
    }

    res.render("products/detail", {
      product,
      error: null,
    });
  } catch (error) {
    console.error(
      "상품 상세 정보 조회 에러:",
      error.response?.data || error.message
    );
    res.render("products/detail", {
      product: null,
      error: "상품 상세 정보를 불러오는데 실패했습니다.",
    });
  }
});

module.exports = router;
