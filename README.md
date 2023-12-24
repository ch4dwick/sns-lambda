# AWS CodePipeline to SNS Notification Processor using TypeScript

## Purpose

When you connect a CodePipeline notification to an SNS Topic the resulting e-mail is a raw unreadable JSON message that can be hard to read. I figured it would be nice to format that message to be more readable.

This project takes the concepts described [here](https://docs.aws.amazon.com/lambda/latest/dg/with-sns-example.html#with-sns-create-subscription) and [here](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html).

I realized at the time of this writing that there were next to no viable examples of SNS to CodePipeline online.

## Requirements and Assumptions

- SAM CLI v1.105.0
- Permission to deploy lambda functions with SAM.
- For parameter store access you only need arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess.
- [Parameter Store Integration with AWS Lambda](https://docs.aws.amazon.com/systems-manager/latest/userguide/ps-integration-lambda-extensions.html) (Already included in template.yaml)
- The incoming source event is CodePipeline. You may need to tweak the fields in processMessageAsync() to match the structure of the source event.
- A compatible Lambda Execution Role (included in the template)
- Existing SNS Topic used by a [CodePipeline notification rule](https://docs.aws.amazon.com/codepipeline/latest/userguide/notification-rule-create.html).
- SendGrid account with a key named SENDGRID_KEY stored in the same region of the Lambda Function. You don't need to use SendGrid to get this function to work. You can use your APIs or even forward the formatted result to another SNS topic. This is more of a proof-of-concept for me.
