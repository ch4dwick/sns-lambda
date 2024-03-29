import { SNSEvent, SNSHandler, SNSEventRecord, Context } from 'aws-lambda';
import { sendMail } from './mailer';

export const lambdaHandler: SNSHandler = async (event: SNSEvent, context: Context): Promise<void> => {
    try {
        for (const record of event.Records) {
            await processMessageAsync(record);
        }
    } catch (err) {
        console.log(err);
    }
};

async function processMessageAsync(record: SNSEventRecord): Promise<void> {
    try {
        const message: string = record.Sns.Message;
        const jsonMessage = JSON.parse(message);

        let emailMsg = '';

        // This code is only for CodePipeline executions
        if (jsonMessage.source !== 'aws.codepipeline') return;

        console.log(`Raw message: ${message}`);
        emailMsg =
            `<strong>Account:</strong> ${jsonMessage.account}<br/>\r\n` +
            `<strong>Region:</strong> ${jsonMessage.region}<br/>\r\n` +
            `<strong>State:</strong> ${jsonMessage.detail.state}<br/>\r\n` +
            `<strong>Time:</strong> ${jsonMessage.detail['start-time']}<br/>\r\n` +
            `<strong>Pipeline:</strong> ${jsonMessage.detail.pipeline}<br/>\r\n` +
            `<strong>Execution ID:</strong> ${jsonMessage.detail['execution-id']}<br/>\r\n`;

        // These fields are only available post-build and only available after GitHub push event.
        // A release change will not contain these data.
        if (jsonMessage.detail['execution-trigger']) {
            if (jsonMessage.detail['execution-trigger']['trigger-type']) {
                emailMsg = emailMsg.concat(
                    `<strong>Trigger Type:</strong> ${jsonMessage.detail['execution-trigger']['trigger-type']}<br/>\r\n` +
                        `<strong>Trigger Detail:</strong> ${jsonMessage.detail['execution-trigger']['trigger-detail']}<br/>\r\n`,
                );
            } else {
                emailMsg = emailMsg.concat(
                    `<strong>Author:</strong> ${jsonMessage.detail['execution-trigger']['author-display-name']}<br/>\r\n` +
                        `<strong>Email:</strong> ${jsonMessage.detail['execution-trigger']['author-email']}<br/>\r\n` +
                        `<strong>Repository:</strong> ${jsonMessage.detail['execution-trigger']['full-repository-name']}<br/>\r\n` +
                        `<strong>Branch:</strong> ${jsonMessage.detail['execution-trigger']['branch-name']}<br/>\r\n` +
                        `<strong>Commit Date:</strong> ${jsonMessage.detail['execution-trigger']['author-date']}<br/>\r\n` +
                        `<strong>Commit Message:</strong> ${jsonMessage.detail['execution-trigger']['commit-message']}<br/>\r\n`,
                );
            }
        }
        // Include aws logs tail command
        emailMsg = emailMsg.concat(
            '<hr>Follow in Cloudwatch:<br/>\r\n' +
                `<strong>node/typescript:</strong> aws logs tail payeah-codebuild --log-stream-name-prefix buildnodets/${jsonMessage.detail['execution-id']} --follow --since 1h<br/>\r\n` +
                `<strong>java maven:</strong> aws logs tail payeah-codebuild --log-stream-name-prefix build-docker-ecr-maven/${jsonMessage.detail['execution-id']} --follow --since 1h<br/>\r\n`,
        );
        await Promise.resolve(sendMail(jsonMessage.detail.state, jsonMessage.detail.pipeline, emailMsg)); //Placeholder for actual async work
    } catch (err) {
        console.error('An error occurred');
        throw err;
    }
}
