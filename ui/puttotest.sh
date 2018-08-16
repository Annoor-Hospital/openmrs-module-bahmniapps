#!/bin/sh
tar -cvzf app.tar.gz app && echo "put app.tar.gz" | sftp root@10.10.10.245:/opt/bahmni-web/etc
