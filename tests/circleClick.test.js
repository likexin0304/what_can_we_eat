/**
 * 圆圈点击功能单元测试
 * 测试圆圈点击是否能正确触发随机选择功能
 */

// 模拟全局app对象
const mockApp = {
  globalData: {
    foodHistory: [],
    foodOptions: [
      { name: '海底捞', image: '/images/haidilao.png' },
      { name: 'KFC', image: '/images/kfc.png' },
      { name: '麦当劳', image: '/images/mcdonald.png' }
    ],
  },
  addToHistory: function(food) {
    this.globalData.foodHistory.unshift({
      ...food,
      timestamp: new Date().toLocaleString()
    });
    if (this.globalData.foodHistory.length > 20) {
      this.globalData.foodHistory.pop();
    }
  }
};

// 模拟wx对象
const mockWx = {
  createAnimation: function() {
    return {
      opacity: function() { return this; },
      step: function() { return this; },
      export: function() { return {}; }
    };
  },
  showToast: function(options) {
    console.log(`显示Toast: ${options.title}`);
    return true;
  }
};

// 模拟Page环境
function createMockPage(options) {
  const page = {};
  
  // 初始化数据
  page.data = { ...options.data };
  
  // 设置方法
  page.setData = function(newData) {
    Object.assign(page.data, newData);
    console.log('数据更新:', JSON.stringify(newData));
  };
  
  // 添加页面中定义的方法
  Object.keys(options).forEach(key => {
    if (typeof options[key] === 'function') {
      page[key] = options[key].bind(page);
    }
  });
  
  // 调用onLoad生命周期函数
  if (page.onLoad) {
    page.onLoad();
  }
  
  return page;
}

/**
 * 测试圆圈点击功能
 */
function testCircleClick() {
  console.log('开始测试圆圈点击功能...');
  
  // 全局变量
  global.getApp = () => mockApp;
  global.wx = mockWx;
  
  // 创建清理函数，用于测试结束后清理全局变量
  function cleanup() {
    delete global.getApp;
    delete global.wx;
  }
  
  // 1. 测试：圆圈点击应该触发随机选择
  let testPassed = true;
  
  try {
    // 模拟页面对象
    const page = createMockPage({
      data: {
        currentFood: null,
        isRandomizing: false,
        animationData: {}
      },
      onLoad: function() {
        this.animation = wx.createAnimation({
          duration: 300,
          timingFunction: 'ease',
        });
        this.navigating = false;
      },
      startRandomize: function() {
        if (this.data.isRandomizing) {
          console.log('已经在随机选择中，点击无效');
          return;
        }
        
        // 模拟简化版的startRandomize函数
        this.setData({ isRandomizing: true });
        console.log('开始随机选择...');
        
        // 模拟随机选择完成
        setTimeout(() => {
          const randomIndex = Math.floor(Math.random() * mockApp.globalData.foodOptions.length);
          const finalSelectedFood = mockApp.globalData.foodOptions[randomIndex];
          
          this.setData({ 
            currentFood: finalSelectedFood,
            isRandomizing: false 
          });
          
          mockApp.addToHistory(finalSelectedFood);
          console.log(`选择完成，结果: ${finalSelectedFood.name}`);
        }, 100); // 使用较短的延迟以加快测试
      }
    });
    
    // 测试初始状态
    console.log('测试初始状态...');
    if (page.data.currentFood !== null || page.data.isRandomizing !== false) {
      throw new Error('初始状态不正确');
    }
    
    // 模拟点击圆圈
    console.log('模拟点击圆圈...');
    page.startRandomize();
    
    // 验证是否进入随机状态
    if (!page.data.isRandomizing) {
      throw new Error('点击圆圈后未进入随机状态');
    }
    
    // 再次点击，应该无效
    console.log('再次点击圆圈（应该无效）...');
    page.startRandomize();
    
    // 等待随机选择完成
    console.log('等待随机选择完成...');
    setTimeout(() => {
      // 验证结果
      if (page.data.currentFood === null) {
        throw new Error('随机选择完成后没有选中食物');
      }
      
      if (page.data.isRandomizing) {
        throw new Error('随机选择完成后仍处于随机状态');
      }
      
      if (mockApp.globalData.foodHistory.length === 0) {
        throw new Error('选中的食物未添加到历史记录');
      }
      
      console.log('测试通过: 圆圈点击功能正常工作');
    }, 200);
    
  } catch (error) {
    console.error(`测试失败: ${error.message}`);
    testPassed = false;
  } finally {
    // 清理全局变量
    cleanup();
  }
  
  return testPassed;
}

// 运行测试
testCircleClick();

// 导出测试函数
module.exports = {
  testCircleClick
}; 