const express = require("express");
const router = express.Router();
const imwebApi = require("../services/imwebApi");

router.get("/", async (req, res) => {
  try {
    const stats = await imwebApi.getDashboardStats();
    console.log('라우터에서 받은 통계 데이터:', stats);
    
    res.render("dashboard", { 
      stats,
      error: null
    });
  } catch (error) {
    console.error("대시보드 데이터 조회 에러:", error);
    res.render("dashboard", {
      error: "데이터를 불러오는 중 오류가 발생했습니다.",
      stats: {
        members: { total: 0, newToday: 0, activeToday: 0 },
        products: { total: 0, totalStock: 0, avgPrice: 0 },
        sales: { total: 0, labels: [], data: [] },
        recentOrders: []
      }
    });
  }
});

module.exports = router;
