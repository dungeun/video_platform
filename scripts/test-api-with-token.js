const jwt = require('jsonwebtoken');

const JWT_SECRET = 'VideoPick2024!SuperSecretJWTKey#VideoPickProduction$';

// JWT 토큰 생성
function generateToken() {
  const payload = {
    userId: 'streamer-demo-001',
    email: 'streamer@test.com',
    name: '스트리머',
    type: 'INFLUENCER',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24시간
  };
  
  return jwt.sign(payload, JWT_SECRET);
}

const token = generateToken();
console.log('생성된 JWT 토큰:');
console.log(token);

// 테스트용 curl 명령어 생성
console.log('\n테스트용 curl 명령어:');
console.log(`curl -X POST http://localhost:3000/api/videos/create \\
-H "Content-Type: multipart/form-data" \\
-H "Authorization: Bearer ${token}" \\
-F "videoUrl=http://storage.one-q.xyz/videos/test-video.mp4" \\
-F "title=API 테스트 비디오" \\
-F "description=JWT 토큰으로 테스트하는 비디오입니다" \\
-F "category=테스트" \\
-F "tags=[\\"API\\",\\"테스트\\"]" \\
-F "visibility=public"`);

console.log('\n쿠키 방식 curl 명령어:');
console.log(`curl -X POST http://localhost:3000/api/videos/create \\
-H "Content-Type: multipart/form-data" \\
-H "Cookie: auth-token=${token}" \\
-F "videoUrl=http://storage.one-q.xyz/videos/test-video.mp4" \\
-F "title=API 테스트 비디오 (쿠키)" \\
-F "description=쿠키 방식으로 테스트하는 비디오입니다" \\
-F "category=테스트" \\
-F "tags=[\\"API\\",\\"쿠키\\"]" \\
-F "visibility=public"`);