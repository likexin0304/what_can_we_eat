/**
 * 集成测试
 * 测试整个微信小程序的功能流程
 */

// 导入单元测试
const { testRandomTimeRange } = require('./randomTime.test.js');
const { testCircleClick } = require('./circleClick.test.js');
const { testCustomToast } = require('./customToast.test.js');
const { testImageErrorHandling } = require('./imageError.test.js');

/**
 * 运行所有测试，并输出结果
 */
function runAllTests() {
  console.log('===== 今天吃什么？小程序集成测试 =====');
  
  // 存储测试结果
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  };
  
  // 测试列表
  const tests = [
    { name: '随机时间范围测试', func: testRandomTimeRange },
    { name: '圆圈点击功能测试', func: testCircleClick },
    { name: '自定义Toast功能测试', func: testCustomToast },
    { name: '图片错误处理测试', func: testImageErrorHandling },
    { name: '图片路径错误处理测试', func: testImagePathErrorHandling }
    // 可以添加更多的测试
  ];
  
  // 运行所有测试
  console.log(`\n将运行 ${tests.length} 个测试...\n`);
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    results.total++;
    
    console.log(`\n[${i + 1}/${tests.length}] 运行测试: ${test.name}`);
    console.log('----------------------------------------');
    
    try {
      const passed = test.func();
      if (passed) {
        console.log(`\n✅ 测试通过: ${test.name}`);
        results.passed++;
      } else {
        console.log(`\n❌ 测试失败: ${test.name}`);
        results.failed++;
      }
    } catch (error) {
      console.error(`\n❌ 测试出错: ${test.name}`);
      console.error(`错误信息: ${error.message}`);
      console.error(error.stack);
      results.failed++;
    }
    
    console.log('----------------------------------------\n');
  }
  
  // 输出测试结果摘要
  console.log('===== 测试结果摘要 =====');
  console.log(`总测试数: ${results.total}`);
  console.log(`通过: ${results.passed}`);
  console.log(`失败: ${results.failed}`);
  console.log(`跳过: ${results.skipped}`);
  console.log(`通过率: ${Math.round((results.passed / results.total) * 100)}%`);
  
  // 返回是否所有测试都通过
  return results.failed === 0;
}

// 运行所有测试
const allTestsPassed = runAllTests();

// 如果在非模块环境中运行，则输出最终结果
if (typeof module === 'undefined' || require.main === module) {
  console.log(`\n${allTestsPassed ? '✅ 所有测试通过' : '❌ 部分测试失败'}`);
  
  // 在实际环境中，可以根据测试结果退出进程
  // process.exit(allTestsPassed ? 0 : 1);
}

// 导出测试函数
module.exports = {
  runAllTests
};

// 添加测试异常路径的场景
function testImagePathErrorHandling() {
  console.log('测试5: 测试异常图片路径处理');
  
  // 创建模拟App和页面对象
  const mockApp = {
    globalData: {
      foodOptions: [
        { name: '海底捞', image: '/images/haidilao.png' },
        { name: '倍乐韩国', image: '/pages/index/images/beilei.png' }, // 错误的路径前缀
        { name: '麦当劳', image: 'images/mcdonald.png' }  // 缺少前导斜杠
      ],
      defaultImage: '/images/default.png',
      imageOptimized: true,
      imageLoadErrors: []
    },
    
    normalizePath: function(path) {
      if (!path) return '';
      
      // 记录原始路径以便调试
      const originalPath = path;
      
      // 移除错误的前缀，如"/pages/index"
      if (path.includes('/pages/index/images/')) {
        path = path.replace('/pages/index', '');
        console.log(`路径修正: ${originalPath} -> ${path}`);
      }
      
      // 确保路径以/开头
      if (path && !path.startsWith('/')) {
        path = '/' + path;
        console.log(`路径添加前导斜杠: ${originalPath} -> ${path}`);
      }
      
      return path;
    },
    
    tryBackupPath: function(originalPath) {
      return originalPath.startsWith('/') ? originalPath : '/' + originalPath;
    }
  };
  
  // 初始化测试
  console.log('初始化图片路径修正测试...');
  
  // 测试路径修正功能
  const testPaths = [
    '/pages/index/images/beilei.png',
    'images/mcdonald.png',
    '/images/haidilao.png',
    'brownstone.png'
  ];
  
  let passCount = 0;
  
  // 对每个路径进行测试
  for (const path of testPaths) {
    const normalizedPath = mockApp.normalizePath(path);
    console.log(`测试路径: ${path} -> 修正后: ${normalizedPath}`);
    
    // 验证路径是否被正确修正
    if (path.includes('/pages/index/') && normalizedPath === '/images/beilei.png') {
      console.log('✓ 前缀修正测试通过');
      passCount++;
    } else if (!path.startsWith('/') && normalizedPath.startsWith('/')) {
      console.log('✓ 前导斜杠测试通过');
      passCount++;
    } else if (path === normalizedPath && path.startsWith('/images/')) {
      console.log('✓ 正确路径保持不变测试通过');
      passCount++;
    } else if (path === 'brownstone.png' && normalizedPath === '/brownstone.png') {
      console.log('✓ 非images路径前导斜杠测试通过');
      passCount++;
    }
  }
  
  // 所有测试都应该通过
  const allTestsPassed = passCount === testPaths.length;
  console.log(`路径修正测试结果: ${allTestsPassed ? '全部通过' : '部分失败'} (${passCount}/${testPaths.length})`);
  
  return allTestsPassed;
} 