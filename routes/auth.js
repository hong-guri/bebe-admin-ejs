const express = require("express");
const router = express.Router();
const { getAccessToken } = require("../config/imweb");

// 관리자 계정 정보
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin0407##",
};

router.get("/login", (req, res) => {
  res.render("auth/login", {
    layout: false,
    error: req.session.loginError,
  });
  req.session.loginError = null;
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // 관리자 계정 확인
    if (
      username === ADMIN_CREDENTIALS.username &&
      password === ADMIN_CREDENTIALS.password
    ) {
      // 토큰 발급 테스트
      const token = await getAccessToken();
      console.log(token);

      // 세션에 토큰 저장
      req.session.accessToken = token;
      req.session.isLoggedIn = true;

      res.redirect("/");
    } else {
      req.session.loginError = "아이디 또는 비밀번호가 올바르지 않습니다.";
      res.redirect("/auth/login");
    }
  } catch (error) {
    req.session.loginError = "로그인 처리 중 오류가 발생했습니다.";
    res.redirect("/auth/login");
  }
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('로그아웃 중 오류 발생:', err);
            return res.redirect('/dashboard');
        }
        res.clearCookie('connect.sid'); // 세션 쿠키 삭제
        res.redirect('/auth/login');
    });
});

module.exports = router;
