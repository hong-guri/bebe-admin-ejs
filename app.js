const express = require("express");
const path = require("path");
const session = require("express-session");
const expressLayouts = require("express-ejs-layouts");
require("dotenv").config();

const app = express();

// 뷰 엔진 설정
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layouts/main");
app.use(expressLayouts);

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// 세션 설정
app.use(
  session({
    secret: process.env.SESSION_SECRET || "bebeterafit-secret",
    resave: false,
    saveUninitialized: false,
  })
);

const authRouter = require("./routes/auth");
app.use("/auth", authRouter);

// 인증 미들웨어
const authMiddleware = (req, res, next) => {
  if (req.session.isLoggedIn) {
    next();
  } else {
    res.redirect("/auth/login");
  }
};

// 라우터 설정
const dashboardRouter = require("./routes/dashboard");
const membersRouter = require("./routes/members");

// 인증이 필요한 라우트에 미들웨어 적용
app.use("/", authMiddleware, dashboardRouter);
app.use("/members", authMiddleware, membersRouter);

const productsRouter = require("./routes/products");
app.use("/products", authMiddleware, productsRouter);

const ordersRouter = require("./routes/orders");
app.use("/orders", authMiddleware, ordersRouter);

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행중입니다.`);
});
