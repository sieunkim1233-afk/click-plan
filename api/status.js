/*
 * GET /api/status
 * AI를 쓸 수 있는지(키가 설정됐는지)만 알려 줘요. 키 값은 절대 돌려주지 않습니다.
 */
const { MODEL } = require('./_lib');

module.exports = (req, res) => {
  res.setHeader('cache-control', 'no-store');
  res.status(200).json({ ai: Boolean(process.env.OPENAI_API_KEY), model: MODEL });
};
