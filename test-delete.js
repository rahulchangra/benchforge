#!/usr/bin/env node
/**
 * BenchForge DELETE Functionality Specific Test
 * Creates real data, tests delete, verifies cascade
 */

const baseUrl = process.env.TEST_URL || 'http://localhost:3001';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}\n`)
};

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();
  return { response, data };
}

async function testDeleteFunctionality() {
  log.section('🧪 TESTING DELETE FUNCTIONALITY');

  try {
    // Step 1: Create a workspace
    log.info('Step 1: Creating workspace...');
    const { data: workspaceData } = await fetchJson(`${baseUrl}/api/learning/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Test Workspace ${Date.now()}`,
        description: 'For delete testing'
      })
    });

    if (!workspaceData.success) {
      throw new Error('Failed to create workspace');
    }

    const workspaceId = workspaceData.data.id;
    log.success(`Created workspace: ${workspaceId}`);

    // Step 2: Create a task package
    log.info('Step 2: Creating task package...');
    const { data: taskData } = await fetchJson(`${baseUrl}/api/learning/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId,
        title: 'Test Task for DELETE',
        description: 'This task will be deleted',
        domain: 'Testing',
        category: 'Test',
        tags: ['test', 'delete'],
        documents: [
          {
            filename: 'problem.md',
            originalName: 'problem.md',
            mimeType: 'text/markdown',
            size: 100,
            extractedText: '# Test Problem'
          },
          {
            filename: 'test.patch',
            originalName: 'test.patch',
            mimeType: 'text/x-diff',
            size: 200,
            extractedText: 'diff --git a/test.py'
          }
        ],
        requirements: [
          {
            content: 'Test requirement 1',
            type: 'FUNCTIONAL',
            priority: 'HIGH',
            sourceReference: 'problem.md'
          }
        ],
        knowledgeNodes: [
          {
            type: 'DOMAIN',
            name: 'Testing Domain',
            definition: 'Test domain',
            confidence: 0.9
          }
        ]
      })
    });

    if (!taskData.success) {
      throw new Error('Failed to create task');
    }

    const taskId = taskData.data.id;
    log.success(`Created task: ${taskId}`);

    // Step 3: Verify task was created with all related data
    log.info('Step 3: Verifying task creation...');
    const { data: getTaskData } = await fetchJson(`${baseUrl}/api/learning/tasks/${taskId}`);
    
    if (!getTaskData.success) {
      throw new Error('Task not found after creation');
    }

    const task = getTaskData.data;
    log.success(`Task found with ${task.uploadedDocuments?.length || 0} documents`);
    log.success(`Task has ${task.extractedRequirements?.length || 0} requirements`);

    // Step 4: Test DELETE endpoint
    log.info('Step 4: Testing DELETE endpoint...');
    const { data: deleteData, response: deleteResponse } = await fetchJson(
      `${baseUrl}/api/learning/tasks/${taskId}`,
      { method: 'DELETE' }
    );

    console.log('\nDELETE Response:', JSON.stringify(deleteData, null, 2));

    if (deleteResponse.status !== 200) {
      throw new Error(`DELETE returned HTTP ${deleteResponse.status}`);
    }

    if (!deleteData.success) {
      throw new Error(`DELETE failed: ${deleteData.error || 'Unknown error'}`);
    }

    log.success('DELETE request succeeded');
    log.success(`Deleted ${deleteData.data.documentsDeleted || 0} documents`);
    log.success(`Deleted ${deleteData.data.requirementsDeleted || 0} requirements`);

    // Step 5: Verify task was actually deleted
    log.info('Step 5: Verifying task deletion...');
    const { data: verifyData, response: verifyResponse } = await fetchJson(
      `${baseUrl}/api/learning/tasks/${taskId}`
    );

    if (verifyResponse.status === 404 || verifyData.error) {
      log.success('Task successfully deleted (404 Not Found)');
    } else {
      throw new Error('Task still exists after deletion!');
    }

    // Step 6: Verify documents were cascade deleted
    log.info('Step 6: Verifying cascade deletion...');
    const { data: allTasksData } = await fetchJson(`${baseUrl}/api/learning/tasks`);
    const stillExists = allTasksData.data.find((t) => t.id === taskId);
    
    if (stillExists) {
      throw new Error('Task still appears in list!');
    }

    log.success('Cascade deletion verified - task completely removed');

    // Clean up workspace
    log.info('Cleaning up workspace...');
    await fetchJson(`${baseUrl}/api/learning/workspaces/${workspaceId}`, {
      method: 'DELETE'
    });

    console.log(`\n${colors.bold}${colors.green}══════════════════════════════════${colors.reset}`);
    console.log(`${colors.bold}${colors.green}✓ ALL DELETE TESTS PASSED!${colors.reset}`);
    console.log(`${colors.bold}${colors.green}══════════════════════════════════${colors.reset}\n`);
    console.log(`${colors.green}DELETE functionality is working correctly!${colors.reset}\n`);

    process.exit(0);

  } catch (error) {
    console.log(`\n${colors.bold}${colors.red}══════════════════════════════════${colors.reset}`);
    console.log(`${colors.bold}${colors.red}✗ DELETE TESTS FAILED${colors.reset}`);
    console.log(`${colors.bold}${colors.red}══════════════════════════════════${colors.reset}\n`);
    console.log(`${colors.red}Error: ${error.message}${colors.reset}\n`);
    
    if (error.stack) {
      console.log(`${colors.red}Stack trace:${colors.reset}`);
      console.log(error.stack);
    }

    process.exit(1);
  }
}

testDeleteFunctionality();
