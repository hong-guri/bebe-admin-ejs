# 아임웹 API 문서

## 인증

### 토큰 발급

액세스 토큰을 발급받아 API 요청 시 사용합니다.

**요청**

GET https://api.imweb.me/v2/auth

**파라미터**
| 항목 | 타입 | 필수 | 설명 |
|------|------|------|------|
| key | string | O | API Key |
| secret | string | O | Secret Key |

**응답**
```json
{
    "msg": "SUCCESS",
    "code": 200,
    "http_code": 200,
    "access_token": "발급된_토큰"
}
```

**응답 항목**
| 항목 | 타입 | 설명 |
|------|------|------|
| msg | string | 응답 메시지 |
| code | integer | 응답 코드 |
| http_code | integer | HTTP 상태 코드 |
| access_token | string | 발급된 액세스 토큰 |

**호출 예시**
```bash
# cURL
curl -X GET "https://api.imweb.me/v2/auth?key={API_KEY}&secret={SECRET_KEY}"

# JavaScript
const response = await axios.get('https://api.imweb.me/v2/auth', {
    params: {
        key: 'API_KEY',
        secret: 'SECRET_KEY'
    }
});
```

## API 공통 사항

### 요청 헤더
모든 API 요청 시 다음 헤더를 포함해야 합니다:

```
Content-Type: application/json
access-token: {발급받은_액세스_토큰}
```

### 응답 데이터 구조
```json
{
    "msg": "SUCCESS",
    "code": 200,
    "request_count": 0,
    "version": "2.0",
    "data": {
        // API별 응답 데이터
    }
}
```

**공통 응답 항목**
| 항목 | 타입 | 설명 |
|------|------|------|
| msg | string | API 응답 메시지 |
| code | integer | API 응답 코드 |
| request_count | integer | API 요청 가능 횟수 |
| version | string | API 버전 |
| data | object | API 응답 데이터 |

### 페이지네이션
목록 조회 API의 경우 다음과 같은 페이지네이션 데이터가 포함됩니다:

```json
{
    "data": {
        "list": [],
        "pagenation": {
            "data_count": "총_데이터_수",
            "current_page": 현재_페이지,
            "total_page": 총_페이지_수,
            "pagesize": 페이지당_데이터_수
        }
    }
}
```

### 에러 코드
| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| -5 | 액세스 토큰 또는 API 키 오류 |
| -99 | 메소드 오류 |

## 상품 API

### 상품 등록/수정

**상품 등록**
POST https://api.imweb.me/v2/shop/products

**상품 수정**
PATCH https://api.imweb.me/v2/shop/products/{상품번호}

**요청 데이터**
| 항목 | 타입 | 필수 | 설명 |
|------|------|------|------|
| categories | Array | O | 상품 카테고리 코드 목록 |
| name | String | O | 상품명 |
| price | Float | O | 상품가격 |
| images | Array | O | 상품 이미지 URL 목록 |
| content | String | O | 상세설명 |
| prod_status | String | O | 상태 (sale: 판매중, soldout: 품절, nosale: 숨김) |
| simple_content | String | X | 요약설명 |
| use_mobile_prod_content | Boolean | X | 모바일 상세설명 사용여부 |
| mobile_content | String | X | 모바일 상세설명 |
| prod_type | String | X | 판매방식 (normal: 일반, digital: 디지털, subscribe: 회원그룹) |
| origin | String | X | 원산지 |
| maker | String | X | 제조사 |
| brand | String | X | 브랜드 |
| price_org | Float | X | 할인 이전 가격 |
| price_tax | Boolean | X | 세금 포함 여부 |
| price_none | Boolean | X | 가격 없음 여부 |
| stock_use | Boolean | X | 재고관리 사용여부 |
| stock_unlimit | Boolean | X | 재고 소진후에도 주문 가능 여부 |
| stock_no_option | Integer | X | 본 상품 재고 |

**옵션 데이터 예시**
```json
{
    "options": {
        "is_mix": false,
        "list": [
            {
                "is_require": true,
                "type": "default",
                "name": "사이즈",
                "values": ["S", "M", "L"]
            },
            {
                "is_require": true,
                "type": "color",
                "name": "색상",
                "values": [
                    {
                        "name": "블랙",
                        "data": {
                            "color": "#000000",
                            "image_url": ""
                        }
                    }
                ]
            }
        ]
    }
}
```

**응답**
```json
{
    "msg": "SUCCESS",
    "code": 200,
    "data": {
        "product_no": "12345"
    }
}
```

### 상품 조회

**단일 상품 조회**
GET https://api.imweb.me/v2/shop/products/{상품번호}

**상품 목록 조회**
GET https://api.imweb.me/v2/shop/products

**요청 파라미터**
| 항목 | 타입 | 설명 |
|------|------|------|
| category | String | 상품 카테고리 코드 |
| prod_status | String | 상품 상태 (sale/soldout/nosale) |
| orderby | String | 정렬 기준 |
| page | Integer | 페이지 번호 |
| limit | Integer | 페이지당 개수 |

**응답 데이터**
| 항목 | 타입 | 설명 |
|------|------|------|
| no | Integer | 상품번호 |
| name | String | 상품명 |
| price | Float | 판매가격 |
| price_org | Float | 정가 |
| images | Array | 이미지 URL 목록 |
| content | String | 상세설명 |
| prod_status | String | 상품상태 |
| stock | Object | 재고정보 |

주요 기능:
1. 상품 등록/수정 API
2. 상품 조회 API (단일/목록)
3. 옵션 설정
4. 재고 관리
5. 가격/할인 설정

