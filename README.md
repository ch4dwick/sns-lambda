# AWS CodePipeline to SNS Notification Processor using TypeScript

## Purpose

When you use a CodePipeline notification rule to an SNS Topic, the resulting e-mail is a raw JSON message that can be hard to read. After reading through some documentation about the theory and recommendations of this use case, I figured it would be nice to format that message to be more readable as well as brush up on TypeScript.

This project takes the concepts described [here](https://docs.aws.amazon.com/lambda/latest/dg/with-sns-example.html#with-sns-create-subscription) and [here](https://docs.aws.amazon.com/systems-manager/latest/userguide/ps-integration-lambda-extensions.html).

I realized at the time of this writing that there were next to no viable real-life examples of SNS to CodePipeline online.

## Requirements and Assumptions

- SAM CLI v1.105.0
- Permission to deploy lambda functions with SAM.
- For parameter store access you only need arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess.
- [Parameter Store Integration with AWS Lambda](https://docs.aws.amazon.com/systems-manager/latest/userguide/ps-integration-lambda-extensions.html) (Already included in template.yaml)
- The incoming source event is CodePipeline. You may need to tweak the fields in processMessageAsync() to match the structure of the source event.
- A compatible Lambda Execution Role (included in the template)
- Existing SNS Topic used by a [CodePipeline notification rule](https://docs.aws.amazon.com/codepipeline/latest/userguide/notification-rule-create.html).
- SendGrid API key as a SecureString in the Parameter Store named SENDGRID_KEY. It must be in the same region of the Lambda Function. You don't need to use SendGrid to get this function to work. You can use your APIs or even forward the formatted result to another SNS topic. You can even simpliy use CloudWatch. This is more of a proof-of-concept for me.

## Build

After tweaking this project to your liking you should be able to do the usual at the project's root folder:

```bash
sam build && sam deploy --stack-name sns-lambda
```
