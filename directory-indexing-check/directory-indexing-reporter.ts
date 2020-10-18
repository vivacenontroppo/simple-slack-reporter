const { WebClient } = require("@slack/web-api");
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("directory-indexing-check/config.json", "utf8"));
const token = '***'
interface Result {
  title: string;
  failed: boolean;
  color: string;
  description: string;
}

export class Reporter {
  channel: string;
  logInfo: string[];
  authToken: string;
  file: string;
  logArray: string[];
  failedUrls: string[];
  result: Result;
  slackApp: any;

  constructor() {
    this.authToken = token;
    this.channel = config.slack.channel;
    this.logInfo = config.slack.logInfo;
    this.file = fs.readFileSync(this.logInfo[0], this.logInfo[1]);
    this.logArray = this.file.split(/\n/);
    this.slackApp = new WebClient(this.authToken);
    this.failedUrls = [];
  }

  getResult = async (): Promise<Result> => {
    this.file.includes("CHECK")
      ? this.logArray.forEach((el) => {
          if (el.includes("CHECK")) {
            this.failedUrls.push(
              el.replace(" - \u001b[35m CHECK NEEDED! \u001b[0m", "\n")
            );
          }
        })
      : /* tslint:disable-next-line: no-unused-expression */
        [];
    if (this.file.includes("CHECK")) {
      return (this.result = {
        title: "Test failed!",
        failed: true,
        color: "#DC143C",
        description:
          "There are some URL's that have catalog / file indexing on.",
      });
    } else if (!this.file.includes("CHECK") && !this.file.includes("OK")) {
      return (this.result = {
        title: "Process crashed, test run failed!",
        failed: true,
        color: "#eb349e",
        description: "There is no meaningful result in log file!",
      });
    } else {
      return (this.result = {
        title: "Test success!",
        failed: false,
        color: "#048a04",
        description: "All provided URL's are safe.",
      });
    }
  };

  postResult = async (res: Result): Promise<void> => {
    try {
      await this.slackApp.chat.postMessage({
        text: `:package: *Directory / file indexing test:*\n.`,
        icon_emoji: ":clipboard:",
        attachments: [
          {
            color: res.color,
            fields: [
              {
                title: ":question:*Test outcome:*",
                value: `--- *${res.title}* ---\n`,
                short: true,
              },
              {
                title: ":memo:*Description:*",
                value: `${res.description}.\n.\n`,
                short: true,
              },
              {
                title: ":hourglass:*Time:*",
                value: `<10 sec\n.`,
                short: true,
              },
              {
                title: ":bar_chart:For more info see the log: ",
                value: config.slack.pipelinesUrl,
                short: false,
              },
              {
                title: `Failed URLs:`,
                value: `${this.failedUrls}`,
                short: false,
              },
            ],
          },
        ],
        channel: this.channel,
      });

      console.log("Message posted!");
    } catch (error) {
      console.log(error);
    }
  };

  resolveTest(): void {
    if (this.result.failed) {
      console.log(config.slack.errorMsg);
      process.exitCode = 1;
    } else {
      console.log(config.slack.succMsg);
    }
  }
}

const reporter = new Reporter();

reporter
  .getResult()
  .then((res) => reporter.postResult(res))
  .finally(() => reporter.resolveTest());
