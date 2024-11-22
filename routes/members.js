const express = require("express");
const router = express.Router();
const axios = require("axios");

const IMWEB_API_URL = "https://api.imweb.me/v2";

// 회원 목록 조회
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      orderBy = "jointime",
      join_time_start,
      join_time_end,
      last_login_time_start,
      last_login_time_end,
    } = req.query;

    // 세션에서 토큰 가져오기
    const accessToken = req.session.accessToken;
    if (!accessToken) {
      throw new Error("인증 토큰이 없습니다.");
    }

    // API 요청 헤라미터 구성
    const params = {
      orderBy,
    };

    // 선택적 파라미터 추가
    if (join_time_start)
      params.join_time_start = Math.floor(
        new Date(join_time_start).getTime() / 1000
      );
    if (join_time_end)
      params.join_time_end = Math.floor(
        new Date(join_time_end).getTime() / 1000
      );
    if (last_login_time_start)
      params.last_login_time_start = Math.floor(
        new Date(last_login_time_start).getTime() / 1000
      );
    if (last_login_time_end)
      params.last_login_time_end = Math.floor(
        new Date(last_login_time_end).getTime() / 1000
      );

    // API 요청 헤더 설정
    const headers = {
      "Content-Type": "application/json",
      "access-token": accessToken,
    };

    console.log("API 요청 정보:", {
      url: `${IMWEB_API_URL}/member/members`,
      params,
      headers,
    });

    const response = await axios.get(`${IMWEB_API_URL}/member/members`, {
      params,
      headers,
    });

    console.log("API 응답:", response.data);

    res.render("members/index", {
      members: response.data.data.list || [],
      pagination: response.data.data.pagenation,
      query: req.query,
    });
  } catch (error) {
    console.error(
      "회원 목록 조회 에러:",
      error.response?.data || error.message
    );
    res.render("members/index", {
      members: [],
      error:
        "회원 목록을 불러오는데 실패했습니다. " +
        (error.response?.data?.msg || error.message),
      query: req.query,
    });
  }
});

// 회원 상세 정보 조회
router.get("/:memberCode", async (req, res) => {
  try {
    const { memberCode } = req.params;
    const accessToken = req.session.accessToken;

    if (!accessToken) {
      throw new Error("인증 토큰이 없습니다.");
    }

    const headers = {
      "Content-Type": "application/json",
      "access-token": accessToken,
    };

    console.log("상세 정보 요청:", {
      url: `${IMWEB_API_URL}/member/members/${memberCode}`,
      headers,
    });

    const response = await axios.get(
      `${IMWEB_API_URL}/member/members/${memberCode}`,
      { headers }
    );

    console.log("상세 정보 응답:", response.data);

    if (response.data.code === 200) {
      res.render("members/detail", {
        member: response.data.data,
        error: null,
      });
    } else {
      throw new Error(response.data.msg || "회원 정보 조회 실패");
    }
  } catch (error) {
    console.error(
      "회원 상세 정보 조회 에러:",
      error.response?.data || error.message
    );
    res.render("members/detail", {
      member: null,
      error: "회원 상세 정보를 불러오는데 실패했습니다. " +
        (error.response?.data?.msg || error.message),
    });
  }
});

// 엑셀 다운로드
router.get("/export", async (req, res) => {
  try {
    const accessToken = req.session.accessToken;
    if (!accessToken) {
      throw new Error("인증 토큰이 없습니다.");
    }

    // API 요청 헤더 설정
    const headers = {
      "Content-Type": "application/json",
      "access-token": accessToken,
    };

    // 전체 회원 목록 조회
    const response = await axios.get(`${IMWEB_API_URL}/member/members`, {
      headers,
    });
    const members = response.data.data.list;

    // 엑셀 워크북 생성
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("회원목록");

    // 헤더 설정
    worksheet.columns = [
      { header: "회원코드", key: "member_code", width: 20 },
      { header: "아이디", key: "uid", width: 20 },
      { header: "이름", key: "name", width: 15 },
      { header: "이메일", key: "email", width: 25 },
      { header: "연락처", key: "callnum", width: 15 },
      { header: "가입일시", key: "join_time", width: 20 },
      { header: "최근로그인", key: "last_login_time", width: 20 },
      { header: "포인트", key: "point_amount", width: 10 },
      { header: "SMS동의", key: "marketing_agree_sms", width: 10 },
      { header: "이메일동의", key: "marketing_agree_email", width: 10 },
    ];

    // 데이터 추가
    members.forEach((member) => {
      worksheet.addRow({
        member_code: member.member_code,
        uid: member.uid,
        name: member.name,
        email: member.email,
        callnum: member.callnum,
        join_time: member.join_time,
        last_login_time: member.last_login_time,
        point_amount: member.point_amount,
        marketing_agree_sms: member.marketing_agree_sms,
        marketing_agree_email: member.marketing_agree_email,
      });
    });

    // 스타일 설정
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2F0D9" },
    };

    // 파일 다운로드
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=members.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("엑셀 다운로드 에러:", error.response?.data || error.message);
    res.status(500).send("엑셀 파일 생성 중 오류가 발생했습니다.");
  }
});

// 회원 검색
router.get("/search", async (req, res) => {
  try {
    const { keyword } = req.query;
    const accessToken = req.session.accessToken;

    if (!accessToken) {
      throw new Error("인증 토큰이 없습니다.");
    }

    const headers = {
      "Content-Type": "application/json",
      "access-token": accessToken,
    };

    // 검색 API 호출
    const response = await axios.get(`${IMWEB_API_URL}/member/members`, {
      headers,
      params: {
        search: keyword,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("회원 검색 에러:", error.response?.data || error.message);
    res.status(500).json({
      error: "회원 검색 중 오류가 발생했습니다.",
    });
  }
});

// 회원 통계
router.get("/stats", async (req, res) => {
  try {
    const accessToken = req.session.accessToken;
    if (!accessToken) {
      throw new Error("인증 토큰이 없습니다.");
    }

    const headers = {
      "Content-Type": "application/json",
      "access-token": accessToken,
    };

    // 전체 회원 목록 조회
    const response = await axios.get(`${IMWEB_API_URL}/member/members`, {
      headers,
    });
    const members = response.data.data.list;

    // 통계 계산
    const stats = {
      totalMembers: members.length,
      newMembersToday: members.filter((m) => {
        const joinDate = new Date(m.join_time);
        const today = new Date();
        return joinDate.toDateString() === today.toDateString();
      }).length,
      activeMembers: members.filter((m) => {
        const lastLogin = new Date(m.last_login_time);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return lastLogin > thirtyDaysAgo;
      }).length,
      marketingAgreeSMS: members.filter((m) => m.marketing_agree_sms === "Y")
        .length,
      marketingAgreeEmail: members.filter(
        (m) => m.marketing_agree_email === "Y"
      ).length,
    };

    res.render("members/stats", { stats });
  } catch (error) {
    console.error(
      "회원 통계 조회 에러:",
      error.response?.data || error.message
    );
    res.render("members/stats", {
      error: "회원 통계를 불러오는데 실패했습니다.",
    });
  }
});

module.exports = router;
