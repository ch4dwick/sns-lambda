terraform {
  backend "s3" {
    bucket = "my-tf-bucket"
    key    = "terraform/my-pipeline"
    region = "ap-southeast-1"

  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.19.0"
    }
  }

  required_version = ">= 1.5.7"
}

provider "aws" {
  region = "ap-southeast-1"
}
