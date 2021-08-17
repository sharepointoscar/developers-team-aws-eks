import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws";
import {KubernetesProvider, Deployment, Service, Namespace } from "@cdktf/provider-kubernetes";
class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new AwsProvider(this, 'aws', {
      region: 'us-east-1'
    });



    new KubernetesProvider(this, "kind", {configPath:"~/.kube/config"});

    const exampleNamespace = new Namespace(this, "tf-cdk-example", {
      metadata: [
        {
          name: "tf-cdk-example",
        },
      ],
    });

    const app = "nginx-example";
    new Deployment(this, "nginx-deployment", {
      metadata: [
        {
          name: app,
          namespace: exampleNamespace.metadata[0].name,
          labels: {
            app,
          },
        }
      ],
      spec: [
        {
          replicas: "2",
          selector: [
            {
              matchLabels: {
                app,
              },
            },
          ],
          template: [
            {
              metadata: [
                {
                  labels: {
                    app,
                  },
                },
              ],
              spec: [
                {
                  container: [
                    {
                      image: "nginx:1.7.8",
                      name: "example",
                      port: [
                        {
                          containerPort: 80,
                        },
                      ],
                      resources: [
                        {
                          limits: {
                            
                              cpu: "0.5",
                              memory: "512Mi",
                            
                          },
                          requests: 
                            {
                              cpu: "250m",
                              memory: "50Mi",
                            },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    new Service(this, "nginx-service", {
      metadata: [
        {
          name: app

        },
      ],
      spec: [
        {
          selector: {
            app,
          },
          port: [
            {
              nodePort: 30201,
              port: 80,
              targetPort: "80",
            },
          ],
          type: "NodePort",
        },
      ],
    });
  }
}

const app = new App();
new MyStack(app, "developers-team-aws-eks");
app.synth();
