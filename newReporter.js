const { WebClient } = require("@slack/web-api");
const fs = require("fs");

// An access token for gitlab CI safe token:
//const token = process.env.SLACK_TOKEN;

const token = "xoxb-221114625218-1350157923462-3Rubez2y2IH84Sez51d3cNNx";
const channel = "C01A7EY7A9G";
const logInfo = ["./testLogs/fLog.txt", "UTF-8"];

class Reporter {
  constructor([path, coding], token, channel, testsPerformed) {
    this.result = {};
    this.testsPerformed = testsPerformed;
    this.authToken = token;
    this.web = new WebClient(this.authToken);
    this.channel = channel;
    this.path = path;
    this.coding = coding;
    this.file = fs.readFileSync(this.path, this.coding);
    this.logArray = this.file.split(/\n/);
    this.failedUrls = [];
  }

  getResult = () => {
    if (this.file.includes("CHECK")) {
      this.listFails = this.logArray.forEach((element) => {
        element.includes("CHECK")
          ? this.failedUrls.push(
              element.replace(` - \u001b[35m CHECK NEEDED! \u001b[0m`, "\n")
            )
          : [];
      });
      return (this.result = {
        title: "Test failed!",
        status: "fail",
        color: "#DC143C",
        description: "All provided URL's are safe.",
      });
    } else {
      return (this.result = {
        title: "Test success!",
        status: "succ",
        color: "#048a04",
        description:
          "There are some URL's that have catalog / file indexing on.",
      });
    }
  };

  postResult = async () => {
    try {
      await this.web.chat.postMessage({
        text: `:package: *Directory / file indexing test:*\n.`,
        icon_emoji: ":clipboard:",
        attachments: [
          {
            color: this.result.color,
            fields: [
              {
                title: ":question:*Test outcome:*",
                value: `--- *${this.result.title}* ---\n`,
                short: true,
              },
              {
                title: ":card_file_box:*Type:*",
                value: `Standard everyday check.\n.\n`,
                short: true,
              },
              {
                title: ":hourglass:*Time:*",
                value: `<10 sec\n.`,
                short: true,
              },
              {
                title: ":bar_chart:For more info see the log: ",
                value:
                  "https://gitlab.lim.bz/dev/directory-indexing-check/-/jobs",
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
        channel: channel,
      });

      console.log("Message posted!");
    } catch (error) {
      console.log(error);
    }
  };
}

const reporter = new Reporter(logInfo, token, channel);
reporter.getResult();
reporter.postResult();
