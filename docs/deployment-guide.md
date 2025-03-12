# Deployment Guide

## Container Orchestration
```bash
# Start Docker Swarm cluster
docker swarm init --advertise-addr 192.168.1.100

# Deploy stack
docker stack deploy -c deployment/docker-compose.yml digital-double
```

## Kubernetes Configuration
```yaml
# deployment/k8s/cluster.yaml
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 3
  strategy:
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
```

## Monitoring Setup
```bash
# Install Prometheus operator
helm install monitoring prometheus-community/kube-prometheus-stack
```

[Back to Architecture Overview](/docs/architecture.md)