import { CommonConfig } from './common.config.repo';
const { WebClient } = require('@slack/web-api');
const fs = require('fs');
const token = process.env.SLACK_TOKEN;
const cc = new CommonConfig();
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
  result: Result;
  slackApp: any;
  specReport: string[];
  indexSpec: number;
  indexEdnSpec: number;
  indexGeneralInfo: number;
  indexTime: number;
  testsSummaryString: string;
  generalInfoString: string;
  time: string;
  sumarryArr: string[];
  succ: string[];
  fails: string[];
  // TODO:
  // HTMLreport: File;

  constructor() {
    this.authToken = token;
    this.channel = cc.slack.channel;
    this.logInfo = cc.slack.logInfo;
    this.file = fs.readFileSync(this.logInfo[0], this.logInfo[1]);
    this.logArray = this.file.split(/\n/);
    this.slackApp = new WebClient(this.authToken);
    this.fails = [];
    this.succ = [];
    this.indexSpec = this.file.search(`"spec" Reporter:`);
    this.indexEdnSpec = this.file.search(`passing`);
    this.indexGeneralInfo = this.file.search(`Spec Files:`);
    this.indexTime = this.file.search(`completed\\) in`);
    this.testsSummaryString = this.file.substring(this.indexSpec, this.indexEdnSpec);
    this.generalInfoString = this.file.substring(this.indexGeneralInfo, this.indexTime + 10);
    this.time = this.file.substring(this.indexTime + 13, this.indexTime + 23);
    this.sumarryArr = this.testsSummaryString.split(/\n/);
  }

  getResult = async (): Promise<Result> => {
    if (this.generalInfoString.includes('failed')) {
      this.sumarryArr.forEach((el) => {
        if (el.includes('✖ should')) {
          this.fails.push(el.replace(/ *\[[^\]]*]/, ''));
        } else if (el.includes('✓ should')) {
          this.succ.push(el.replace(/ *\[[^\]]*]/, ''));
        }
      });
      return (this.result = {
        title: 'Test failed!',
        failed: true,
        color: '#DC143C',
        description: `${this.generalInfoString}`,
      });
    } else if (!this.generalInfoString.includes('failed') && this.file.includes('npm ERR!')) {
      return (this.result = {
        title: 'Process crashed, test run failed!',
        failed: true,
        color: '#eb349e',
        description: 'There is no meaningful result in log file! Please check the pipeline and run test again.',
      });
    } else {
      this.sumarryArr.forEach((el) => {
        if (el.includes('✖ should')) {
          this.fails.push(el.replace(/ *\[[^\]]*]/, ''));
        } else if (el.includes('✓ should')) {
          this.succ.push(el.replace(/ *\[[^\]]*]/, ''));
        }
      });
      return (this.result = {
        title: 'Test success!',
        failed: false,
        color: '#048a04',
        description: `${this.generalInfoString}`,
      });
    }
  };

  postResult = async (res: Result): Promise<void> => {
    try {
      await this.slackApp.chat.postMessage({
        text: `:package: *Exit-com-e2e:*\n`,
        icon_emoji: ':clipboard:',
        attachments: [
          {
            color: res.color,
            fields: [
              {
                title: ':question:*Test outcome:*',
                value: `--- *${res.title}* ---\n`,
                short: true,
              },
              {
                title: ':memo:*Description:*',
                value: `${res.description}\n`,
                short: true,
              },
              {
                title: ':hourglass:*Time:*',
                value: `${this.time}`,
                short: true,
              },
              {
                title: ':bar_chart:For more info see the log: ',
                value: cc.slack.pipelinesUrl,
                short: false,
              },
              {
                title: `Successful tests:`,
                value: ` ${this.succ.toString().replace(/✓/g, '\n✓')}`,
                short: false,
              },
              {
                title: `Failed tests:`,
                value: ` ${this.fails.toString().replace(/✖/g, '\n✖')}`,
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

  resolveTest(): void {
    if (this.result.failed) {
      throw new Error(cc.slack.errorMsg);
    } else {
      console.log(cc.slack.succMsg);
    }
  }
}

const reporter = new Reporter();

reporter
  .getResult()
  .then((res) => reporter.postResult(res))
  .finally(() => reporter.resolveTest());
