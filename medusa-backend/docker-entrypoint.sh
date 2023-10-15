#!/bin/bash
echo "entrypoint";
medusa migrations run

medusa develop

echo "entrypoint end";