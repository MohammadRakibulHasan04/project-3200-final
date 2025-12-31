const https = require('https');

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
  console.log('=== APPWRITE SCHEMA INSPECTION ===\n');
  
  try {
    // Get collection details
    console.log('1. Fetching collection metadata...');
    const collection = await makeRequest(`/databases/${config.databaseId}/collections/${config.collectionId}`);
    console.log(`   Collection Name: ${collection.name}`);
    console.log(`   Total Attributes: ${collection.attributes?.length || 0}\n`);

    // Get attributes
    console.log('2. Fetching attributes...');
    const attributesResponse = await makeRequest(`/databases/${config.databaseId}/collections/${config.collectionId}/attributes`);
    
    console.log('\n=== ATTRIBUTES DETAILS ===');
    attributesResponse.attributes.forEach(attr => {
      console.log(`\nAttribute: ${attr.key}`);
      console.log(`  Type: ${attr.type}`);
      console.log(`  Required: ${attr.required}`);
      console.log(`  Array: ${attr.array || false}`);
      if (attr.size) console.log(`  Size: ${attr.size}`);
      if (attr.default !== undefined) console.log(`  Default: ${attr.default}`);
      if (attr.format) console.log(`  Format: ${attr.format}`);
    });

    // Summary for code generation
    console.log('\n\n=== CODE GENERATION SUMMARY ===');
    console.log('Required fields for createDocument:');
    const required = attributesResponse.attributes.filter(a => a.required);
    required.forEach(attr => {
      console.log(`  - ${attr.key}: ${attr.type}${attr.format ? ` (format: ${attr.format})` : ''}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

inspectSchema();
