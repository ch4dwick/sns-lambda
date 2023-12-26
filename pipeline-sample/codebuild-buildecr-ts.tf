
resource "aws_codebuild_project" "build-docker-ecr-ts" {
  name          = "codebuild-sample"
  description   = "Sample Codebuild Project"
  build_timeout = "15"
  service_role  = "my-codebuild-arn-role"

  artifacts {
    type      = "S3"
    location  = "s3://my-s3-bucket"
    packaging = "ZIP"
    # Enable semantic versioning.
    # https://docs.aws.amazon.com/codebuild/latest/APIReference/API_ProjectArtifacts.html#CodeBuild-Type-ProjectArtifacts-overrideArtifactName
    override_artifact_name = true
  }

  cache {
    type     = "S3"
    location = "s3://my-s3-bucket/cache"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_MEDIUM"
    image                       = "aws/codebuild/standard:7.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
  }

  logs_config {
    cloudwatch_logs {
      group_name  = "codebuild"
      stream_name = "codebuild-sample"
    }

  }

  source {
    type      = "NO_SOURCE"
    buildspec = <<EOT
version: 0.2
phases:
  build:
    commands:
    - sam build && sam deploy --stack-name codebuild-sample
    on-failure: ABORT
EOT

  }

  source_version = "master"
}
