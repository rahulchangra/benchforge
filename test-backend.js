#!/usr/bin/env node
/**
 * BenchForge Comprehensive Backend & Database Test Suite
 * Tests all critical API endpoints, database connections, and functionality
 */

const baseUrl = process.env.TEST_URL || 'http://localhost:3001';

// ANSI color codes
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
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}\n`)
};

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

async function test(name, fn) {
  try {
    await fn();
    results.passed++;
    results.tests.push({ name, status: 'pass' });
    log.success(name);
    return true;
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'fail', error: error.message });
    log.error(`${name} - ${error.message}`);
    return false;
  }
}

async function testEndpoint(method, endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok && !options.expectError) {
    throw new Error(`HTTP ${response.status} - ${response.statusText}`);
  }

  const data = await response.json();
  
  if (options.validate) {
    options.validate(data, response);
  }

  return { response, data };
}

// ============================================
// DATABASE CONNECTIVITY TESTS
// ============================================
async function testDatabaseConnection() {
  log.section('📊 DATABASE CONNECTIVITY');

  await test('Health check endpoint exists', async () => {
    const { data } = await testEndpoint('GET', '/api/health');
    if (!data.status || data.status !== 'ok') {
      throw new Error('Health check failed or returned invalid status');
    }
  });

  await test('Database connection active', async () => {
    const { data } = await testEndpoint('GET', '/api/dashboard');
    if (!data.success) {
      throw new Error('Dashboard endpoint failed - likely database issue');
    }
  });
}

// ============================================
// LEARNING STUDIO API TESTS
// ============================================
async function testLearningStudioAPIs() {
  log.section('📚 LEARNING STUDIO APIs');

  let workspaceId;
  let taskId;

  await test('GET /api/learning/workspaces - List workspaces', async () => {
    const { data } = await testEndpoint('GET', '/api/learning/workspaces');
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error('Invalid response structure');
    }
    if (data.data.length > 0) {
      workspaceId = data.data[0].id;
    }
  });

  await test('GET /api/learning/tasks - List tasks', async () => {
    const { data } = await testEndpoint('GET', '/api/learning/tasks');
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error('Invalid response structure');
    }
    if (data.data.length > 0) {
      taskId = data.data[0].id;
    }
  });

  if (taskId) {
    await test('GET /api/learning/tasks/[id] - Get single task', async () => {
      const { data } = await testEndpoint('GET', `/api/learning/tasks/${taskId}`);
      if (!data.success || !data.data) {
        throw new Error('Task not found');
      }
    });

    await test('DELETE /api/learning/tasks/[id] - Delete task', async () => {
      // Create a test task first
      if (!workspaceId) {
        log.warn('Skipping delete test - no workspace available');
        return;
      }
      
      const { data: createData } = await testEndpoint('POST', '/api/learning/tasks', {
        body: {
          workspaceId,
          title: 'Test Task for Deletion',
          description: 'This task should be deleted',
          domain: 'Testing',
          category: 'Test',
          tags: ['test']
        }
      });

      if (!createData.success) {
        throw new Error('Failed to create test task');
      }

      const testTaskId = createData.data.id;

      // Now delete it
      const { data: deleteData } = await testEndpoint('DELETE', `/api/learning/tasks/${testTaskId}`);
      if (!deleteData.success) {
        throw new Error('Delete failed');
      }
    });
  } else {
    log.warn('Skipping task-specific tests - no tasks in database');
  }

  await test('GET /api/learning/knowledge/nodes - Knowledge graph', async () => {
    const { data } = await testEndpoint('GET', '/api/learning/knowledge/nodes');
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error('Invalid response structure');
    }
  });
}

// ============================================
// PROJECT & SUBMISSION TESTS
// ============================================
async function testProjectAPIs() {
  log.section('🚀 PROJECT & SUBMISSION APIs');

  let projectId;
  let submissionId;

  await test('GET /api/projects - List projects', async () => {
    const { data } = await testEndpoint('GET', '/api/projects');
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error('Invalid response structure');
    }
    if (data.data.length > 0) {
      projectId = data.data[0].id;
    }
  });

  if (projectId) {
    await test('GET /api/projects/[id] - Get project details', async () => {
      const { data } = await testEndpoint('GET', `/api/projects/${projectId}`);
      if (!data.success || !data.data) {
        throw new Error('Project not found');
      }
    });

    await test('GET /api/projects/[id]/submissions - List submissions', async () => {
      const { data } = await testEndpoint('GET', `/api/projects/${projectId}/submissions`);
      if (!data.success || !Array.isArray(data.data)) {
        throw new Error('Invalid response structure');
      }
      if (data.data.length > 0) {
        submissionId = data.data[0].id;
      }
    });

    if (submissionId) {
      await test('GET /api/projects/[id]/submissions/[subId] - Get submission', async () => {
        const { data } = await testEndpoint('GET', `/api/projects/${projectId}/submissions/${submissionId}`);
        if (!data.success || !data.data) {
          throw new Error('Submission not found');
        }
      });
    }
  } else {
    log.warn('Skipping project-specific tests - no projects in database');
  }
}

// ============================================
// REPOSITORY & ISSUE TESTS
// ============================================
async function testRepositoryAPIs() {
  log.section('🔍 REPOSITORY & ISSUE APIs');

  await test('GET /api/repositories - List repositories', async () => {
    const { data } = await testEndpoint('GET', '/api/repositories');
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error('Invalid response structure');
    }
  });

  await test('GET /api/issues - List issues', async () => {
    const { data } = await testEndpoint('GET', '/api/issues');
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error('Invalid response structure');
    }
  });

  await test('GET /api/benchmarks - List benchmarks', async () => {
    const { data } = await testEndpoint('GET', '/api/benchmarks');
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error('Invalid response structure');
    }
  });
}

// ============================================
// DASHBOARD METRICS TESTS
// ============================================
async function testDashboardAPIs() {
  log.section('📈 DASHBOARD METRICS APIs');

  await test('GET /api/dashboard - Main dashboard metrics', async () => {
    const { data } = await testEndpoint('GET', '/api/dashboard');
    if (!data.success || !data.data) {
      throw new Error('Invalid response structure');
    }
    
    // Verify no dummy data (all counts should be real)
    const metrics = data.data;
    if (!metrics.repositories && !metrics.issues && !metrics.benchmarks) {
      throw new Error('Dashboard returned empty metrics - possible database issue');
    }
  });

  await test('GET /api/dashboard/enhanced-metrics - Enhanced metrics', async () => {
    const { data } = await testEndpoint('GET', '/api/dashboard/enhanced-metrics');
    if (!data.success || !data.data) {
      throw new Error('Invalid response structure');
    }
  });
}

// ============================================
// DATA PERSISTENCE TESTS
// ============================================
async function testDataPersistence() {
  log.section('💾 DATA PERSISTENCE');

  let workspaceId;
  
  // Get or create workspace
  const { data: workspaces } = await testEndpoint('GET', '/api/learning/workspaces');
  if (workspaces.data.length > 0) {
    workspaceId = workspaces.data[0].id;
  }

  if (!workspaceId) {
    log.warn('No workspace available for persistence tests');
    return;
  }

  await test('Create task and verify persistence', async () => {
    const taskTitle = `Test Task ${Date.now()}`;
    
    // Create
    const { data: createData } = await testEndpoint('POST', '/api/learning/tasks', {
      body: {
        workspaceId,
        title: taskTitle,
        description: 'Testing data persistence',
        domain: 'Testing',
        category: 'Test',
        tags: ['test', 'persistence']
      }
    });

    if (!createData.success) {
      throw new Error('Failed to create task');
    }

    const taskId = createData.data.id;

    // Verify it exists
    const { data: getData } = await testEndpoint('GET', `/api/learning/tasks/${taskId}`);
    if (!getData.success || getData.data.title !== taskTitle) {
      throw new Error('Task not persisted correctly');
    }

    // Clean up
    await testEndpoint('DELETE', `/api/learning/tasks/${taskId}`);
  });
}

// ============================================
// MAIN TEST RUNNER
// ============================================
async function runAllTests() {
  console.log(`\n${colors.bold}═══════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}  BenchForge Backend & Database Test Suite${colors.reset}`);
  console.log(`${colors.bold}═══════════════════════════════════════════════${colors.reset}\n`);
  log.info(`Testing against: ${baseUrl}\n`);

  const startTime = Date.now();

  try {
    await testDatabaseConnection();
    await testLearningStudioAPIs();
    await testProjectAPIs();
    await testRepositoryAPIs();
    await testDashboardAPIs();
    await testDataPersistence();
  } catch (error) {
    log.error(`Fatal error during test execution: ${error.message}`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Print summary
  console.log(`\n${colors.bold}═══════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}  Test Results${colors.reset}`);
  console.log(`${colors.bold}═══════════════════════════════════════════════${colors.reset}\n`);

  console.log(`${colors.green}Passed:${colors.reset}  ${results.passed}`);
  console.log(`${colors.red}Failed:${colors.reset}  ${results.failed}`);
  console.log(`${colors.yellow}Warnings:${colors.reset} ${results.warnings}`);
  console.log(`Duration: ${duration}s\n`);

  if (results.failed > 0) {
    console.log(`${colors.bold}Failed Tests:${colors.reset}`);
    results.tests
      .filter(t => t.status === 'fail')
      .forEach(t => {
        console.log(`  ${colors.red}✗${colors.reset} ${t.name}`);
        console.log(`    ${colors.red}${t.error}${colors.reset}`);
      });
    console.log('');
  }

  const successRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
  console.log(`${colors.bold}Success Rate: ${successRate}%${colors.reset}\n`);

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  log.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});
