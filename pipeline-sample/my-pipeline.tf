# For reference purposes only. Your pipeline requirements may vary.
resource "aws_codepipeline" "my-pipeline" {
  name     = "my-pipeline"
  role_arn = "my-codepipeline-arn-role"

  artifact_store {
    location = "s3://my-s3-bucket"
    type     = "S3"
  }

  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeStarSourceConnection"
      version          = "1"
      output_artifacts = ["SourceArtifact"]
      namespace        = "SourceVariables"

      # You need to create your own CodePipeline connection to your GitHub account
      configuration = {
        ConnectionArn    = "my-code-star-arn"
        FullRepositoryId = "myorg/my-repo"
        BranchName       = "main"
      }
    }
  }

  stage {
    name = "Deploy"

    action {
      name             = "Deploy"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["SourceArtifact"]
      output_artifacts = ["BuildArtifact"]
      version          = "1"
      namespace        = "BuildVariables"

      configuration = {
        ProjectName = aws_codebuild_project.build-docker-ecr-ts.name
        EnvironmentVariables = jsonencode([
          {
            name  = "myvar"
            value = "myval"
            type  = "PLAINTEXT"
          }
        ])
      }
    }
  }
}

resource "aws_codestarnotifications_notification_rule" "my-pipeline" {
  detail_type = "BASIC"
  event_type_ids = [
    "codepipeline-pipeline-pipeline-execution-failed",
    "codepipeline-pipeline-pipeline-execution-canceled",
    "codepipeline-pipeline-pipeline-execution-started",
    "codepipeline-pipeline-pipeline-execution-resumed",
    "codepipeline-pipeline-pipeline-execution-succeeded",
    "codepipeline-pipeline-pipeline-execution-superseded"
  ]

  name     = "my-pipeline-notifs"
  resource = aws_codepipeline.my-pipeline.arn

  target {
    type    = "SNS"
    address = "arn:aws:sns:ap-southeast-1:xxxxxxxxxxxx:my-sns-topic"
  }
}

