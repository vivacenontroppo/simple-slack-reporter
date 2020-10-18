const https = require("https");
const request = require("request");
const headers = { "Content-Type": "multipart/form-data" };
const fs = require("fs");
// Legacy tokens are deprecated and not working anymore, need fix:
const token =
  "***";
const fileUploadUrl = "https://slack.com/api/files.upload";
const slackHook =
  "***";

var file = fs.createReadStream("testLog.txt");

const data = JSON.stringify({
  file: fs.createReadStream("testLog.txt"),
  title: "Test Log File",
  filename: "testLog.txt",
  filetype: "auto"
});

const options = {
  channels: "GHHAZCKS6",
  hostname: "slack.com",
  port: 443,
  path: "/api/files.upload",
  method: "POST",
  headers: {
    Authorization: "***",
    "Content-Type": "application/json; charset=utf-8"
  }
};

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);

  res.on("data", d => {
    process.stdout.write(d);
  });
});

req.on("error", error => {
  console.error(error);
});

req.write(data);
req.end();

// function sendLogFile() {
// return new Promise((resolve, reject) => {
// const requestOptions = {
//   method: "POST",
//   url: fileUploadUrl,
//   headers: headers,
//   token: token,
//   title: "Test Log File",
//   filename: "testLog.txt",
//   filetype: "auto",
//   channels: "GHHAZCKS6",
//   file: fs.createReadStream("testLog.txt")
// };

// const req = https.request(requestOptions, res => {

//   res.on("data", d => resolve(d));
// });
// req.on("error", e => {
//   reject(e);
// });
// let payload = JSON.stringify(requestOptions);

// // This part is probably wrong:
// req.write(payload);

// req.end();
//   });
// }

// sendLogFile()
//   .then(r => console.log(r))
//   .catch(e => console.log(e));

// This is working example of sending file but with deprecated 'request' module:

function sendLogFile() {
  console.log("Sending log file to slack...");
  return new Promise((resolve, reject) => {
    request.post(
      {
        url: fileUploadUrl,
        formData: {
          token: token,
          method: "POST",
          title: "Test Log File",
          filename: "testLog.txt",
          filetype: "auto",
          channels: "GHHAZCKS6",
          file: fs.createReadStream("testLog.txt")
        }
      },
      function(err, response) {
        if (response.body.includes("created"))
          resolve("File send successfully!");
        if (response.body.includes("error")) reject(response.body);
        if (err) reject(err);
      }
    );
  });
}

// This is working example of request using 'https' module:

function sendSlackMessage(result, color) {
  let slackMsg = {
    text: `${result}`,
    icon_emoji: ":clipboard:",
    attachments: [
      {
        color: color,
        fields: [
          {
            title: ":clipboard:*Tests performed:*",
            value: `${this.performedSummary}`,
            short: true
          },
          {
            title: ":hourglass:*Time:*",
            value: `${this.testTimeNumber} seconds`,
            short: true
          },
          {
            title:
              ":arrow_up_down: For more info see the log file :arrow_up_down:",
            short: false
          }
        ]
      }
    ]
  };
  let payload = JSON.stringify(slackMsg);

  return new Promise((resolve, reject) => {
    console.log("Sending report to slack...");
    const requestOptions = {
      method: "POST",
      header: headers
    };

    const req = https.request(slackHook, requestOptions, res => {
      res.on("data", d => resolve(`${d}`));
    });
    req.on("error", e => {
      reject(e);
    });
    req.write(payload);
    req.end();
  });
}
