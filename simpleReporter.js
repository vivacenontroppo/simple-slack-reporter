const fs = require("fs");
const { exec, execSync } = require("child_process");
const log = fs.readFileSync("./testLog.txt", "UTF-8");
const slackHook = "***";

const report = logFile => {
  const timeNumber = logFile.search("Time:");
  const testStringInfo = logFile.substring(timeNumber, timeNumber + 300);
  const testTime = testStringInfo.split("\n")[0];
  const logArray = logFile.split(/\n/);
  const matchTests = str => str.match("test=");
  const matchedTests = logArray.filter(matchTests);
  const testsPerformed = [...new Set(matchedTests)];
  const performedSummary = testsPerformed
    .toString()
    .replace(/INSTRUMENTATION_STATUS: test=/g, "")
    .replace(/,/g, "\n");

  return new Promise((resolve, reject) => {
    if (logFile.indexOf("FAILURES!!!") === -1) {
      exec(
        `curl -X POST -H 'Content-type: application/json' --data '{"text":":white_check_mark: --- All tests completed successfully --- :white_check_mark:\n\n:clipboard:*Tests performed:*\n\n${performedSummary}\n\n:hourglass:*${testTime}* seconds\n\n:arrow_up_down: For more info see the log file :arrow_up_down:"}' ${slackHook}`
      );

      resolve(`--- All tests completed successfully ---\n${testStringInfo}`);
    } else {
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
      execSync(
        `curl -X POST -H 'Content-type: application/json' --data '{"text":":exclamation: --- Test run failed! --- :exclamation:\n\n:hourglass:*${testTime}* seconds\n\n:clipboard:*Tests performed:*\n${performedSummary}\n\n:no_entry: *${failsAmountTxt}*\n\n ${failsSlackInfo} \n\n:arrow_down: For more info see the log file :arrow_down:"}' ${slackHook}`
      );

      reject(`--- Test run failed! ---\n${failsSlackInfo}`);
    }
  });
};

report(log)
  .then(r => {
    execSync(
      `curl -F file=@testLog.txt -F channels=*** -H "Authorization: Bearer ***" https://slack.com/api/files.upload`
    );
    console.log(r);
  })
  .catch(e => {
    execSync(
      `curl -F file=@testLog.txt -F channels=*** -H "Authorization: Bearer ***" https://slack.com/api/files.upload`
    );
    console.log(e);
    process.exit(1);
  });
