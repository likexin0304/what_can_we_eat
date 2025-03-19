/**
 * 随机时间单元测试
 * 测试随机时间是否在3-5秒之间
 */

// 模拟index.js中的随机时间生成函数
function generateRandomTime() {
  return Math.floor(Math.random() * 2000) + 3000;
}

/**
 * 测试随机时间是否在3-5秒之间
 * 运行多次测试以确保随机时间始终在预期范围内
 */
function testRandomTimeRange() {
  console.log('开始测试随机时间范围...');
  
  const testCount = 1000; // 测试次数
  let allTestsPassed = true;
  let minTimeGenerated = Infinity;
  let maxTimeGenerated = 0;
  
  // 运行多次测试
  for (let i = 0; i < testCount; i++) {
    const randomTime = generateRandomTime();
    
    // 更新最小和最大生成时间
    if (randomTime < minTimeGenerated) minTimeGenerated = randomTime;
    if (randomTime > maxTimeGenerated) maxTimeGenerated = randomTime;
    
    // 检查时间是否在3-5秒范围内
    if (randomTime < 3000 || randomTime > 5000) {
      console.error(`测试失败: 生成的时间 ${randomTime}ms 不在3000-5000ms范围内`);
      allTestsPassed = false;
      break;
    }
  }
  
  // 输出测试结果
  if (allTestsPassed) {
    console.log(`测试通过: 所有${testCount}次测试生成的随机时间都在3-5秒范围内`);
    console.log(`最小生成时间: ${minTimeGenerated}ms`);
    console.log(`最大生成时间: ${maxTimeGenerated}ms`);
  } else {
    console.log('测试失败: 部分随机时间不在预期范围内');
  }
  
  return allTestsPassed;
}

// 运行测试
testRandomTimeRange();

// 导出测试函数，以便在其他地方使用
module.exports = {
  generateRandomTime,
  testRandomTimeRange
};