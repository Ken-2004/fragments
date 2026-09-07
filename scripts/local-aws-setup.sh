#!/bin/sh

# Setup steps for working with MiniStack and DynamoDB local instead of AWS.
# Assumes aws cli is installed and MiniStack and DynamoDB local are running.

set -e

# Intentionally fake credentials, used exclusively with local AWS emulators.
echo "Setting AWS environment variables for MiniStack"

echo "AWS_ACCESS_KEY_ID=test"
export AWS_ACCESS_KEY_ID=test

echo "AWS_SECRET_ACCESS_KEY=test"
export AWS_SECRET_ACCESS_KEY=test

# Ignore any real session token inherited from the host.
unset AWS_SESSION_TOKEN
export AWS_PAGER=""
AWS_S3_BUCKET_NAME=${AWS_S3_BUCKET_NAME:-fragments}
AWS_DYNAMODB_TABLE_NAME=${AWS_DYNAMODB_TABLE_NAME:-fragments}

export AWS_DEFAULT_REGION=us-east-1
echo "AWS_DEFAULT_REGION=us-east-1"

export AWS_REGION=us-east-1
echo "AWS_REGION=us-east-1"

# Wait for MiniStack to be ready, by inspecting the response from healthcheck
echo 'Waiting for MiniStack S3...'
until curl --silent http://localhost:4566/_ministack/health | grep -E '"s3": "(running|available)"' > /dev/null; do
  sleep 2
done
echo 'MiniStack S3 Ready'

# Create the local S3 bucket used by Compose.
echo "Creating MiniStack S3 bucket: $AWS_S3_BUCKET_NAME"
aws --endpoint-url=http://localhost:4566 \
  s3api create-bucket \
  --bucket "$AWS_S3_BUCKET_NAME"

# Make sure the S3 bucket can actually be accessed before continuing.
echo 'Waiting for MiniStack S3 bucket...'
until aws --endpoint-url=http://localhost:4566 \
  s3api head-bucket \
  --bucket "$AWS_S3_BUCKET_NAME" > /dev/null 2>&1; do
  sleep 2
done
echo 'MiniStack S3 Bucket Ready'

# Wait for DynamoDB Local to accept requests before creating the table.
echo 'Waiting for DynamoDB Local...'
until aws --endpoint-url=http://localhost:8000 \
  dynamodb list-tables > /dev/null 2>&1; do
  sleep 2
done
echo 'DynamoDB Local Ready'

echo "Creating DynamoDB Local table: $AWS_DYNAMODB_TABLE_NAME"
aws --endpoint-url=http://localhost:8000 \
  dynamodb create-table \
  --table-name "$AWS_DYNAMODB_TABLE_NAME" \
  --attribute-definitions \
    AttributeName=ownerId,AttributeType=S \
    AttributeName=id,AttributeType=S \
  --key-schema \
    AttributeName=ownerId,KeyType=HASH \
    AttributeName=id,KeyType=RANGE \
  --provisioned-throughput \
    ReadCapacityUnits=10,WriteCapacityUnits=5

# Wait until the metadata table is available.
aws --endpoint-url=http://localhost:8000 \
  dynamodb wait table-exists \
  --table-name "$AWS_DYNAMODB_TABLE_NAME"

echo 'Local DynamoDB table ready'
