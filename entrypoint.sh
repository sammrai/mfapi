#!/bin/sh

while :
do
  yarn start || true

  echo "Waiting 10s before restarting..."
  sleep 10
done