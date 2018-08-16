#!/bin/sh
tar -cvzf dist.tar.gz dist && echo "put dist.tar.gz" | sftp root@10.10.10.134:/opt/bahmni-web/etc
