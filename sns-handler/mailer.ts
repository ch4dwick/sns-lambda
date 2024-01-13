import mail, { ResponseError } from '@sendgrid/mail';
import { SSMClient, GetParameterCommand, GetParameterCommandOutput } from '@aws-sdk/client-ssm';

const statusZn = new Map<string, string>([
    ['STARTED', '已开始'],
    ['SUCCEEDED', '已成功'],
    ['FAILED', '失败'],
    ['RESUMED', '拒绝'],
    ['IN_PROGRESS', '进行中'],
    ['STOPPED', '停了下来'],
]);

export async function sendMail(status: string, subject: string, message: string): Promise<void> {
    status = status.concat(statusZn.get(status) ?? '');
    const msg: mail.MailDataRequired = {
        to: 'Developers <developer@github.com>',
        from: 'Deployment Alerts <no-reply@github.com>',
        subject: `${subject} ${status}`,
        html: message,
    };
    const ssmCommand = new GetParameterCommand({ WithDecryption: true, Name: 'SENDGRID_KEY:1' });
    const ssmClient = new SSMClient();
    const ssmRes: GetParameterCommandOutput = await ssmClient.send(ssmCommand);

    mail.setApiKey(ssmRes.Parameter?.Value ?? '');
    // console.log(`Generated Email Payload: ${JSON.stringify(msg)}`);
    await mail
        .send(msg)
        .then(() => {
            console.log('Email successful.');
        })
        .catch((err: Error) => {
            console.error(`Error: ${JSON.stringify(err, null, 2)}`);
        })
        .catch((err: ResponseError) => {
            console.error(`Error: ${JSON.stringify(err, null, 2)}`);

            if (err.response) {
                console.error(err.response.body);
            }
        });
}
