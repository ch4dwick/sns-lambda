import { SNSEvent, SNSHandler, SNSEventRecord, Context } from 'aws-lambda';
import mail from '@sendgrid/mail';
import fetch, { Response } from 'node-fetch';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

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
        let emailMsg =
            `Account: ${jsonMessage.account}\r\n` +
            `Region: ${jsonMessage.region}\r\n` +
            `State: ${jsonMessage.detail.state}\r\n` +
            `Start Time: ${jsonMessage.detail['start-time']}\r\n` +
            `Pipeline: ${jsonMessage.detail.pipeline}\r\n` +
            `Execution ID: ${jsonMessage.detail['execution-id']}\r\n`;

        // These fields are only available post-build and only available after GitHub push event.
        // A release change will not contain these data.
        if (jsonMessage.detail['execution-trigger']) {
            if (jsonMessage.detail['execution-trigger']['trigger-type']) {
                emailMsg = emailMsg.concat(
                    `Trigger Type: ${jsonMessage.detail['execution-trigger']['trigger-type']}\r\n` +
                        `Trigger Detail: ${jsonMessage.detail['execution-trigger']['trigger-detail']}\r\n`,
                );
            } else {
                emailMsg = emailMsg.concat(
                    `Author: ${jsonMessage.detail['execution-trigger']['author-display-name']}\r\n` +
                        `Email: ${jsonMessage.detail['execution-trigger']['author-email']}\r\n` +
                        `Repository: ${jsonMessage.detail['execution-trigger']['full-repository-name']}\r\n` +
                        `Branch: ${jsonMessage.detail['execution-trigger']['branch-name']}\r\n` +
                        `Commit Date: ${jsonMessage.detail['execution-trigger']['author-date']}\r\n` +
                        `Commit Message: ${jsonMessage.detail['execution-trigger']['commit-message']}\r\n`,
                );
            }
        }
        await Promise.resolve(sendEmail(emailMsg)); //Placeholder for actual async work
    } catch (err) {
        console.error('An error occurred');
        throw err;
    }
}

async function sendEmail(message: string): Promise<void> {
    const msg: mail.MailDataRequired = {
        to: 'developer@payeah.io',
        from: 'no-reply@payeah.io',
        subject: 'CodePipeline Status Alerts',
        text: message,
    };
    const awsSessionToken = process.env.AWS_SESSION_TOKEN;
    const res: Response = await fetch(
        'http://localhost:2773/systemsmanager/parameters/get?name=SENDGRID_KEY&version=1&withDecryption=true',
        {
            method: 'GET',
            headers: {
                'X-Aws-Parameters-Secrets-Token': String(awsSessionToken),
            },
        },
    );

    // I do not recommend using res.json() as it returns an unknown type and is a lot more work than
    // dealing with text().
    const jsonRes = await res.text();
    const objRes = JSON.parse(jsonRes);

    mail.setApiKey(objRes.Parameter.Value.toString());
    await mail
        .send(msg)
        .then(() => {
            console.log('Email successful.');
        })
        .catch((err) => {
            console.error(err);

            if (err.response) {
                console.error(err.response.body);
            }
        });
}
