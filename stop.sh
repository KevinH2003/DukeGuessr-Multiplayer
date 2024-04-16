#!/bin/bash
echo "Stopping port forwarding..."

# Read process IDs from files
DB_FORWARD_PID=$(cat db_forward.pid)
REDIS_FORWARD_PID=$(cat redis_forward.pid)

# Kill the port forwarding processes
kill $DB_FORWARD_PID $REDIS_FORWARD_PID

# Remove the PID files
rm db_forward.pid redis_forward.pid

echo "Port forwarding stopped."

echo "Deleting deployed containers..."
kubectl delete -f k8s/ --ignore-not-found=true
echo "Containers deleted."

