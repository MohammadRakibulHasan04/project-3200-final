const https = require('https');

const endpoint = 'https://syd.cloud.appwrite.io/v1';
const projectId = '690621dc00241683b91a';
const databaseId = '694696b60033338761f5';
const collectionId = 'user';
const apiKey = 'standard_ad4031031386c86befeb69ca153d430ae8cb0d9741f45b9f7809e41d7cdbbe8e47173fefc0bc1f6e7922dcd9a48d3ff9e539cfde708c8b4e639d0b713d9970ef1087a9f78a5d59d71e9aeee9eede2452928eee3214d044105037aff2d074765b25bcc4461ed3a910bbedb2c2139b9fee8803c4cab89269223d255aa1459b26c6';

const url = `${endpoint}/databases/${databaseId}/collections/${collectionId}/attributes`;

const options = {
  headers: {
    'X-Appwrite-Project': projectId,
    'X-Appwrite-Key': apiKey,
    'Content-Type': 'application/json'
  }
};

https.get(url, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const response = JSON.parse(data);
      console.log('Total Attributes:', response.total);
      response.attributes.forEach(attr => {
          console.log(`Key: ${attr.key}, Type: ${attr.type}, Required: ${attr.required}`);
      });
    } else {
      console.error('Error fetching attributes:', res.statusCode, data);
    }
  });
}).on('error', (err) => {
  console.error('Request error:', err);
});
