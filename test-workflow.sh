#!/bin/bash

# Test script for the GitHub Actions workflow locally
# This simulates what the Worker would send to the workflow

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Testing GPTHost Build Workflow Locally${NC}"
echo "========================================"

# Check if framework is provided as argument
FRAMEWORK=${1:-react}
PROJECT_ID="test-${FRAMEWORK}-$(date +%s)"

echo -e "${YELLOW}Testing framework: $FRAMEWORK${NC}"
echo -e "${YELLOW}Project ID: $PROJECT_ID${NC}"

# Prepare source files based on framework
case $FRAMEWORK in
  react)
    SOURCE_FILES='{"src/App.jsx":"import React, { useState } from '\''react'\'';\n\nexport default function Counter() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div style={{ padding: '\''20px'\'', fontFamily: '\''Arial, sans-serif'\'' }}>\n      <h1>React Counter Component</h1>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(count + 1)}>Increment</button>\n      <button onClick={() => setCount(count - 1)}>Decrement</button>\n      <button onClick={() => setCount(0)}>Reset</button>\n    </div>\n  );\n}"}'
    ;;
  vue)
    SOURCE_FILES='{"src/App.vue":"<template>\n  <div class=\"counter-container\">\n    <h1>Vue Counter Component</h1>\n    <p>Count: {{ count }}</p>\n    <button @click=\"increment\">Increment</button>\n    <button @click=\"decrement\">Decrement</button>\n    <button @click=\"reset\">Reset</button>\n  </div>\n</template>\n\n<script setup>\nimport { ref } from '\''vue'\''\n\nconst count = ref(0)\n\nconst increment = () => {\n  count.value++\n}\n\nconst decrement = () => {\n  count.value--\n}\n\nconst reset = () => {\n  count.value = 0\n}\n</script>\n\n<style scoped>\n.counter-container {\n  padding: 20px;\n  font-family: Arial, sans-serif;\n}\n\nbutton {\n  margin: 0 5px;\n  padding: 5px 10px;\n}\n</style>"}'
    ;;
  svelte)
    SOURCE_FILES='{"src/App.svelte":"<script>\n  let count = 0\n  \n  function increment() {\n    count += 1\n  }\n  \n  function decrement() {\n    count -= 1\n  }\n  \n  function reset() {\n    count = 0\n  }\n</script>\n\n<div class=\"counter-container\">\n  <h1>Svelte Counter Component</h1>\n  <p>Count: {count}</p>\n  <button on:click={increment}>Increment</button>\n  <button on:click={decrement}>Decrement</button>\n  <button on:click={reset}>Reset</button>\n</div>\n\n<style>\n  .counter-container {\n    padding: 20px;\n    font-family: Arial, sans-serif;\n  }\n  \n  button {\n    margin: 0 5px;\n    padding: 5px 10px;\n  }\n</style>"}'
    ;;
  *)
    echo -e "${RED}Unknown framework: $FRAMEWORK${NC}"
    echo "Usage: $0 [react|vue|svelte]"
    exit 1
    ;;
esac

# Create a test directory
TEST_DIR="test-runs/$PROJECT_ID"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Initialize as a minimal project
echo -e "\n${YELLOW}Setting up test environment...${NC}"
echo "$SOURCE_FILES" > source_files.json

# Extract and create source files
echo -e "${YELLOW}Creating source files...${NC}"
jq -r 'to_entries[] | [.key, .value] | @tsv' source_files.json | while IFS=$'\t' read -r filename content; do
  mkdir -p "$(dirname "$filename")"
  # Use echo -e to interpret escape sequences
  echo -e "$content" > "$filename"
  echo "Created: $filename"
done

# Run the scaffold script
echo -e "\n${YELLOW}Running scaffold script...${NC}"
export FRAMEWORK=$FRAMEWORK
node ../../.github/scripts/scaffold.js

# Show the generated structure
echo -e "\n${YELLOW}Generated project structure:${NC}"
ls -la
if [ -d "src" ]; then
  echo -e "\n${YELLOW}Source directory:${NC}"
  ls -la src/
fi

echo -e "\n${YELLOW}Package.json:${NC}"
cat package.json

echo -e "\n${YELLOW}Vite config:${NC}"
cat vite.config.js 2>/dev/null || cat vite.config.ts 2>/dev/null

# Install and build
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install --no-audit --no-fund

echo -e "\n${YELLOW}Building project...${NC}"
npm run build

# Check the output
if [ -d "dist" ]; then
  echo -e "\n${GREEN}Build successful!${NC}"
  echo -e "${YELLOW}Build output:${NC}"
  ls -la dist/
  
  # Check for relative paths
  if [ -f "dist/index.html" ]; then
    echo -e "\n${YELLOW}Checking index.html for path issues...${NC}"
    if grep -q 'src="/' dist/index.html || grep -q 'href="/' dist/index.html; then
      echo -e "${RED}WARNING: Found absolute paths in index.html${NC}"
      grep -E '(src|href)="/' dist/index.html
    else
      echo -e "${GREEN}Paths are properly relative${NC}"
    fi
  fi
else
  echo -e "\n${RED}Build failed - no dist directory${NC}"
  exit 1
fi

echo -e "\n${GREEN}Test completed successfully!${NC}"
echo -e "You can serve the built app with: ${YELLOW}npx serve dist${NC}"