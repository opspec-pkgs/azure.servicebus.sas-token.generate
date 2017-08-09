const crypto = require('crypto');
let endpoint;

// see https://docs.microsoft.com/en-us/rest/api/eventhub/generate-sas-token
function createSasToken() {
    const connObj = parseConnectionString();

    const now = new Date();
    const fiveYears = (60 * 60 * 24 * 7) * 260;
    const ttl = Math.round(now.getTime() / 1000) + fiveYears;

    const encodedHttpsUrl = encodeURIComponent(endpoint);

    // roundtrip to/from JSON to encode to UTF8 rather than depending on 3rd party module
    const signatureUTF8 = JSON.parse(JSON.stringify(`${encodedHttpsUrl}\n${ttl}`));

    const hash = crypto.createHmac('sha256', connObj.SharedAccessKey).update(signatureUTF8).digest('base64');
    return `SharedAccessSignature sr=${encodedHttpsUrl}&sig=${encodeURIComponent(hash)}&se=${ttl}&skn=${connObj.SharedAccessKeyName}`;
}

function parseConnectionString() {

    const connObj = {};
    // connection string in form 'Endpoint=<value>;SharedAccessKeyName=<value>;SharedAccessKey=<value>'
    process.env.connectionString.split(';').forEach(item => {
        // current value will be in form '<key>=<value>'
        if (item.split('=')[0] === 'SharedAccessKey' && item[item.length - 1] === '=') {
            const accessKey = item.split('SharedAccessKey=')[1];
            const index = accessKey.indexOf('=');
            const key = accessKey.substr(0, index);
            const equalsSign = accessKey.substr(index, index + 1);
            connObj[item.split('=')[0]] = `${key}${equalsSign}`;
        } else {
            const currentValueParts = item.split('=', 2);
            connObj[currentValueParts[0]] = currentValueParts[1];
        }
    });

    // validate
    if (!connObj.Endpoint) {
        throw new Error('invalid connectionString, Endpoint required');
    } else if (!connObj.SharedAccessKey) {
        throw new Error('invalid connectionString, SharedAccessKey required');
    } else if (!connObj.SharedAccessKeyName) {
        throw new Error('invalid connectionString, SharedAccessKeyName required');
    }

    endpoint = `https${connObj.Endpoint.substring(2)}events/messages`;

    return connObj;
}

console.log(`sasToken=${createSasToken()}`);
console.log(`endpoint ${endpoint}`);
