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
    { name: '图片错误处理测试', func: testImageErrorHandling }
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