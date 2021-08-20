import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws";
import {KubernetesProvider, Deployment, Service, Ingress } from "@cdktf/provider-kubernetes";
class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new AwsProvider(this, 'aws', {
      region: 'us-west-2'
    });

    new KubernetesProvider(this, "kind", {configPath:"~/.kube/config"});

    // const appsNamespace = new Namespace(this, "apps", {
    //   metadata: [
    //     {
    //       name: "apps",
    //     },
    //   ],
    // });

    const app = "skiapp";
    new Deployment(this, "skiapp-deployment", {
      metadata: [
        {
          name: app,
          namespace: "default",
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
                      image: "sharepointoscar/skiapp:v1",
                      name: "skiapp",
                      port: [
                        {
                          containerPort: 8080,
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

    new Service(this, "skiapp-service", {
      metadata: [
        {
          name: app,
          namespace: "default"
        },
      ],
      spec: [
        {
          selector: {
            app,
          },
          port: [
            {
              port: 80,
              targetPort: "8080",
            },
          ],
          type: "NodePort",
        },
      ],
    });

    new Ingress(this,"skiapp-ingress", {
      metadata: [
        {
          name: app,
          namespace: "default",
          annotations:{
            "kubernetes.io/ingress.class": "alb",
            "alb.ingress.kubernetes.io/group.name": "finance",
            "alb.ingress.kubernetes.io/scheme": "internet-facing",
            "alb.ingress.kubernetes.io/target-type": "ip",
            //"alb.ingress.kubernetes.io/subnets": "subnet-0c42d09812287fa87,subnet-00763f871b321492c,subnet-0d683a69d9ccb503e",
           //"alb.ingress.kubernetes.io/listen-ports": '[{"HTTP": 80}, {"HTTPS":443}]',
           //"alb.ingress.kubernetes.io/actions.ssl-redirect": '{"Type": "redirect", "RedirectConfig": { "Protocol": "HTTPS", "Port": "443", "StatusCode": "HTTP_301"}}',
            "alb.ingress.kubernetes.io/tags": "Environment=dev,Team=Finance"
          }

        },

      ],

      spec: [{

        rule:[{
          host:"skiapp.k8s.devopsoscar.dev",
          http: [{
            path: [{
              path: '/*',
              backend:[{
                serviceName: "skiapp-service",
                servicePort: "80"
              }]
            }]
          }]
        }],
      }]
    });
  }
}


const app = new App();
new MyStack(app, "developers-team-aws-eks");
app.synth();
