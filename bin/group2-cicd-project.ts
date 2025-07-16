#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Group2CicdProjectStack } from '../lib/group2-cicd-project-stack';
import { PipelineStack } from '../lib/pipeline-stack'; // Import pipeline stack

const app = new cdk.App();

// Add tags to all resources in the app
cdk.Tags.of(app).add('supnum:Group', 'GROUP-21017-21042-21056-21063');
cdk.Tags.of(app).add('supnum:Lab', 'PROJET-2');

// Set environment explicitly using default CLI config
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// Deploy your Lambda/API Gateway stack (application)
new Group2CicdProjectStack(app, 'Group2CicdProjectStack', {
  env,
});

// Deploy the pipeline
new PipelineStack(app, 'Group2PipelineStack', {
  env,
});
