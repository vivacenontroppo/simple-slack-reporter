// THIS ONE IS PRETTY MUCH DEPRECATED AND SLOPPY (but it worked well at the time)

const fs = require("fs");
const request = require("request");
const logInfo = ["./testLog.txt", "UTF-8"];
const headers = { "Content-type": "application/json" };
const fileUploadUrl = "https://slack.com/api/files.upload";
const slackHook =
  "***";
const token =
  "***";
const slackChannel = "***";
const nonZeroExit = () => setTimeout(() => process.exit(1), 2000);
const matchTests = str => str.match("test=");

class Reporter {
  constructor([path, coding]) {
    this.path = path;
    this.coding = coding;
    this.file = fs.readFileSync(this.path, this.coding);
    this.logArray = this.file.split(/\n/);
    this.timePositionIndex = this.file.search("Time:");
    this.testsSummaryString = this.file.substring(
      this.timePositionIndex,
      this.timePositionIndex + 300
    );
    this.testTimeString = this.testsSummaryString.split("\n")[0];
    this.testTimeNumber = 
      ~~parseFloat(this.testTimeString
      .replace("Time: ", "")
      .replace(",",""))
    this.testTimeNumberMinutes = ~~(this.testTimeNumber / 60)
    this.testTimeNumberSeconds = this.testTimeNumber - this.testTimeNumberMinutes*60
    this.matchedTests = this.logArray.filter(matchTests);
    this.testsPerformed = [...new Set(this.matchedTests)];
    this.performedTestsList = this.testsPerformed
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
            channels: slackChannel,
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
    let slackMessage = {
      text: `:iphone: *Performed by Android SDK e2e-tester (text-only) - PKO IKO*\n.`,
      icon_emoji: ":clipboard:",
      attachments: [
        {
          color: result.color,
          fields: [
              {
                title: ":question:*Test outcome:*",
                value: `*${result.message}*\n---`,
                short: true
              },
              {
                title: ":card_file_box:*Type:*",
                value: `${this.testGroup}\n---`,
                short: true
              },
            {
              title: ":clipboard:*Tests performed:*",
              value: `${this.performedTestsList}`,
              short: true
            },
            {
              title: ":hourglass:*Time:*",
              value: `${this.testTimeNumberMinutes} minutes ${this.testTimeNumberSeconds} seconds`,
              short: true
            },
            {
              title:
                ":arrow_up_down: For more info see the log file :arrow_up_down:",
              short: false
            },
            {
              title: `${result.failsAmountString}`,
              value: `${result.failsSlackInfo}`,
              short: false
            }
          ]
        }
      ]
    };

    (function adjustslackMessage() {
      if (result.status === "success") {
        slackMessage.attachments[0].fields.pop();
        return slackMessage;
      } else if (result.status === "crashed") {
        slackMessage.attachments[0].fields.pop();
        slackMessage.attachments[0].fields[1].value = "Duration unknown";
        return slackMessage;
      } else if (result.status === "uncomplete") {
        delete slackMessage.attachments;
        return slackMessage;
      } else {
        console.log(result.failsSlackInfo);
      }
    })();

    let payload = JSON.stringify(slackMessage);

    return new Promise((resolve, reject) => {
      console.log("Sending report to slack...");

      request.post(
        { url: slackHook, body: payload, headers: headers },
        (err, response) => {
          if (response.body.includes("ok")) resolve(`Report send successfully!`);
          if (response.body.includes("error")) reject(`Failed to send report: ${response.body}`);
          if (err) reject(err);
        }
      );
    });
  }

  getResult() {
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
        const failsAmountString = this.testsSummaryString.split("\n")[1];
        const failsNumber = parseInt(failsAmountString.match(/\d+/)[0], 10);
        const failsSummary = [];

        for (let i = 1; i < failsNumber + 1; i++) {
          let failIndex = i + "\\) ";
          let failIndexNumber = this.file.search(failIndex);
          let failLine1 = this.file
            .substring(failIndexNumber, failIndexNumber + 300)
            .split("\n")[0];
          let failLine2 = this.file
            .substring(failIndexNumber, failIndexNumber + 400)
            .split("\n")[1];
          failsSummary.push(failLine1);
          failsSummary.push(failLine2);
        }

        const failsSlackInfo = failsSummary
          .toString()
          .replace(/[\"\']/g, " ")
          .replace(/,/g, "\n");

        const result = {
          status: "failed",
          message: ":exclamation: --- Test run failed! --- :exclamation:",
          color: "#DC143C",
          failsAmountString: failsAmountString,
          failsSlackInfo: failsSlackInfo
        };

        reject(result);
      } else if (this.timePositionIndex === -1) {
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
  .getResult()
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
