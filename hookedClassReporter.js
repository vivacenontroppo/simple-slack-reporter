const fs = require("fs");
const request = require("request");
const logInfo = ["./testLog.txt", "UTF-8"];
const headers = { "Content-type": "application/json" };
const fileUploadUrl = "https://slack.com/api/files.upload";
const slackHook =
  "***";
const token =
  "***";
const nonZeroExit = () => setTimeout(() => process.exit(1), 1000);
const matchTests = str => str.match("test=");

class Reporter {
  constructor([path, coding]) {
    this.path = path;
    this.coding = coding;
    this.file = fs.readFileSync(this.path, this.coding);
    this.logArray1 = this.file.split(/\n/);
    this.timeIndexNumber = this.file.search("Time:");
    this.testStringInfo = this.file.substring(
      this.timeIndexNumber,
      this.timeIndexNumber + 300
    );
    this.testTimeString = this.testStringInfo.split("\n")[0];
    this.testTimeNumber = parseFloat(
      this.testTimeString.replace(/[^\d\.]*/g, "")
    );
    this.matchedTests = this.logArray1.filter(matchTests);
    this.testsPerformed = [...new Set(this.matchedTests)];
    this.performedSummary = this.testsPerformed
      .toString()
      .replace(/INSTRUMENTATION_STATUS: test=/g, "")
      .replace(/,/g, "\n");
    this.testPaylod = `:clipboard:*Tests performed:*\n\n${this.performedSummary}\n\n:hourglass:Time: *${this.testTimeNumber}* seconds\n\n:arrow_up_down: For more info see the log file :arrow_up_down:`;
  }

  sendLogFile() {
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

  postToSlack(info) {
    return new Promise((resolve, reject) => {
      console.log("Posting report to Slack...");

      let payload = {
        text: info
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
  }

  report() {
    return new Promise((resolve, reject) => {
      if (this.testTimeNumber && !this.file.includes("FAILURES!!!")) {
        postToSlack(
          `:white_check_mark: --- All tests completed successfully --- :white_check_mark:\n\n${this.testPaylod}`
        )
          .then(r => console.log(r))
          .catch(e => console.log(e));

        resolve(`--- All tests completed successfully ---`);
      } else if (this.file.includes("Process crashed")) {
        postToSlack(
          `:exclamation: --- Process crashed, test run failed --- :exclamation:\n\n:arrow_up_down: For more info see the log file :arrow_up_down:`
        );

        reject(`--- Process crashed, test run failed ---`);
      } else if (this.testTimeNumber && this.file.includes("FAILURES!!!")) {
        const failsAmountTxt = this.testStringInfo.split("\n")[1];
        const failsNumber = parseInt(failsAmountTxt.match(/\d+/)[0], 10);
        const failSummary = [];

        for (let i = 1; i < failsNumber + 1; i++) {
          let failIndex = i + "\\) ";
          let failIndexNumber = this.file.search(failIndex);
          let failLine1 = this.file
            .substring(failIndexNumber, failIndexNumber + 300)
            .split("\n")[0];
          let failLine2 = this.file
            .substring(failIndexNumber, failIndexNumber + 400)
            .split("\n")[1];
          failSummary.push(failLine1);
          failSummary.push(failLine2);
        }

        const failsSlackInfo = failSummary
          .toString()
          .replace(/[\"\']/g, " ")
          .replace(/,/g, "\n");

        this.postToSlack(
          `:exclamation: --- Test run failed! --- :exclamation:\n\n${this.testPaylod}\n\n:no_entry: *${failsAmountTxt}*\n\n${failsSlackInfo}`
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
  }
}

const reporter = new Reporter(logInfo);

reporter
  .report()
  .then(r => console.log(r))
  .catch(e => console.log(e))
  .finally(
    reporter
      .sendLogFile()
      .then(r => console.log(r))
      .catch(e => console.log(e))
  );
