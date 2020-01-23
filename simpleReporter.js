const fs = require("fs");
const { exec, execSync } = require("child_process");
const log = fs.readFileSync("./fullSuccLog.txt", "UTF-8");
const slackHook =
  "***";

const report = logFile => {
  let timeNumber = logFile.search("Time:");
  let testStringInfo = logFile.substring(timeNumber, timeNumber + 300);
  let testTime = testStringInfo.split("\n")[0];
  let logArray = logFile.split(/\n/);
  let matchTests = str => str.match("test=");
  let matchedTests = logArray.filter(matchTests);
  let testsPerformed = [...new Set(matchedTests)];
  let performedSummary = testsPerformed
    .toString()
    .replace(/INSTRUMENTATION_STATUS: test=/g, "")
    .replace(/,/g, "\n");

  return new Promise((resolve, reject) => {
    if (logFile.indexOf("FAILURES!!!") === -1) {

      exec(`curl -X POST -H 'Content-type: application/json' --data '{"text":":white_check_mark: --- All tests completed successfully --- :white_check_mark:\n\n:clipboard:*Tests performed:*\n\n${performedSummary}\n\n:hourglass:*${testTime}* seconds"}' ${slackHook}`);

      resolve(`--- All tests completed successfully ---\n${testStringInfo}`);
    } else {
      let failsAmountTxt = testStringInfo.split("\n")[1];
      let failsNumber = parseInt(failsAmountTxt.match(/\d+/)[0], 10);
      let failSummary = [];

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

      let failsSlackInfo = failSummary
        .toString()
        .replace(/[\"\']/g, " ")
        .replace(/,/g, "\n");
      console.log(failSummary);
      execSync(
        `curl -X POST -H 'Content-type: application/json' --data '{"text":":exclamation: --- Test run failed! --- :exclamation:\n\n:hourglass:*${testTime}* seconds\n\n:clipboard:*Tests performed:*\n${performedSummary}\n\n:no_entry: *${failsAmountTxt}*\n\n ${failsSlackInfo} \n\n:arrow_down: For more info see the log file :arrow_down:"}' ${slackHook}`
      );

      reject("--- Test run failed! ---");
    }
  });
};

report(log)
  .then(r => console.log(`${r}`))
  .catch(e => {
    execSync(
      `curl -F file=@testLog.txt -F channels=*** -H "Authorization: ***" https://slack.com/api/files.upload`
    );
    console.log(e);
    process.exit(1);
  });
