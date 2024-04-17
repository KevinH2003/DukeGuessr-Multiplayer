#!/bin/bash

# Build Docker images for server and UI
echo "Building Docker images..."

cd server
docker build -t dukeguessr-multiplayer-server .
cd ..

cd ui
docker build -t dukeguessr-multiplayer-ui .
cd ..

echo "Deploying with Kubernetes..."
kubectl delete -f k8s/ --ignore-not-found=true

kubectl create -f k8s/

# Wait for the deployments to be ready
echo "Waiting for deployments to be ready..."
kubectl wait --for=condition=available deployment/server --timeout=300s
kubectl wait --for=condition=available deployment/ui --timeout=300s
kubectl wait --for=condition=available deployment/db --timeout=300s
kubectl wait --for=condition=available deployment/redis --timeout=300s

# Check if deployments are ready
server_ready=$(kubectl get deployment server -o=jsonpath='{.status.conditions[?(@.type=="Available")].status}')
ui_ready=$(kubectl get deployment ui -o=jsonpath='{.status.conditions[?(@.type=="Available")].status}')
db_ready=$(kubectl get deployment db -o=jsonpath='{.status.conditions[?(@.type=="Available")].status}')
redis_ready=$(kubectl get deployment redis -o=jsonpath='{.status.conditions[?(@.type=="Available")].status}')

if [[ ("$server_ready" == "True" && "$ui_ready" == "True") && ("$db_ready" == "True" && "$redis_ready" == "True")]]; then
  echo "Deployments are ready."
else
  echo "Deployments are not ready. Please check logs for more information."
fi

echo "Port-forwarding Mongo and Redis..."
kubectl port-forward service/db 27017:27017 & echo $! > db_forward.pid
kubectl port-forward service/redis 6379:6379 & echo $! > redis_forward.pid

# Wait for a moment to ensure port-forwarding is established
sleep 2

echo "Setting up DB..."
cd server
npm run setup