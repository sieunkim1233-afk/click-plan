/*
 * 서버가 아는 의뢰 목록 (AI 지시문에 들어가는 단어)
 * ------------------------------------------------------------
 * 브라우저는 의뢰 id만 보내고, 실제 단어는 여기서 꺼내 써요.
 * 그래서 누가 임의의 문구를 보내도 AI 지시문이 바뀌지 않아요.
 * data.js의 scenarios에 의뢰를 추가하면 같은 id로 여기에도 추가해 주세요.
 */
const SCENARIOS = {
  festival: {
    appName: '대학생용 축제 앱', item: '공연', itemSubj: '공연이', nowObj: '지금 하는 공연을',
    cta: '오늘의 공연 보기', card: '공연 카드', place: '부스', placeObj: '부스를', pin: '부스 표시(핀)',
    infoItems: '대표 메뉴', emptyDay: '3일차', emptyNote: '3일차에는 공연 대신 플리마켓이 열려요', firstDay: '1일차',
  },
  tour: {
    appName: '신입생 캠퍼스 투어 앱', item: '투어', itemSubj: '투어가', nowObj: '지금 진행 중인 투어를',
    cta: '오늘의 투어 보기', card: '투어 카드', place: '건물', placeObj: '건물을', pin: '건물 표시(핀)',
    infoItems: '안내 내용', emptyDay: '3일차', emptyNote: '3일차에는 투어 대신 자유 관람만 열려요', firstDay: '1일차',
  },
  cafeteria: {
    appName: '학생식당 메뉴 앱', item: '메뉴', itemSubj: '메뉴가', nowObj: '지금 배식 중인 메뉴를',
    cta: '오늘의 메뉴 보기', card: '메뉴 카드', place: '식당', placeObj: '식당을', pin: '식당 표시(핀)',
    infoItems: '대표 메뉴', emptyDay: '토요일', emptyNote: '토요일에는 학생식당이 쉬어요', firstDay: '월요일',
  },
  studyroom: {
    appName: '도서관 스터디룸 앱', item: '예약 시간', itemSubj: '예약 시간이', nowObj: '지금 바로 쓸 수 있는 방을',
    cta: '지금 빈 방 보기', card: '시간 카드', place: '스터디룸', placeObj: '스터디룸을', pin: '스터디룸 표시(핀)',
    infoItems: '시설 정보', emptyDay: '일요일', emptyNote: '일요일에는 도서관이 문을 닫아요', firstDay: '오늘',
  },
};

// 모르는 id가 오면 축제 의뢰로
function scenarioWords(id) {
  return Object.prototype.hasOwnProperty.call(SCENARIOS, id) ? { id, ...SCENARIOS[id] } : { id: 'festival', ...SCENARIOS.festival };
}

module.exports = { scenarioWords };
