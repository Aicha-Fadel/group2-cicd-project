import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const artifactBucket = new s3.Bucket(this, 'PipelineBucket');

    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    // Correct reference to 'github-token'
    const githubToken = secretsmanager.Secret.fromSecretNameV2(this, 'GitHubToken', 'githubtoken');

    const pipeline = new codepipeline.Pipeline(this, 'Group2Pipeline', {
      pipelineName: 'group2-pipeline',
      artifactBucket: artifactBucket,
    });

    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.GitHubSourceAction({
          actionName: 'GitHub_Source',
          owner: 'Aicha-Fadel', // Replace with your GitHub username
          repo: 'group2-cicd-project', // Replace with your repo name
          oauthToken: githubToken.secretValue, // Correct usage
          output: sourceOutput,
          branch: 'master',
        }),
      ],
    });

    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Lambda_Build',
          project: new codebuild.PipelineProject(this, 'LambdaBuildProject', {
            environment: {
              buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
            },
          }),
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });
  }
}
