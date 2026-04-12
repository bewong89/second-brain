import { App } from 'aws-cdk-lib';
import { SecondBrainStack } from '../lib/composition-stack.js';

const app = new App();

new SecondBrainStack(app, 'SecondBrain', {
  description: 'Second Brain knowledge management system infrastructure',
});

app.synth();
