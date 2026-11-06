/*
 * 눌러보는 기획서 — 예시 데이터 모음
 * ------------------------------------------------------------
 * 화면에 나오는 모든 대사, 질문, 선택지, 의뢰별 앱 내용이 이 파일 한 곳에 있습니다.
 *
 * 주의: API 키나 비밀번호는 절대 이 파일(또는 어떤 브라우저 코드)에도 넣지 마세요.
 *    브라우저 코드는 누구나 볼 수 있으므로, 키는 서버에만 보관해야 합니다.
 *
 * 자리표시
 *  - {s1} {s2} {s3}: 학생이 정한 1·2·3번 화면 이름
 *  - {item} {cta} {place} 같은 나머지: 고른 의뢰의 words 값 (아래 scenarios 참고)
 *
 * 의뢰를 추가하려면 scenarios에 하나를 더 넣고,
 * 같은 id와 단어를 api/_scenarios.js 에도 넣어 주세요(서버의 AI 지시문에 쓰여요).
 */
window.PLAN_DATA = {
  /* 시작 화면 (첫 화면 스크롤 모션은 축제 예시로 고정) */
  service: {
    name: '눌러보는 기획서',
    tagline: '글로 쓴 기획이 앱이 되면, 빈틈이 보여요.',
    intro: 'AI 클라이언트의 의뢰부터 AI 팀 회의까지, 기획자의 첫 프로젝트를 해 봐요.',
    // 첫 화면 스크롤 모션: 이 문장이 한 글자씩 써지고, k 표시가 있는 단어가 조각이 되어 앱 화면으로 조립돼요
    story: {
      sentence: [
        { t: '홈에서 ' },
        { t: "'오늘의 공연 보기' 버튼", k: 'btn' },
        { t: '을 누르면 ' },
        { t: '공연 일정', k: 'list' },
        { t: ' 화면으로 ' },
        { t: '이동', k: 'nav' },
        { t: '한다.' },
      ],
      scenes: [
        { title: '기획서에 한 문장을 쓰면', desc: '버튼을 누르면 무슨 일이 일어나는지 글로 적어요.' },
        { title: '핵심 단어가 조각이 되어', desc: '버튼, 화면, 이동이 문장에서 떨어져 나와요.' },
        { title: '앱 화면으로 조립돼요', desc: '조각이 버튼과 카드가 되어 화면이 완성돼요.' },
        { title: '빈틈이 드러나면', desc: 'AI 디자이너와 개발자가 바로 질문해요.' },
        { title: '답을 반영하면', desc: '앱이 더 나은 버전으로 바뀌어요.' },
      ],
      bubbles: [
        { by: 'developer', for: 'btn', text: '이 버튼을 누르면 어디로 가나요?' },
        { by: 'designer', for: 'empty', text: '공연이 없는 날엔 이 칸에 뭐가 보이나요?' },
      ],
      final: { title: '내가 쓴 기획이 앱이 되는 순간', desc: 'AI 팀원과 함께 첫 기획을 시작해 보세요.', button: '체험 시작하기' },
    },
    steps: [
      { title: '의뢰 받기', desc: 'AI 클라이언트가 만들고 싶은 앱을 알려 줘요.' },
      { title: '기획서 쓰기', desc: '목적, 사용자, 화면, 버튼 동작을 정리해요.' },
      { title: '눌러 보기', desc: '내 기획서가 휴대폰 속 앱이 돼요.' },
      { title: '팀 회의', desc: 'AI 팀원이 기획의 빈틈을 질문해요.' },
      { title: '고치기', desc: '답을 정하면 앱이 바로 바뀌어요.' },
    ],
    meta: ['약 15분', '회원가입 없음', '정답 없음'],
  },

  /* 등장인물 (클라이언트는 고른 의뢰에 따라 바뀌어요) */
  team: {
    client: { name: '축제준비위원회', role: 'AI 클라이언트', avatar: '축', color: '#1e2a4a' },
    designer: { name: '모아', role: 'AI 디자이너', avatar: '모', color: '#1e2a4a' },
    developer: { name: '코디', role: 'AI 개발자', avatar: '코', color: '#1e2a4a' },
  },

  /* =========================================================
   * 의뢰 목록 — 의뢰 화면에서 학생이 하나를 골라요
   * 모두 '홈 · 목록(날짜 탭) · 지도' 3화면 구조이고, 3번째 날짜 탭(d3)은 비어 있어요.
   * ========================================================= */
  scenarios: [
    {
      id: 'festival',
      summary: '공연 일정과 부스 위치를 쉽게!',
      client: { name: '축제준비위원회', avatar: '축' },
      words: {
        appName: '대학생용 축제 앱', appShort: '축제 앱',
        item: '공연', itemSubj: '공연이', now: '지금 하는 공연', nowObj: '지금 하는 공연을', live: '공연 중',
        cta: '오늘의 공연 보기', card: '공연 카드',
        place: '부스', placeObj: '부스를', pin: '부스 표시(핀)', pinHint: '부스 표시를 눌러 보세요', detail: '부스 정보', infoItems: '대표 메뉴',
        emptyDay: '3일차', emptyNote: '3일차에는 공연 대신 플리마켓이 열려요', firstDay: '1일차',
        persona: '축제에 처음 온 1학년', emptyCase: '오늘 공연 없음', targetHint: '축제에 처음 와 보는 1학년',
        names: '홈·공연 일정·부스 지도',
      },
      request: {
        messages: [
          { text: '안녕하세요, 기획자님! 저희는 한빛대학교 축제준비위원회예요.' },
          { text: '대학생용 축제 앱을 기획해 주세요.', strong: true },
          { text: '작년 축제 때 "공연 언제 해요?", "그 부스 어디예요?"라는 질문을 수백 번 받았어요. 학생들이 휴대폰으로 바로 찾아볼 수 있으면 좋겠어요.' },
          { text: '처음이니까 욕심내지 말고, 화면 3개짜리 앱으로 시작해 봐요. 잘 부탁드려요!' },
        ],
        brief: [
          ['의뢰인', '한빛대학교 축제준비위원회'],
          ['만들 것', '대학생용 축제 앱 (화면 3개)'],
          ['축제 기간', '11월 12일(목) ~ 14일(토), 3일간'],
          ['꼭 들어갈 것', '공연 일정, 부스 위치'],
          ['지금의 불편', '"공연 언제 해요?", "부스 어디예요?" 같은 질문이 너무 많음'],
        ],
      },
      form: {
        purpose: '축제에 온 대학생이 공연 시간과 부스 위치를 빠르게 찾을 수 있게 한다.',
        target: '학교 축제에 처음 와 보는 1학년, 친구와 공연을 보러 온 재학생',
        screens: [
          { defaultName: '홈', example: '축제 소개와 오늘의 공연 바로가기' },
          { defaultName: '공연 일정', example: '날짜별 공연 시간표' },
          { defaultName: '부스 지도', example: '학과·동아리 부스 위치' },
        ],
        actions: ['오늘의 공연을 보여 준다.', '공연 정보를 볼 수 있다.', '부스 정보가 나온다.'],
      },
      app: {
        name: '한빛대 가을 축제',
        title: '청춘 페스타 2026',
        period: '11.12(목) – 11.14(토)',
        place: '대운동장 · 학생회관 일대',
        todayDayId: 'd1',
        nowPlayingId: 'p2',
        notices: ['비가 오면 공연은 학생회관 대강당에서 열려요.', '쓰레기는 분리수거 부스에 버려 주세요.'],
        days: [
          {
            id: 'd1', label: '1일차', date: '11.12 목',
            performances: [
              { id: 'p1', time: '17:00', title: '밴드 동아리 「소음주의보」', stage: '대운동장 무대' },
              { id: 'p2', time: '18:00', title: '댄스 동아리 「무브」', stage: '대운동장 무대' },
              { id: 'p3', time: '19:30', title: '초청 가수 공연', stage: '대운동장 무대' },
            ],
          },
          {
            id: 'd2', label: '2일차', date: '11.13 금',
            performances: [
              { id: 'p4', time: '16:00', title: '아카펠라 「하모니」', stage: '학생회관 앞' },
              { id: 'p5', time: '18:00', title: '한빛 가요제 결선', stage: '대운동장 무대' },
              { id: 'p6', time: '20:00', title: 'DJ 파티', stage: '대운동장 무대' },
            ],
          },
          { id: 'd3', label: '3일차', date: '11.14 토', note: '3일차에는 공연 대신 플리마켓이 열려요.', performances: [] },
        ],
        zones: [
          { name: '대운동장', x: 4, y: 6, w: 56, h: 46 },
          { name: '학생회관', x: 64, y: 6, w: 32, h: 40 },
          { name: '본관', x: 4, y: 60, w: 40, h: 34 },
          { name: '중앙 광장', x: 50, y: 56, w: 46, h: 38 },
        ],
        booths: [
          { id: 'b1', name: 'IT콘텐츠과 게임 체험존', category: '체험', x: 22, y: 30, place: '대운동장 왼쪽', hours: '12:00 – 20:00', items: ['학생 제작 게임', '리듬 게임 대회'] },
          { id: 'b2', name: '푸드트럭 존', category: '먹거리', x: 46, y: 36, place: '대운동장 오른쪽', hours: '15:00 – 22:00', items: ['떡볶이', '닭꼬치', '추로스'] },
          { id: 'b3', name: '사진 동아리 포토부스', category: '체험', x: 80, y: 24, place: '학생회관 1층 입구', hours: '11:00 – 19:00', items: ['네 컷 사진', '즉석 인화'] },
          { id: 'b4', name: '경영학과 카페', category: '먹거리', x: 24, y: 80, place: '본관 앞 잔디', hours: '10:00 – 18:00', items: ['아이스티', '쿠키'] },
          { id: 'b5', name: '만화 동아리 굿즈샵', category: '판매', x: 64, y: 72, place: '중앙 광장 분수 옆', hours: '12:00 – 19:00', items: ['스티커', '엽서', '키링'] },
          { id: 'b6', name: '총학생회 안내 부스', category: '안내', x: 86, y: 84, place: '중앙 광장 정문 쪽', hours: '10:00 – 22:00', items: ['분실물 접수', '축제 안내'] },
        ],
      },
    },

    {
      id: 'tour',
      summary: '투어 일정과 건물 위치를 쉽게!',
      client: { name: '입학처 학생홍보대사단', avatar: '홍' },
      words: {
        appName: '신입생 캠퍼스 투어 앱', appShort: '투어 앱',
        item: '투어', itemSubj: '투어가', now: '지금 진행 중인 투어', nowObj: '지금 진행 중인 투어를', live: '진행 중',
        cta: '오늘의 투어 보기', card: '투어 카드',
        place: '건물', placeObj: '건물을', pin: '건물 표시(핀)', pinHint: '건물 표시를 눌러 보세요', detail: '건물 정보', infoItems: '안내 내용',
        emptyDay: '3일차', emptyNote: '3일차에는 투어 대신 자유 관람만 열려요', firstDay: '1일차',
        persona: '캠퍼스가 처음인 신입생', emptyCase: '투어가 없는 날', targetHint: '캠퍼스가 처음인 신입생',
        names: '홈·투어 일정·건물 지도',
      },
      request: {
        messages: [
          { text: '안녕하세요, 기획자님! 저희는 한빛대학교 입학처 학생홍보대사단이에요.' },
          { text: '신입생용 캠퍼스 투어 앱을 기획해 주세요.', strong: true },
          { text: '매년 2월 새내기 투어 때 "투어 몇 시에 출발해요?", "IT콘텐츠관이 어디예요?"라는 질문을 정말 많이 받아요. 신입생이 휴대폰으로 바로 찾아볼 수 있으면 좋겠어요.' },
          { text: '처음이니까 욕심내지 말고, 화면 3개짜리 앱으로 시작해 봐요. 잘 부탁드려요!' },
        ],
        brief: [
          ['의뢰인', '한빛대학교 입학처 학생홍보대사단'],
          ['만들 것', '신입생 캠퍼스 투어 앱 (화면 3개)'],
          ['투어 기간', '2월 22일(월) ~ 24일(수), 3일간'],
          ['꼭 들어갈 것', '투어 일정, 건물 위치'],
          ['지금의 불편', '"투어 언제 출발해요?", "그 건물 어디예요?" 같은 질문이 너무 많음'],
        ],
      },
      form: {
        purpose: '처음 학교에 오는 신입생이 투어 일정과 건물 위치를 빠르게 찾을 수 있게 한다.',
        target: '캠퍼스가 처음인 신입생, 함께 온 학부모',
        screens: [
          { defaultName: '홈', example: '투어 소개와 오늘의 투어 바로가기' },
          { defaultName: '투어 일정', example: '날짜별 투어 코스와 출발 시간' },
          { defaultName: '건물 지도', example: '주요 건물 위치와 안내' },
        ],
        actions: ['오늘의 투어를 보여 준다.', '투어 정보를 볼 수 있다.', '건물 정보가 나온다.'],
      },
      app: {
        name: '한빛대 입학처',
        title: '새내기 캠퍼스 투어',
        period: '2.22(월) – 2.24(수)',
        place: '본관 앞 분수대 출발',
        todayDayId: 'd1',
        nowPlayingId: 'p2',
        notices: ['투어는 본관 앞 분수대에서 출발해요.', '비가 오면 실내 코스로 바뀌어요.'],
        days: [
          {
            id: 'd1', label: '1일차', date: '2.22 월',
            performances: [
              { id: 'p1', time: '10:00', title: '본관·도서관 코스', stage: '본관 앞 출발' },
              { id: 'p2', time: '13:00', title: '학생회관·학생식당 코스', stage: '학생회관 앞 출발' },
              { id: 'p3', time: '15:30', title: 'IT콘텐츠관 실습실 코스', stage: 'IT콘텐츠관 1층 출발' },
            ],
          },
          {
            id: 'd2', label: '2일차', date: '2.23 화',
            performances: [
              { id: 'p4', time: '10:00', title: '기숙사·편의시설 코스', stage: '기숙사 정문 출발' },
              { id: 'p5', time: '14:00', title: '체육관·동아리방 코스', stage: '체육관 앞 출발' },
              { id: 'p6', time: '18:30', title: '야간 캠퍼스 산책 코스', stage: '본관 앞 출발' },
            ],
          },
          { id: 'd3', label: '3일차', date: '2.24 수', note: '3일차에는 투어 대신 자유 관람만 열려요.', performances: [] },
        ],
        zones: [
          { name: '본관 구역', x: 4, y: 6, w: 56, h: 46 },
          { name: '학생회관', x: 64, y: 6, w: 32, h: 40 },
          { name: '강의동', x: 4, y: 60, w: 40, h: 34 },
          { name: '생활관 구역', x: 50, y: 56, w: 46, h: 38 },
        ],
        booths: [
          { id: 'b1', name: '본관 (행정실)', category: '행정', x: 22, y: 30, place: '정문에서 직진 2분', hours: '09:00 – 18:00', items: ['학생증 발급', '장학 상담'] },
          { id: 'b2', name: '중앙도서관', category: '학습', x: 46, y: 36, place: '본관 오른쪽', hours: '08:00 – 22:00', items: ['열람실', '스터디룸'] },
          { id: 'b3', name: '학생회관', category: '생활', x: 80, y: 24, place: '중앙 광장 북쪽', hours: '08:00 – 20:00', items: ['학생식당', '동아리방'] },
          { id: 'b4', name: 'IT콘텐츠관', category: '강의', x: 24, y: 80, place: '본관 뒤편', hours: '08:00 – 22:00', items: ['실습실', '전공 사무실'] },
          { id: 'b5', name: '체육관', category: '운동', x: 64, y: 72, place: '생활관 가는 길', hours: '06:00 – 22:00', items: ['헬스장', '실내 코트'] },
          { id: 'b6', name: '기숙사', category: '생활', x: 86, y: 84, place: '후문 쪽 언덕', hours: '24시간', items: ['편의점', '세탁실'] },
        ],
      },
    },

    {
      id: 'cafeteria',
      summary: '오늘 메뉴와 식당 위치를 쉽게!',
      client: { name: '학생복지위원회', avatar: '복' },
      words: {
        appName: '학생식당 메뉴 앱', appShort: '식당 앱',
        item: '메뉴', itemSubj: '메뉴가', now: '지금 배식 중인 메뉴', nowObj: '지금 배식 중인 메뉴를', live: '배식 중',
        cta: '오늘의 메뉴 보기', card: '메뉴 카드',
        place: '식당', placeObj: '식당을', pin: '식당 표시(핀)', pinHint: '식당 표시를 눌러 보세요', detail: '식당 정보', infoItems: '대표 메뉴',
        emptyDay: '토요일', emptyNote: '토요일에는 학생식당이 쉬어요', firstDay: '월요일',
        persona: '점심시간이 짧은 2학년', emptyCase: '식당이 쉬는 날', targetHint: '공강 시간이 짧은 재학생',
        names: '홈·요일별 메뉴·식당 지도',
      },
      request: {
        messages: [
          { text: '안녕하세요, 기획자님! 저희는 한빛대학교 학생복지위원회예요.' },
          { text: '학생식당 메뉴 앱을 기획해 주세요.', strong: true },
          { text: '점심시간마다 "오늘 메뉴 뭐예요?", "푸드코트는 어디 있어요?"라는 질문이 쏟아져요. 줄 서기 전에 휴대폰으로 메뉴와 식당 위치를 볼 수 있으면 좋겠어요.' },
          { text: '처음이니까 욕심내지 말고, 화면 3개짜리 앱으로 시작해 봐요. 잘 부탁드려요!' },
        ],
        brief: [
          ['의뢰인', '한빛대학교 학생복지위원회'],
          ['만들 것', '학생식당 메뉴 앱 (화면 3개)'],
          ['운영 시간', '평일 08:00 ~ 19:00 (토·일 휴무)'],
          ['꼭 들어갈 것', '요일별 메뉴, 식당 위치'],
          ['지금의 불편', '"오늘 메뉴 뭐예요?", "식당 어디예요?" 같은 질문이 너무 많음'],
        ],
      },
      form: {
        purpose: '학생들이 줄 서기 전에 오늘 메뉴와 식당 위치를 빠르게 확인할 수 있게 한다.',
        target: '공강 시간이 짧은 재학생, 학교 식당이 처음인 1학년',
        screens: [
          { defaultName: '홈', example: '오늘의 메뉴 바로가기' },
          { defaultName: '요일별 메뉴', example: '요일별 아침·점심·저녁 메뉴' },
          { defaultName: '식당 지도', example: '교내 식당 위치' },
        ],
        actions: ['오늘의 메뉴를 보여 준다.', '메뉴 정보를 볼 수 있다.', '식당 정보가 나온다.'],
      },
      app: {
        name: '한빛대 학생식당',
        title: '오늘 뭐 먹지',
        period: '평일 08:00 – 19:00',
        place: '교내 식당 6곳',
        todayDayId: 'd1',
        nowPlayingId: 'p2',
        notices: ['학생증을 찍으면 500원 할인돼요.', '시험 기간에는 저녁 배식이 20시까지 늘어나요.'],
        days: [
          {
            id: 'd1', label: '월요일', date: '11.9 월',
            performances: [
              { id: 'p1', time: '08:00', title: '아침 · 토스트 세트', stage: '학생회관 학생식당' },
              { id: 'p2', time: '11:30', title: '점심 · 돈가스 정식', stage: '학생회관 학생식당' },
              { id: 'p3', time: '17:30', title: '저녁 · 김치볶음밥', stage: '기숙사 식당' },
            ],
          },
          {
            id: 'd2', label: '화요일', date: '11.10 화',
            performances: [
              { id: 'p4', time: '08:00', title: '아침 · 주먹밥과 국', stage: '기숙사 식당' },
              { id: 'p5', time: '11:30', title: '점심 · 카레라이스', stage: '학생회관 학생식당' },
              { id: 'p6', time: '17:30', title: '저녁 · 쌀국수', stage: '공학관 푸드코트' },
            ],
          },
          { id: 'd3', label: '토요일', date: '11.14 토', note: '토요일에는 학생식당이 쉬어요.', performances: [] },
        ],
        zones: [
          { name: '학생회관', x: 4, y: 6, w: 56, h: 46 },
          { name: '공학관', x: 64, y: 6, w: 32, h: 40 },
          { name: '도서관', x: 4, y: 60, w: 40, h: 34 },
          { name: '기숙사·광장', x: 50, y: 56, w: 46, h: 38 },
        ],
        booths: [
          { id: 'b1', name: '학생회관 학생식당', category: '한식', x: 22, y: 30, place: '학생회관 1층', hours: '08:00 – 19:00', items: ['돈가스 정식', '백반'] },
          { id: 'b2', name: '학생회관 카페', category: '카페', x: 46, y: 36, place: '학생회관 2층', hours: '08:30 – 18:00', items: ['아메리카노', '샌드위치'] },
          { id: 'b3', name: '공학관 푸드코트', category: '분식', x: 80, y: 24, place: '공학관 지하 1층', hours: '10:30 – 19:00', items: ['쌀국수', '떡볶이'] },
          { id: 'b4', name: '도서관 편의점', category: '편의점', x: 24, y: 80, place: '중앙도서관 1층', hours: '24시간', items: ['삼각김밥', '컵라면'] },
          { id: 'b5', name: '광장 푸드트럭', category: '간식', x: 64, y: 72, place: '중앙 광장 분수 옆', hours: '11:00 – 15:00', items: ['타코', '핫도그'] },
          { id: 'b6', name: '기숙사 식당', category: '한식', x: 86, y: 84, place: '기숙사 1층', hours: '07:30 – 20:00', items: ['김치볶음밥', '아침 뷔페'] },
        ],
      },
    },

    {
      id: 'studyroom',
      summary: '빈 시간과 스터디룸 위치를 쉽게!',
      client: { name: '중앙도서관 학생자치회', avatar: '도' },
      words: {
        appName: '도서관 스터디룸 앱', appShort: '스터디룸 앱',
        item: '예약 시간', itemSubj: '예약 시간이', now: '지금 바로 쓸 수 있는 방', nowObj: '지금 바로 쓸 수 있는 방을', live: '바로 이용',
        cta: '지금 빈 방 보기', card: '시간 카드',
        place: '스터디룸', placeObj: '스터디룸을', pin: '스터디룸 표시(핀)', pinHint: '스터디룸 표시를 눌러 보세요', detail: '스터디룸 정보', infoItems: '시설 정보',
        emptyDay: '일요일', emptyNote: '일요일에는 도서관이 문을 닫아요', firstDay: '오늘',
        persona: '시험 기간에 팀플 방을 찾는 학생', emptyCase: '빈 방이 없을 때', targetHint: '시험 기간에 팀플 방을 찾는 학생',
        names: '홈·예약 시간표·스터디룸 지도',
      },
      request: {
        messages: [
          { text: '안녕하세요, 기획자님! 저희는 한빛대학교 중앙도서관 학생자치회예요.' },
          { text: '도서관 스터디룸 앱을 기획해 주세요.', strong: true },
          { text: '시험 기간마다 "지금 빈 스터디룸 있어요?", "4인실은 어디예요?"라는 질문이 많아요. 학생들이 빈 시간과 방 위치를 휴대폰으로 바로 확인하면 좋겠어요.' },
          { text: '처음이니까 욕심내지 말고, 화면 3개짜리 앱으로 시작해 봐요. 잘 부탁드려요!' },
        ],
        brief: [
          ['의뢰인', '한빛대학교 중앙도서관 학생자치회'],
          ['만들 것', '도서관 스터디룸 앱 (화면 3개)'],
          ['운영 시간', '평일 09:00 ~ 22:00 (일요일 휴관)'],
          ['꼭 들어갈 것', '예약 가능 시간, 스터디룸 위치'],
          ['지금의 불편', '"빈 방 있어요?", "그 방 어디예요?" 같은 질문이 너무 많음'],
        ],
      },
      form: {
        purpose: '학생들이 빈 스터디룸 시간과 위치를 빠르게 확인할 수 있게 한다.',
        target: '시험 기간에 팀플 방을 찾는 학생, 도서관이 처음인 1학년',
        screens: [
          { defaultName: '홈', example: '빈 방 바로가기' },
          { defaultName: '예약 시간표', example: '날짜별 예약 가능한 시간' },
          { defaultName: '스터디룸 지도', example: '층별 스터디룸 위치' },
        ],
        actions: ['빈 방을 보여 준다.', '예약 정보를 볼 수 있다.', '스터디룸 정보가 나온다.'],
      },
      app: {
        name: '한빛대 중앙도서관',
        title: '빈 방 찾기',
        period: '평일 09:00 – 22:00',
        place: '중앙도서관 2·3층',
        todayDayId: 'd1',
        nowPlayingId: 'p2',
        notices: ['예약 후 10분 안에 오지 않으면 자동 취소돼요.', '한 사람당 하루 최대 3시간까지 쓸 수 있어요.'],
        days: [
          {
            id: 'd1', label: '오늘', date: '11.9 월',
            performances: [
              { id: 'p1', time: '10:00', title: '2인실 A · 2시간', stage: '2층 스터디룸 A' },
              { id: 'p2', time: '13:00', title: '4인실 B · 2시간', stage: '2층 스터디룸 B' },
              { id: 'p3', time: '16:00', title: '6인실 C · 3시간', stage: '3층 스터디룸 C' },
            ],
          },
          {
            id: 'd2', label: '내일', date: '11.10 화',
            performances: [
              { id: 'p4', time: '09:00', title: '4인실 D · 2시간', stage: '3층 스터디룸 D' },
              { id: 'p5', time: '14:00', title: '2인실 A · 1시간', stage: '2층 스터디룸 A' },
              { id: 'p6', time: '19:00', title: '8인 세미나실 · 2시간', stage: '3층 세미나실' },
            ],
          },
          { id: 'd3', label: '일요일', date: '11.15 일', note: '일요일에는 도서관이 문을 닫아요.', performances: [] },
        ],
        zones: [
          { name: '2층 열람실', x: 4, y: 6, w: 56, h: 46 },
          { name: '2층 스터디존', x: 64, y: 6, w: 32, h: 40 },
          { name: '3층 스터디존', x: 4, y: 60, w: 40, h: 34 },
          { name: '3층 세미나실', x: 50, y: 56, w: 46, h: 38 },
        ],
        booths: [
          { id: 'b1', name: '안내 데스크', category: '안내', x: 22, y: 30, place: '2층 입구', hours: '09:00 – 18:00', items: ['예약 문의', '분실물'] },
          { id: 'b2', name: '스터디룸 A (2인)', category: '2인실', x: 46, y: 36, place: '2층 창가', hours: '09:00 – 22:00', items: ['콘센트 4개', '창가 자리'] },
          { id: 'b3', name: '스터디룸 B (4인)', category: '4인실', x: 80, y: 24, place: '2층 안쪽', hours: '09:00 – 22:00', items: ['화이트보드', '콘센트 6개'] },
          { id: 'b4', name: '스터디룸 C (6인)', category: '6인실', x: 24, y: 80, place: '3층 계단 옆', hours: '09:00 – 22:00', items: ['TV 모니터', '화이트보드'] },
          { id: 'b5', name: '스터디룸 D (4인)', category: '4인실', x: 64, y: 72, place: '3층 복도 끝', hours: '09:00 – 22:00', items: ['방음 벽', '콘센트 6개'] },
          { id: 'b6', name: '세미나실 (8인)', category: '세미나실', x: 86, y: 84, place: '3층 중앙', hours: '09:00 – 22:00', items: ['빔 프로젝터', '마이크'] },
        ],
      },
    },
  ],

  /* 기획서 작성 화면 (예시 문장·기본 화면 이름은 고른 의뢰의 form 값으로 채워져요) */
  planForm: {
    purpose: {
      label: '서비스 목적',
      question: '이 앱은 누구의 어떤 불편을 해결하나요?',
      placeholder: '예: ○○하는 학생이 ○○을 빠르게 찾을 수 있게 한다.',
      hint: '"누가 + 무엇을 + 더 쉽게" 한 문장이면 충분해요.',
      example: '',
    },
    target: {
      label: '대상 사용자',
      question: '이 앱을 주로 쓸 사람은 누구인가요?',
      placeholder: '예: {targetHint}',
      hint: '나이·상황·목표처럼 구체적일수록 화면을 정하기 쉬워요.',
      example: '',
    },
    screens: {
      label: '주요 화면',
      question: '앱에 들어갈 화면 3개의 이름과 역할을 정해 주세요.',
      hint: '이름을 비워 두면 기본 이름({names})을 써요.',
      slots: [
        { defaultName: '', descPlaceholder: '이 화면에서 보여 줄 것', example: '' },
        { defaultName: '', descPlaceholder: '이 화면에서 보여 줄 것', example: '' },
        { defaultName: '', descPlaceholder: '이 화면에서 보여 줄 것', example: '' },
      ],
    },
    actions: {
      label: '버튼을 눌렀을 때의 동작',
      question: '각 버튼을 누르면 무슨 일이 일어나나요?',
      hint: '미리보기 앱은 여기 적힌 문장대로만 움직여요. 화면 이름을 적으면 그 화면으로 이동해요.',
      items: [
        { key: 'home', screenIndex: 0, button: "'{cta}' 버튼", placeholder: '예: 누르면 ○○ 화면으로 이동한다.', example: '' },
        { key: 'schedule', screenIndex: 1, button: '{card}', placeholder: '예: 누르면 자세한 내용이 펼쳐진다.', example: '' },
        { key: 'map', screenIndex: 2, button: '{pin}', placeholder: '예: 누르면 {place} 정보가 나온다.', example: '' },
      ],
    },
    tips: [
      '정답은 없어요. 지금 떠오르는 대로 적어도 괜찮아요.',
      '버튼 동작은 "누르면 → 어디로 / 무엇이 → 보인다" 순서로 쓰면 좋아요.',
      '빈틈이 있어도 괜찮아요. 다음 단계에서 AI 팀원이 같이 찾아 줄 거예요.',
    ],
  },

  /* 미리보기 화면의 '이렇게 눌러 보세요' 목록 */
  preview: {
    missions: [
      { key: 'home', text: "{s1}에서 '{cta}' 누르기" },
      { key: 'emptyDay', text: '{s2}에서 {emptyDay} 눌러 보기' },
      { key: 'map', text: '{s3}에서 {place} 하나 눌러 보기' },
    ],
  },

  /* AI 팀 회의 화면 (AI가 실패했을 때 쓰는 예시 질문 · 빈틈 종류와 선택지 id는 모든 의뢰에 공통) */
  meeting: {
    intro: [
      { by: 'developer', text: '기획서 잘 받았어요! 저희도 휴대폰 미리보기를 직접 눌러 봤어요.' },
      { by: 'designer', text: '화면을 그리다 보니 기획서만으로는 정할 수 없는 부분이 세 군데 있었어요. 같이 정해 볼까요?' },
    ],
    questions: [
      {
        id: 'q1', by: 'developer', gapNo: 1, gapTitle: '이동 경로 빈틈',
        short: '버튼을 누르면 어디로 가나요?',
        text: "{s1}의 '{cta}' 버튼을 누르면 어디로 가나요? 기획서만 보고는 어느 화면으로 연결해야 할지 모르겠어요.",
        textIfClear: "'{cta}'를 누르면 {s2} 화면으로 간다고 하셨죠. 그런데 도착하면 무엇부터 보여 줄까요? {now}인가요, 목록 맨 위인가요?",
        before: '버튼을 눌러도 아무 화면도 열리지 않았어요.',
        beforeIfClear: '화면은 넘어가지만, 무엇을 먼저 보여 줄지 정해져 있지 않았어요.',
        quote: 'actions.home', quoteLabel: "{s1} › '{cta}' 버튼",
        options: [
          { id: 'now', label: '{nowObj} 강조해서 보여 주기', desc: '{s2} 화면으로 이동한 뒤, 오늘 날짜에서 {nowObj} 눈에 띄게 표시해요.', planText: '누르면 {s2} 화면으로 이동하고, 오늘 날짜에서 {nowObj} 강조해 보여 준다.' },
          { id: 'list', label: '목록 처음으로 이동하기', desc: '{s2} 화면의 {firstDay} 목록 맨 위를 보여 줘요.', planText: '누르면 {s2} 화면으로 이동해 {firstDay} 목록 맨 위를 보여 준다.' },
        ],
        lesson: '버튼 설명에는 "누르면 → 어느 화면으로 → 무엇이 보이는지"까지 적어야 개발자가 연결할 수 있어요.',
      },
      {
        id: 'q2', by: 'designer', gapNo: 2, gapTitle: '빈 화면 빈틈',
        short: '{itemSubj} 없는 날엔 무엇이 보이나요?',
        text: '{s2}에서 {emptyDay} 탭을 누르니 화면이 텅 비어요. {itemSubj} 없는 날에는 무엇을 보여 줘야 하나요? 지금은 앱이 고장 난 것처럼 보여요.',
        before: '{emptyDay} 탭을 누르면 아무 안내 없이 빈 화면만 보였어요.',
        quote: 'screens.1.desc', quoteLabel: '{s2} 화면 설명',
        options: [
          { id: 'message', label: '안내 문구와 다른 날 보기 버튼', desc: '"{emptyNote}" 문구와 {firstDay} 목록으로 가는 버튼을 보여 줘요.', planText: '{itemSubj} 없는 날에는 "{emptyNote}" 안내와 [{firstDay} {item} 보기] 버튼을 보여 준다.' },
          { id: 'hide', label: '{itemSubj} 없는 날은 탭에서 빼기', desc: '날짜 탭에 {itemSubj} 있는 날만 보여 줘요.', planText: '{itemSubj} 없는 날은 날짜 탭에 보여 주지 않는다.' },
        ],
        lesson: '내용이 없을 때의 "빈 화면"도 기획해야 해요. 사용자는 아무것도 없는 화면을 고장으로 느껴요.',
      },
      {
        id: 'q3', by: 'developer', gapNo: 3, gapTitle: '상세 정보·돌아가기 빈틈',
        short: '{placeObj} 누르면 무엇이 보이고, 어떻게 돌아오나요?',
        text: '{s3}에서 {placeObj} 누르면 정확히 무엇이 보이나요? 그리고 다 본 다음에는 어떻게 지도로 돌아오나요?',
        before: '{placeObj} 눌러도 정보가 나오지 않았어요.',
        quote: 'actions.map', quoteLabel: '{s3} › {pin}',
        options: [
          { id: 'sheet', label: '아래에서 올라오는 정보 카드', desc: '지도는 그대로 두고 {place} 정보 카드를 띄워요. [닫기]를 누르면 사라져요.', planText: '{placeObj} 누르면 지도 위로 이름·위치·운영 시간·{infoItems} 카드가 올라오고, [닫기]를 누르면 지도로 돌아온다.' },
          { id: 'page', label: '{place} 상세 화면으로 이동', desc: '새 화면에서 자세히 보여 주고, 왼쪽 위 [뒤로] 버튼으로 지도에 돌아와요.', planText: '{placeObj} 누르면 {place} 상세 화면으로 이동하고, 왼쪽 위 [뒤로] 버튼을 누르면 지도로 돌아온다.' },
        ],
        lesson: '"무엇을 보여 줄지"와 함께 "어떻게 돌아오는지"까지 정해야 사용자가 길을 잃지 않아요.',
      },
    ],
    outro: { by: 'designer', text: '세 가지만 정해 주시면 바로 앱에 반영해 볼게요!' },
  },

  /* 진로 체험 리포트
   * AI가 실패하면 아래 표로 학생의 선택을 바탕으로 예시 리포트를 만들어요.
   * signals: 선택지마다 가까운 일(role)과 그 선택에서 살핀 점(focus) */
  report: {
    intro: '내 기획서와 회의에서 고른 답을 바탕으로 정리했어요. 적성 검사가 아니라, 이번 체험에서 보인 관심을 기록한 거예요.',
    roles: ['서비스 기획', 'UX 디자인', '프론트엔드 개발'],
    signals: {
      q1: {
        now: { role: '서비스 기획', focus: '사용자가 지금 가장 필요한 정보를 먼저 보여 주는 것' },
        list: { role: '프론트엔드 개발', focus: '화면 이동을 단순하고 예측할 수 있게 만드는 것' },
      },
      q2: {
        message: { role: 'UX 디자인', focus: '내용이 없을 때도 사용자가 헷갈리지 않게 안내하는 것' },
        hide: { role: '서비스 기획', focus: '쓸모없는 선택지를 줄여 꼭 필요한 것만 남기는 것' },
      },
      q3: {
        sheet: { role: 'UX 디자인', focus: '지금 보던 화면을 유지한 채 정보를 보여 주는 것' },
        page: { role: '프론트엔드 개발', focus: '화면 구조와 돌아가는 길을 분명하게 나누는 것' },
      },
    },
    roleNotes: {
      '서비스 기획': { seen: '이번 체험에서는 누가 언제 이 앱을 쓰는지, 무엇을 먼저 보여 줄지에 관심을 보였어요.', unseen: '이번 선택에서는 서비스 기획 쪽 선택이 많지 않았어요. 다음에는 "누가 왜 쓰는지"를 먼저 적어 보세요.' },
      'UX 디자인': { seen: '이번 체험에서는 사용자가 헷갈리지 않는 화면과 안내에 관심을 보였어요.', unseen: '이번 선택에서는 UX 디자인 쪽 선택이 많지 않았어요. 다음에는 사용자가 막히는 순간을 찾아보세요.' },
      '프론트엔드 개발': { seen: '이번 체험에서는 버튼과 화면이 어떻게 연결되고 움직이는지에 관심을 보였어요.', unseen: '이번 선택에서는 프론트엔드 개발 쪽 선택이 많지 않았어요. 다음에는 버튼 하나의 동작을 끝까지 따라가 보세요.' },
    },
    tasks: {
      '서비스 기획': [
        { title: '사용자 한 명 그려 보기', how: '{persona} 한 명을 정해 이름, 하루 일정, 가장 곤란한 순간을 5줄로 적어 보세요.' },
        { title: '기능 우선순위 정하기', how: '{appShort}에 넣고 싶은 기능 6개를 적고, 꼭 필요한 3개만 골라 이유를 한 줄씩 써 보세요.' },
      ],
      'UX 디자인': [
        { title: '빈 화면 문구 3가지 쓰기', how: '검색 결과 없음, {emptyCase}, 인터넷 끊김 상황에 보여 줄 안내 문구와 버튼을 종이에 그려 보세요.' },
        { title: '자주 쓰는 앱 따라 눌러 보기', how: '자주 쓰는 앱 하나에서 원하는 정보를 찾을 때까지 몇 번 눌렀는지 세고, 줄일 방법을 적어 보세요.' },
      ],
      '프론트엔드 개발': [
        { title: '버튼 동작표 만들기', how: '이번 {appShort}의 버튼을 모두 적고 "누르면 → 어디로 → 무엇이 보인다"를 표로 정리해 보세요.' },
        { title: 'HTML로 버튼 하나 만들기', how: '빈 HTML 파일에 버튼 하나를 만들고, 누르면 문구가 바뀌게 해 보세요. 이 사이트의 코드도 참고할 수 있어요.' },
      ],
    },
  },

  /* 결과 화면 */
  result: {
    nextLook:
      "{s2}의 {card}를 누르면 어떻게 될까요? 오늘 회의에서는 다루지 않았지만, 같은 방법으로 '누르면 → 어디로 → 무엇이' 질문을 던져 보세요.",
  },
};
