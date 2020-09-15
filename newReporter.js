const { WebClient } = require("@slack/web-api");

// An access token for gitlab CI safe token:
//const token = process.env.SLACK_TOKEN;

const token = "xoxb-221114625218-1350157923462-3Rubez2y2IH84Sez51d3cNNx";
const channel = "C01A7EY7A9G";

class Reporter {
  constructor(token, channel) {
    this.authToken = token;
    this.web = new WebClient(this.authToken);
    this.channel = channel;
  }
  postResult = async () => {
    try {
      await this.web.chat.postMessage({
        text: `:iphone: *Test performed*\n.`,
        icon_emoji: ":clipboard:",
        attachments: [
          {
            color: "#048a04",
            fields: [
              {
                title: ":question:*Test outcome:*",
                value: `*Fail or not fail*\n---`,
                short: true,
              },
              {
                title: ":card_file_box:*Type:*",
                value: `Test type\n---`,
                short: true,
              },
              {
                title: ":clipboard:*Tests performed:*",
                value: `List of tests`,
                short: true,
              },
              {
                title: ":hourglass:*Time:*",
                value: `120 minutes 50 seconds`,
                short: true,
              },
              {
                title:
                  ":arrow_up_down: For more info see the log file :arrow_up_down:",
                short: false,
              },
              {
                title: `Failed tests`,
                value: `- list of tests failed`,
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

const reporter = new Reporter(token, channel);
reporter.postResult();
