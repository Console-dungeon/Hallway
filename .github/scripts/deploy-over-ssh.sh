#!/usr/bin/env bash
# Called by .github/workflows/deploy.yml: copies deploy/ to the server and runs
# deploy/remote-deploy.sh there. Usage: deploy-over-ssh.sh <qa|prod>
# Env: SSH_HOST, SSH_USER, SSH_PRIVATE_KEY, SSH_KNOWN_HOSTS, GHCR_TOKEN, IMAGE_TAG, GITHUB_ACTOR
set -euo pipefail

STACK="$1"
INCOMING=/srv/hallway/_incoming

install -m 700 -d ~/.ssh
printf '%s\n' "$SSH_PRIVATE_KEY" > ~/.ssh/deploy_key
chmod 600 ~/.ssh/deploy_key
printf '%s\n' "$SSH_KNOWN_HOSTS" > ~/.ssh/known_hosts
target="$SSH_USER@$SSH_HOST"
ssh_opts=(-i ~/.ssh/deploy_key -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes)

echo "==> Copying deploy files"
# shellcheck disable=SC2029 # $INCOMING is meant to expand here, on the runner
ssh "${ssh_opts[@]}" "$target" "rm -rf $INCOMING && mkdir -p $INCOMING"
scp "${ssh_opts[@]}" -r deploy/. "$target:$INCOMING/"

echo "==> Deploying $STACK ($IMAGE_TAG)"
# The registry token is valid only while this job runs; it is passed on stdin, never as an argument
# shellcheck disable=SC2029 # variables are meant to expand here, on the runner
printf '%s' "$GHCR_TOKEN" | ssh "${ssh_opts[@]}" "$target" \
  "docker login ghcr.io -u '$GITHUB_ACTOR' --password-stdin >/dev/null \
   && bash $INCOMING/remote-deploy.sh '$STACK' '$IMAGE_TAG'; rc=\$?; docker logout ghcr.io >/dev/null; exit \$rc"
