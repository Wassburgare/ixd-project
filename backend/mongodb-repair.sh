#!/bin/bash

rm -f data/*
sudo mongod --dbpath data/ --repair
sudo rm -rf /var/lib/mongodb/{mongod.lock,storage.bson}
sudo cp data/* /var/lib/mongodb/
sudo chown mongodb:nogroup /var/lib/mongodb/*
sudo systemctl restart mongodb
