const crypto = require('crypto');

// see https://docs.microsoft.com/en-us/rest/api/eventhub/generate-sas-token
function createSasToken() {
    const now = new Date();
    const fiveYears = (60 * 60 * 24 * 7) * 260;
    const ttl = Math.round(now.getTime() / 1000) + fiveYears;

    const url = `${process.env.endpoint}events/messages`;
    const encodedUrl = encodeURIComponent(url);

    // roundtrip to/from JSON to encode to UTF8 rather than depending on 3rd party module
    const signatureUTF8 = JSON.parse(JSON.stringify(`${encodedUrl}\n${ttl}`));

    const hash = crypto.createHmac('sha256', process.env.sharedAccessKey).update(signatureUTF8).digest('base64');
    return `SharedAccessSignature sr=${encodedUrl}&sig=${encodeURIComponent(hash)}&se=${ttl}&skn=${process.env.sharedAccessKeyName}`;
}

console.log(`sasToken=${createSasToken()}`);
