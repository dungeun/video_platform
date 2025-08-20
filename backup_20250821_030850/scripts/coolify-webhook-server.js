const express = require('express');
const axios = require('axios');
const app = express();

// 설정 - 안전성을 위해 환경변수 사용
const config = {
    powerdns: {
        apiUrl: process.env.POWERDNS_API_URL || 'http://158.247.233.83:8081/api/v1',
        apiKey: process.env.POWERDNS_API_KEY,
        domain: process.env.DNS_DOMAIN || 'video.one-q.xyz',
        // 기존 도메인과 충돌 방지를 위한 접두사
        prefix: 'app-'  
    },
    coolify: {
        serverIp: process.env.COOLIFY_SERVER_IP || '141.164.60.51'
    },
    // 안전 모드: 실제 생성 전 로그만 출력
    dryRun: process.env.DRY_RUN === 'true' || true
};

app.use(express.json());

// Coolify 웹훅 엔드포인트
app.post('/webhook/coolify', async (req, res) => {
    try {
        const { 
            event, 
            project_name, 
            service_name,
            deployment_status 
        } = req.body;

        // 배포 성공 시에만 처리
        if (event === 'deployment.success' || event === 'service.created') {
            const subdomain = generateSubdomain(project_name, service_name);
            await createDNSRecord(subdomain);
            
            console.log(`✅ Created subdomain: ${subdomain}.${config.powerdns.domain}`);
            res.json({ success: true, subdomain: `${subdomain}.${config.powerdns.domain}` });
        } else {
            res.json({ success: true, message: 'Event ignored' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 서브도메인 생성 로직
function generateSubdomain(projectName, serviceName) {
    // 프로젝트명-서비스명 형식
    const base = serviceName || projectName;
    return base.toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '');
}

// PowerDNS API 호출
async function createDNSRecord(subdomain) {
    // 접두사 추가하여 기존 레코드와 충돌 방지
    const prefixedSubdomain = `${config.powerdns.prefix}${subdomain}`;
    const fqdn = `${prefixedSubdomain}.${config.powerdns.domain}`;
    
    const data = {
        rrsets: [{
            name: `${fqdn}.`,
            type: 'A',
            ttl: 300,
            changetype: 'REPLACE',
            records: [{
                content: config.coolify.serverIp,
                disabled: false
            }]
        }]
    };

    // 안전 모드: 실제 생성하지 않고 로그만 출력
    if (config.dryRun) {
        console.log('🔍 DRY RUN MODE - Would create DNS record:');
        console.log(JSON.stringify(data, null, 2));
        return { dryRun: true, fqdn };
    }

    // 실제 API 호출 전 기존 레코드 확인
    try {
        const checkResponse = await axios.get(
            `${config.powerdns.apiUrl}/servers/localhost/zones/${config.powerdns.domain}.`,
            {
                headers: {
                    'X-API-Key': config.powerdns.apiKey
                }
            }
        );
        
        // 중복 확인
        const existingRecords = checkResponse.data.rrsets || [];
        const exists = existingRecords.some(rr => rr.name === `${fqdn}.`);
        
        if (exists) {
            console.log(`⚠️  DNS record already exists: ${fqdn}`);
            return { exists: true, fqdn };
        }
    } catch (error) {
        console.error('Failed to check existing records:', error.message);
    }

    // 실제 생성
    await axios.patch(
        `${config.powerdns.apiUrl}/servers/localhost/zones/${config.powerdns.domain}.`,
        data,
        {
            headers: {
                'X-API-Key': config.powerdns.apiKey,
                'Content-Type': 'application/json'
            }
        }
    );
    
    return { created: true, fqdn };
}

// 서버 시작
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
    console.log(`🚀 Coolify-PowerDNS webhook server running on port ${PORT}`);
});

// 헬스체크
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});