import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //  Artifact bucket
    const artifactBucket = new s3.Bucket(this, 'PipelineBucket');

    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const cdkBuildOutput = new codepipeline.Artifact('CdkBuildOutput');

    //  Get GitHub token from Secrets Manager
    const githubToken = secretsmanager.Secret.fromSecretNameV2(
      this,
      'GitHubToken',
      'githubtoken'
    );

    //  Define the pipeline
    const pipeline = new codepipeline.Pipeline(this, 'Group2Pipeline', {
      pipelineName: 'group2-pipeline',
      artifactBucket: artifactBucket,
    });

    //  Stage 1: Source
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.GitHubSourceAction({
          actionName: 'GitHub_Source',
          owner: 'Aicha-Fadel',
          repo: 'group2-cicd-project',
          oauthToken: githubToken.secretValue,
          output: sourceOutput,
          branch: 'master',
        }),
      ],
    });

    //  Stage 2: Build - CDK synth
    const cdkBuild = new codebuild.PipelineProject(this, 'CdkBuildProject', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: 18,
            },
            commands: [
              'npm install -g aws-cdk',
              'npm install',
            ],
          },
          build: {
            commands: [
              'npm run build || echo "No build script defined"',
              // Generate the template file in cdk.out
              'mkdir -p cdk.out',
              'cdk synth Group2CicdProjectStack > cdk.out/group2-cicd-project.template.json',
            ],
          },
        },
        artifacts: {
          'base-directory': 'cdk.out',
          files: ['group2-cicd-project.template.json'],
        },
      }),
    });

    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'CDK_Build',
          project: cdkBuild,
          input: sourceOutput,
          outputs: [cdkBuildOutput],
        }),
      ],
    });

    //  Stage 3: Deploy
    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.CloudFormationCreateUpdateStackAction({
          actionName: 'CFN_Deploy',
          stackName: 'Group2CicdProjectStack',
          templatePath: cdkBuildOutput.atPath('group2-cicd-project.template.json'),
          adminPermissions: true,
        }),
      ],
    });
  }
}
