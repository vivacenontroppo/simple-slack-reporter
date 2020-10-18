import { CommonConfig } from './common.config.repo';
import WDIOReporter from '@wdio/reporter';
const { WebClient } = require('@slack/web-api');
const cc = new CommonConfig();
const token = process.env.SLACK_TOKEN;
interface Result {
  title: string;
  status: number;
  color: string;
  description: string[];
  succ: string[];
  fails: string[];
  time: string;
  totalTime: number;
}
// do not try to fix next line, only this type of export works here:
module.exports = class CustomReporter extends WDIOReporter {
  channel: string;
  authToken: string;
  result: Result;
  slackApp: any;

  constructor(options) {
    super(options);
    this.authToken = token;
    this.channel = cc.slack.channel
    this.slackApp = new WebClient(this.authToken);
    this.result = {
      title: '',
      status: 0,
      color: '',
      description: [],
      succ: [],
      fails: [],
      time: '',
      totalTime: 0,
    };
  }

  formatTime(ms) {
    return new Date(ms).toISOString().slice(11, -1);
  }

  sendShorMsg = (msg): void => {
    try {
      this.slackApp.chat.postMessage({
        text: `\n ${msg}`,
        icon_emoji: ':clipboard:',
        channel: this.channel,
      });

      console.log('Message posted!');
    } catch (error) {
      console.log(error);
    }
  };

  postResultSucc = (res: Result): void => {
    try {
      this.slackApp.chat.postMessage({
        text: `:package: *package:*\n Suit name: ${res.title}`,
        icon_emoji: ':clipboard:',
        attachments: [
          {
            color: res.color,
            fields: [
              {
                title: ':hourglass:*Time:*',
                value: `${res.time}`,
                short: true,
              },
              {
                title: `Successful tests:`,
                value: ` ${res.succ}`,
                short: false,
              },
            ],
          },
        ],
        channel: this.channel,
      });

      console.log('Message posted!');
    } catch (error) {
      console.log(error);
    }
  };

  postResultFail = (res: Result): void => {
    try {
      this.slackApp.chat.postMessage({
        text: `:package: *package:*\n Suit name: ${res.title}`,
        icon_emoji: ':clipboard:',
        attachments: [
          {
            color: res.color,
            fields: [
              {
                title: ':hourglass:*Time:*',
                value: `${res.time}`,
                short: true,
              },
              {
                title: `Successful tests:`,
                value: ` ${res.succ}`,
                short: false,
              },
              {
                title: `Failed tests:`,
                value: ` ${res.fails}`,
                short: false,
              },
              {
                title: ':memo:*Errors description:*',
                value: `${res.description}\n`,
                short: true,
              },
            ],
          },
        ],
        channel: this.channel,
      });

      console.log('Message posted!');
    } catch (error) {
      console.log(error);
    }
  };

  onSuiteStart(suite) {
    this.result.title = suite.fullTitle;
    this.result.status = 0;
    this.result.color = ' ';
    this.result.description = [];
    this.result.succ = [];
    this.result.fails = [];
    this.result.time = ' ';
  }

  onTestPass(test) {
    this.result.succ.push(`\n:heavy_check_mark: ${test.title}`);
  }
  onTestFail(test) {
    this.result.fails.push(`:x: ${test.title}`);
    this.result.description.push(`\n${test.error.message}`);
    this.result.status = 1;
  }
  onSuiteEnd(suite) {
    const time = this.formatTime(suite.duration);
    this.result.time = `${time}`;
    this.result.totalTime += suite.duration;
    this.result.status === 1 ? (this.result.color = cc.slack.failColor) : (this.result.color = cc.slack.succColor);
    console.log('Sending the result to slack...');
    if (this.result.status === 0) {
      this.postResultSucc(this.result);
    } else {
      this.postResultFail(this.result);
    }
  }
  onRunnerEnd() {
    const time = this.formatTime(this.result.totalTime);
    this.sendShorMsg(
      `:bar_chart: Total test time: ${time}\n :arrow_down: *package* test end. If failed you can see the report.\n :gitlab: Check the pipeline here: ${cc.slack.pipelinesUrl}`
    );
  }
};
