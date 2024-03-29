# AWS CodePipeline / CodeBuild to SNS Notification Processor using TypeScript

## Purpose

When you use a CodePipeline/CodeBuild notification rule to an SNS Topic, the resulting e-mail is a raw JSON message that is too verbose and can be hard to read. After reading through some documentation about the theory and recommendations of this use case, I figured it would be nice to format that message to be more readable as well as brush up on TypeScript.

This project takes the concepts described [here](https://docs.aws.amazon.com/lambda/latest/dg/with-sns-example.html#with-sns-create-subscription) and [here](https://docs.aws.amazon.com/systems-manager/latest/userguide/ps-integration-lambda-extensions.html).

I realized at the time of this writing that there were next to no viable real-life examples of SNS to CodePipeline online and, least of all, no TypeScript.

## Requirements and Assumptions

- SAM CLI v1.105.0
- Permission to deploy lambda functions with SAM.
- For parameter store access you only need arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess.
- The incoming source event is CodePipeline. You may need to tweak the fields in processMessageAsync() to match the structure of the source event. Sample pipeline in [pipeline-sample](pipeline-sample/my-pipeline.tf)
- A compatible Lambda Execution Role (included in the template)
- Existing SNS Topic used by a [CodePipeline notification rule](https://docs.aws.amazon.com/codepipeline/latest/userguide/notification-rule-create.html). Sample rule in [pipeline-sample](pipeline-sample/my-pipeline.tf)
- SendGrid API key as a SecureString in the Parameter Store named SENDGRID_KEY. It must be in the same region of the Lambda Function. You don't need to use SendGrid to get this function to work. You can use your APIs or even forward the formatted result to another SNS topic. You can even simpliy use CloudWatch. This is more of a proof-of-concept for me.

## Build

After tweaking this project to your liking you should be able to do the usual at the project's root folder:

```bash
sam build && sam deploy --stack-name sns-lambda
```

## Sample payloads from CodePipeline for testing the lambda function:

Use the SNS Test Template and insert the test data below under Records[].Sns.Message field. Keep the data enclosed in quotes and escape the json quotes.

> "Message": "{\\"account\\": \\"xxxxxxxxxxxx\\"}"

You can also test it directly by Publishing a message to your SNS Topic with the payloads below as the body.

### Start Execution from manual trigger

```json
{
  "account": "xxxxxxxxxxxx",
  "detailType": "CodePipeline Pipeline Execution State Change",
  "region": "ap-southeast-1",
  "source": "aws.codepipeline",
  "time": "2023-12-24T03:09:27Z",
  "notificationRuleArn": "arn:aws:codestar-notifications:ap-southeast-1:xxxxxxxxxxxx:notificationrule/abcdefg",
  "detail": {
    "pipeline": "my-pipeline",
    "execution-id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "execution-trigger": {
      "trigger-type": "StartPipelineExecution",
      "trigger-detail": "arn:aws:sts::xxxxxxxxxxxx:assumed-role/AWSReservedSSO_AdministratorAccess_xxxxx/user@host.com"
    },
    "start-time": "2023-12-24T03:09:27.801Z",
    "state": "STARTED",
    "version": 3.0,
    "pipeline-execution-attempt": 1.0
  },
  "resources": ["arn:aws:codepipeline:ap-southeast-1:xxxxxxxxxxxx:my-pipeline"],
  "additionalAttributes": {}
}
```

### Pipeline completion scenario from manual execution

```json
{
  "account": "xxxxxxxxxxxx",
  "detailType": "CodePipeline Pipeline Execution State Change",
  "region": "ap-southeast-1",
  "source": "aws.codepipeline",
  "time": "2023-12-24T04:01:06Z",
  "notificationRuleArn": "arn:aws:codestar-notifications:ap-southeast-1:xxxxxxxxxxxx:notificationrule/abcdefg",
  "detail": {
    "pipeline": "my-pipeline",
    "execution-id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "start-time": "2023-12-24T03:58:54.634Z",
    "state": "SUCCEEDED",
    "version": 3.0,
    "pipeline-execution-attempt": 1.0
  },
  "resources": ["arn:aws:codepipeline:ap-southeast-1:xxxxxxxxxxxx:my-pipeline"],
  "additionalAttributes": {}
}
```

### Pipeline execution from GitHub

```json
{
  "account": "xxxxxxxxxxxx",
  "detailType": "CodePipeline Pipeline Execution State Change",
  "region": "ap-southeast-1",
  "source": "aws.codepipeline",
  "time": "2023-12-20T11:13:23Z",
  "notificationRuleArn": "arn:aws:codestar-notifications:ap-southeast-1:xxxxxxxxxxxx:notificationrule/abcdefg",
  "detail": {
    "pipeline": "my-pipeline",
    "execution-id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "execution-trigger": {
      "trigger-type": "Webhook",
      "trigger-detail": "arn:aws:codestar-connections:ap-southeast-1:xxxxxxxxxxxx:connection/abcdefg"
    },
    "start-time": "2023-12-20T11:13:23.742Z",
    "state": "STARTED",
    "version": 2.0,
    "pipeline-execution-attempt": 1.0
  },
  "resources": ["arn:aws:codepipeline:ap-southeast-1:xxxxxxxxxxxx:my-pipeline"],
  "additionalAttributes": {}
}
```

### Pipeline Completion from Github

```json
{
  "account": "xxxxxxxxxxxx",
  "detailType": "CodePipeline Pipeline Execution State Change",
  "region": "ap-southeast-1",
  "source": "aws.codepipeline",
  "time": "2023-12-20T11:14:33Z",
  "notificationRuleArn": "arn:aws:codestar-notifications:ap-southeast-1:xxxxxxxxxxxx:notificationrule/abcdefg",
  "detail": {
    "pipeline": "my-pipeline",
    "execution-id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "start-time": "2023-12-20T11:13:23.742Z",
    "execution-trigger": {
      "author-display-name": "Github User",
      "full-repository-name": "my-org/my-repo",
      "provider-type": "GitHub",
      "author-email": "user@host.com",
      "branch-name": "main",
      "commit-message": "Commit notes",
      "author-date": "2023-12-20T11:13:20Z",
      "commit-id": "abcdefg",
      "connection-arn": "arn:aws:codestar-connections:ap-southeast-1:xxxxxxxxxxxx:connection/abcdefg",
      "author-id": "github-user"
    },
    "state": "FAILED",
    "version": 2.0,
    "pipeline-execution-attempt": 1.0
  },
  "resources": ["arn:aws:codepipeline:ap-southeast-1:xxxxxxxxxxxx:my-pipeline"],
  "additionalAttributes": {}
}
```

### CodeBuild Succeeded

```json
{
  "account": "xxxxx",
  "detailType": "CodeBuild Build State Change",
  "region": "ap-southeast-1",
  "source": "aws.codebuild",
  "time": "2024-01-11T15:28:24Z",
  "notificationRuleArn": "arn:aws:codestar-notifications:ap-southeast-1:xxxxx:notificationrule/xxxxxx",
  "detail": {
    "build-status": "SUCCEEDED",
    "project-name": "my-build",
    "build-id": "arn:aws:codebuild:ap-southeast-1:xxxx:build/my-build:xxxxx",
    "additional-information": {
      "cache": {
        "location": "s3-cache/cache",
        "type": "S3"
      },
      "build-number": 3,
      "timeout-in-minutes": 15,
      "build-complete": true,
      "initiator": "GitHub-Hookshot/xxxxx",
      "build-start-time": "Jan 11, 2024 3:25:27 PM",
      "source": {
        "report-build-status": false,
        "location": "https://github.com/ch4dwick/sns-lambda.git",
        "git-clone-depth": 1,
        "type": "GITHUB",
        "git-submodules-config": {
          "fetch-submodules": false
        }
      },
      "source-version": "xxxxx",
      "artifact": {
        "md5sum": "xxxx",
        "sha256sum": "xxxx",
        "location": "arn:aws:s3:::s3-bucket/my-artifact"
      },
      "environment": {
        "image": "aws/codebuild/amazonlinux2-x86_64-standard:corretto8",
        "privileged-mode": true,
        "image-pull-credentials-type": "CODEBUILD",
        "compute-type": "BUILD_GENERAL1_MEDIUM",
        "type": "LINUX_CONTAINER"
      },
      "logs": {
        "group-name": "codebuild",
        "stream-name": "my-build/my-stream",
        "deep-link": "https://console.aws.amazon.com/cloudwatch/home?region=ap-southeast-1#logsV2:log-groups/log-group/my-build/log-events/my-code$252F5986d724-0575-4f15-9cc8-0fb5cd4b2fb7"
      },
      "phases": [
        {
          "phase-context": [],
          "start-time": "Jan 11, 2024 3:25:27 PM",
          "end-time": "Jan 11, 2024 3:25:27 PM",
          "duration-in-seconds": 0,
          "phase-type": "SUBMITTED",
          "phase-status": "SUCCEEDED"
        },
        {
          "phase-context": [],
          "start-time": "Jan 11, 2024 3:25:27 PM",
          "end-time": "Jan 11, 2024 3:25:28 PM",
          "duration-in-seconds": 0,
          "phase-type": "QUEUED",
          "phase-status": "SUCCEEDED"
        },
        {
          "phase-context": [": "],
          "start-time": "Jan 11, 2024 3:25:28 PM",
          "end-time": "Jan 11, 2024 3:25:56 PM",
          "duration-in-seconds": 28,
          "phase-type": "PROVISIONING",
          "phase-status": "SUCCEEDED"
        },
        {
          "phase-context": [": "],
          "start-time": "Jan 11, 2024 3:25:56 PM",
          "end-time": "Jan 11, 2024 3:26:12 PM",
          "duration-in-seconds": 16,
          "phase-type": "DOWNLOAD_SOURCE",
          "phase-status": "SUCCEEDED"
        },
        {
          "phase-context": [": "],
          "start-time": "Jan 11, 2024 3:26:12 PM",
          "end-time": "Jan 11, 2024 3:26:12 PM",
          "duration-in-seconds": 0,
          "phase-type": "INSTALL",
          "phase-status": "SUCCEEDED"
        },
        {
          "phase-context": [": "],
          "start-time": "Jan 11, 2024 3:26:12 PM",
          "end-time": "Jan 11, 2024 3:26:33 PM",
          "duration-in-seconds": 20,
          "phase-type": "PRE_BUILD",
          "phase-status": "SUCCEEDED"
        },
        {
          "phase-context": [": "],
          "start-time": "Jan 11, 2024 3:26:33 PM",
          "end-time": "Jan 11, 2024 3:27:59 PM",
          "duration-in-seconds": 86,
          "phase-type": "BUILD",
          "phase-status": "SUCCEEDED"
        },
        {
          "phase-context": [": "],
          "start-time": "Jan 11, 2024 3:27:59 PM",
          "end-time": "Jan 11, 2024 3:28:22 PM",
          "duration-in-seconds": 23,
          "phase-type": "POST_BUILD",
          "phase-status": "SUCCEEDED"
        },
        {
          "phase-context": [": "],
          "start-time": "Jan 11, 2024 3:28:22 PM",
          "end-time": "Jan 11, 2024 3:28:23 PM",
          "duration-in-seconds": 0,
          "phase-type": "UPLOAD_ARTIFACTS",
          "phase-status": "SUCCEEDED"
        },
        {
          "phase-context": [": "],
          "start-time": "Jan 11, 2024 3:28:23 PM",
          "end-time": "Jan 11, 2024 3:28:23 PM",
          "duration-in-seconds": 0,
          "phase-type": "FINALIZING",
          "phase-status": "SUCCEEDED"
        },
        {
          "start-time": "Jan 11, 2024 3:28:23 PM",
          "phase-type": "COMPLETED"
        }
      ],
      "queued-timeout-in-minutes": 480
    },
    "current-phase": "COMPLETED",
    "current-phase-context": "[: ]",
    "version": "1"
  },
  "resources": ["arn:aws:codebuild:ap-southeast-1:xxxxx:build/my-build:xxxxx"],
  "additionalAttributes": {}
}
```
