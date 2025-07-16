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

    const artifactBucket = new s3.Bucket(this, 'PipelineBucket');

    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    const githubToken = secretsmanager.Secret.fromSecretNameV2(this, 'GitHubToken', 'githubtoken');

    const pipeline = new codepipeline.Pipeline(this, 'Group2Pipeline', {
      pipelineName: 'group2-pipeline',
      artifactBucket: artifactBucket,
    });

    // Stage 1: Source
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.GitHubSourceAction({
          actionName: 'GitHub_Source',
          owner: 'Aicha-Fadel', // replace with your GitHub username
          repo: 'group2-cicd-project', // replace with your GitHub repo
          oauthToken: githubToken.secretValue,
          output: sourceOutput,
          branch: 'master',
        }),
      ],
    });

    // Stage 2: Build
    const buildProject = new codebuild.PipelineProject(this, 'LambdaBuildProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
      },
    });

    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Lambda_Build',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // Stage 3: Deploy (CDK deploy of Lambda/API Gateway via CloudFormation)
    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.CloudFormationCreateUpdateStackAction({
          actionName: 'CDK_Deploy',
          stackName: 'Group2LambdaStack',
          templatePath: buildOutput.atPath('group2-cicd-project.template.json'),
          adminPermissions: true,
        }),
      ],
    });
  }
}
