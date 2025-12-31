const https = require("https");

const url =
  "https://syd.cloud.appwrite.io/v1/databases/694696b60033338761f5/collections/preferences/attributes/keywords";
const options = {
  headers: {
    "X-Appwrite-Project": "690621dc00241683b91a",
    "X-Appwrite-Key":
      "standard_ad4031031386c86befeb69ca153d430ae8cb0d9741f45b9f7809e41d7cdbbe8e47173fefc0bc1f6e7922dcd9a48d3ff9e539cfde708c8b4e639d0b713d9970ef1087a9f78a5d59d71e9aeee9eede2452928eee3214d044105037aff2d074765b25bcc4461ed3a910bbedb2c2139b9fee8803c4cab89269223d255aa1459b26c6",
  },
};

https
  .get(url, options, (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const attribute = JSON.parse(data);
        console.log("Keywords Attribute Details:");
        console.log(JSON.stringify(attribute, null, 2));
      } else {
        console.error("Error:", res.statusCode, data);
      }
    });
  })
  .on("error", (err) => {
    console.error("Request error:", err);
  });
