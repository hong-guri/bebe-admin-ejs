const express = require("express");
const router = express.Router();
const imwebApi = require("../services/imwebApi");

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const response = await imwebApi.getOrders({ page });

    res.render("orders/index", {
      orders: response.data.list,
      pagination: response.data.pagenation,
    });
  } catch (error) {
    console.error("주문 목록 조회 실패:", error);
    res.render("orders/index", {
      orders: [],
      error: "주문 목록을 불러오는데 실패했습니다.",
    });
  }
});

module.exports = router;
