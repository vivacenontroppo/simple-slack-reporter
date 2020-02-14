const fs = require("fs");
const request = require("request");
const log = fs.readFileSync("./pusty.txt", "UTF-8");
const headers = { "Content-type": "application/json" };
const fileUploadUrl = "https://slack.com/api/files.upload";
const slackHook =
  "***";
const token =
  "***";
const nonZeroExit = () => setTimeout(() => process.exit(1), 1000);
const timeIndexNumber = log.search("Time:");
const testStringInfo = log.substring(timeIndexNumber, timeIndexNumber + 300);
const testTimeString = testStringInfo.split("\n")[0];
const testTimeNumber = parseFloat(testTimeString.replace(/[^\d\.]*/g, ""));
const logArray = log.split(/\n/);
const matchTests = str => str.match("test=");
const matchedTests = logArray.filter(matchTests);
const testsPerformed = [...new Set(matchedTests)];
const performedSummary = testsPerformed
  .toString()
  .replace(/INSTRUMENTATION_STATUS: test=/g, "")
  .replace(/,/g, "\n");
const testPayload = `:clipboard:*Tests performed:*\n\n${performedSummary}\n\n:hourglass:Time: *${testTimeNumber}* seconds\n\n:arrow_up_down: For more info see the log file :arrow_up_down:`;

const sendLogFile = () => {
  console.log("Sending log file to slack...");
  return new Promise((resolve, reject) => {
    request.post(
      {
        url: fileUploadUrl,
        formData: {
          token: token,
          title: "Test Log File",
          filename: "testLog.txt",
          filetype: "auto",
          channels: "***",
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
};

const postToSlack = content => {
  return new Promise((resolve, reject) => {
    console.log("Posting report to Slack...");

    let payload = {
      text: content
    };
    payload = JSON.stringify(payload);

    request.post(
      { url: slackHook, body: payload, headers: headers },
      (err, response) => {
        if (response) resolve(response.body);
        if (err) reject(err);
      }
    );
  });
};

const report = logFile => {
  return new Promise((resolve, reject) => {
    if (testTimeNumber && !logFile.includes("FAILURES!!!")) {
      postToSlack(
        `:white_check_mark: --- All tests completed successfully --- :white_check_mark:\n\n${testPayload}`
      )
        .then(r => console.log(r))
        .catch(e => console.log(e));

      resolve(`--- All tests completed successfully ---`);
    } else if (logFile.includes("Process crashed")) {
      postToSlack(
        `:exclamation: --- Process crashed, test run failed --- :exclamation:\n\n:arrow_up_down: For more info see the log file :arrow_up_down:`
      );

      reject(`--- Process crashed, test run failed ---`);
    } else if (testTimeNumber && logFile.includes("FAILURES!!!")) {
      const failsAmountTxt = testStringInfo.split("\n")[1];
      const failsNumber = parseInt(failsAmountTxt.match(/\d+/)[0], 10);
      const failSummary = [];

      for (let i = 1; i < failsNumber + 1; i++) {
        let failIndex = i + "\\) ";
        let failIndexNumber = logFile.search(failIndex);
        let failLine1 = logFile
          .substring(failIndexNumber, failIndexNumber + 300)
          .split("\n")[0];
        let failLine2 = logFile
          .substring(failIndexNumber, failIndexNumber + 400)
          .split("\n")[1];
        failSummary.push(failLine1);
        failSummary.push(failLine2);
      }

      const failsSlackInfo = failSummary
        .toString()
        .replace(/[\"\']/g, " ")
        .replace(/,/g, "\n");

      postToSlack(
        `:exclamation: --- Test run failed! --- :exclamation:\n\n${testPayload}\n\n*${failsAmountTxt}*\n\n${failsSlackInfo}`
      )
        .then(_ => nonZeroExit())
        .catch(e => console.log(e));

      reject(
        `--- Test run failed ---\n\n${failsAmountTxt}\n\n${failsSlackInfo}`
      );
    } else {
      postToSlack(
        ":exclamation: --- Incomplite log file, test run failed --- :exclamation:"
      );

      reject(`--- Incomplite log file, test run failed ---`);
    }
  });
};

report(log)
  .then(r => {
    console.log(r);

    sendLogFile()
      .then(r => console.log(r))
      .catch(e => console.log(e));
  })
  .catch(e => {
    console.log(e);

    sendLogFile()
      .then(r => console.log(r))
      .catch(e => console.log(e));
  });
