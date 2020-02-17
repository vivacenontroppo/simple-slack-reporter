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
  }

  sendSlackMessage(result) {
    let slackMsg = {
      text: `${result.message}`,
      icon_emoji: ":clipboard:",
      attachments: [
        {
          color: result.color,
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
            },
            {
              title: `${result.failsAmountTxt}`,
              value: `${result.failsSlackInfo}`,
              short: false
            }
          ]
        }
      ]
    };

    (function adjustMsg() {
      if (result.status === "success") {
        slackMsg.attachments[0].fields.pop();
        return slackMsg;
      } else if (result.status === "crashed") {
        slackMsg.attachments[0].fields.pop();
        slackMsg.attachments[0].fields[1].value = "Duration unknown";
        return slackMsg;
      } else if (result.status === "uncomplete") {
        delete slackMsg.attachments;
        return slackMsg;
      }
    })();

    let payload = JSON.stringify(slackMsg);

    return new Promise((resolve, reject) => {
      console.log("Sending report to slack...");

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
        const result = {
          status: "success",
          message: `:white_check_mark: --- All tests completed successfully --- :white_check_mark:`,
          color: "#048a04"
        };

        resolve(result);
      } else if (this.file.includes("Process crashed")) {
        const result = {
          status: "crashed",
          message:
            ":exclamation: --- Process crashed, test run failed --- :exclamation:",
          color: "#c400ad"
        };

        reject(result);
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

        const result = {
          status: "failed",
          message: ":exclamation: --- Test run failed! --- :exclamation:",
          color: "#DC143C",
          failsAmountTxt: failsAmountTxt,
          failsSlackInfo: failsSlackInfo
        };

        reject(result);
      } else {
        const result = {
          status: "uncomplete",
          message:
            ":exclamation: --- Incomplite log file, test run failed --- :exclamation:"
        };

        reject(result);
      }
    });
  }
}

const reporter = new Reporter(logInfo);

reporter
  .report()
  .then(r =>
    reporter
      .sendSlackMessage(r)
      .then(r => console.log(r))
      .catch(e => console.log(e))
  )
  .catch(e =>
    reporter
      .sendSlackMessage(e)
      .then(r => console.log(r))
      .catch(e => console.log(e))
      .finally(nonZeroExit())
  )
  .finally(
    reporter
      .sendLogFile()
      .then(r => console.log(r))
      .catch(e => console.log(e))
  );
