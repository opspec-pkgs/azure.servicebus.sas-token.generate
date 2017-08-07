const crypto = require('crypto');

// see https://docs.microsoft.com/en-us/rest/api/eventhub/generate-sas-token
function createSasToken() {
    const connObj = parseConnectionString();

    const now = new Date();
    const fiveYears = (60 * 60 * 24 * 7) * 260;
    const ttl = Math.round(now.getTime() / 1000) + fiveYears;

    const sbUrl = connObj.Endpoint;
    const httpsUrl = `https${sbUrl.substring(2)}events/messages`;
    const encodedHttpsUrl = encodeURIComponent(httpsUrl);

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
        const currentValueParts = item.split('=', 2);
        connObj[currentValueParts[0]] = currentValueParts[1];
    }
    );

    console.log(connObj);

    // validate
    if (!connObj.Endpoint) {
        throw new Error('invalid connectionString, Endpoint required');
    } else if (!connObj.SharedAccessKey) {
        throw new Error('invalid connectionString, SharedAccessKey required');
    } else if (!connObj.SharedAccessKeyName) {
        throw new Error('invalid connectionString, SharedAccessKeyName required');
    }

    return connObj;
}

console.log(`sasToken=${createSasToken()}`);