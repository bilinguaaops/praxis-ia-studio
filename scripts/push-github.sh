#!/usr/bin/env bash
set -e

COMMIT_MSG="${1:-feat(sync): update from AI Studio $(date '+%Y-%m-%d %H:%M:%S')}"

echo "🔄 Checking git status..."
git status -s

if [[ -n $(git status --porcelain) ]]; then
  echo "📦 Staging changes..."
  git add -A
  git commit -m "$COMMIT_MSG"
  echo "✅ Changes committed: $COMMIT_MSG"
else
  echo "ℹ️ No changes to commit."
fi

echo "🚀 Pushing to GitHub (origin main)..."
git push origin main
echo "🎉 Push successful!"
