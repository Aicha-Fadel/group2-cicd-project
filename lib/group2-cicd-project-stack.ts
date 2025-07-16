import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class Group2CicdProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the Lambda function
    const group2Lambda = new lambda.Function(this, 'Group2Lambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'), // directory with your lambda/index.js
    });

    // Define the API Gateway to trigger the Lambda
    new apigateway.LambdaRestApi(this, 'Group2API', {
      handler: group2Lambda,
      proxy: true,
    });
  }
}

