const https = require('https');
const fs = require('fs');

const config = {
  endpoint: 'https://syd.cloud.appwrite.io/v1',
  projectId: '690621dc00241683b91a',
  databaseId: '694696b60033338761f5',
  collectionId: 'user',
  apiKey: 'standard_ad4031031386c86befeb69ca153d430ae8cb0d9741f45b9f7809e41d7cdbbe8e47173fefc0bc1f6e7922dcd9a48d3ff9e539cfde708c8b4e639d0b713d9970ef1087a9f78a5d59d71e9aeee9eede2452928eee3214d044105037aff2d074765b25bcc4461ed3a910bbedb2c2139b9fee8803c4cab89269223d255aa1459b26c6'
};

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `${config.endpoint}${path}`;
    const options = {
      headers: {
        'X-Appwrite-Project': config.projectId,
        'X-Appwrite-Key': config.apiKey,
        'Content-Type': 'application/json'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function inspectSchema() {
  const output = [];
  
  output.push('=== APPWRITE SCHEMA INSPECTION ===\n');
  
  try {
    // Get attributes
    const attributesResponse = await makeRequest(`/databases/${config.databaseId}/collections/${config.collectionId}/attributes`);
    
    output.push('ATTRIBUTES:');
    attributesResponse.attributes.forEach(attr => {
      const details = [
        `type:${attr.type}`,
        `required:${attr.required}`,
        attr.array ? `array:true` : null,
        attr.size ? `size:${attr.size}` : null,
        attr.format ? `format:${attr.format}` : null
      ].filter(Boolean).join(', ');
      
      output.push(`  ${attr.key} -> ${details}`);
    });

    output.push('\nREQUIRED FIELDS:');
    const required = attributesResponse.attributes.filter(a => a.required);
    required.forEach(attr => {
      output.push(`  - ${attr.key}: ${attr.type}${attr.format ? ` (${attr.format})` : ''}`);
    });

    const result = output.join('\n');
    console.log(result);
    fs.writeFileSync('schema_details.txt', result);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

inspectSchema();
