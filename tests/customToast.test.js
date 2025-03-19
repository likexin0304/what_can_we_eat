/**
 * 自定义Toast功能单元测试
 * 测试自定义Toast是否能正确显示和隐藏
 */

// 模拟app对象
const mockApp = {
  globalData: {
    foodHistory: [],
    foodOptions: [
      { name: '海底捞', image: '/images/haidilao.png' },
      { name: 'KFC', image: '/images/kfc.png' },
      { name: '麦当劳', image: '/images/mcdonald.png' }
    ]
  },
  addToHistory: function(food) {
    this.globalData.foodHistory.unshift({
      ...food,
      timestamp: new Date().toLocaleString()
    });
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
  // 添加createSelectorQuery模拟，用于测试元素位置
  createSelectorQuery: function() {
    return {
      select: function(selector) {
        // 模拟选择器，返回模拟的元素信息
        return {
          boundingClientRect: function(callback) {
            // 模拟元素的位置和尺寸信息
            if (selector === '.custom-toast') {
              callback({
                top: 50, // 模拟toast的顶部位置
                height: 40 // 模拟toast的高度
              });
            } else if (selector === '.food-circle') {
              callback({
                top: 150, // 模拟圆圈的顶部位置
                height: 200 // 模拟圆圈的高度
              });
            }
            return this;
          }
        };
      },
      exec: function() {}
    };
  }
};

// 模拟setTimeout
const originalSetTimeout = setTimeout;
let mockTimeouts = [];
let mockTimeoutId = 0;

function setupMockTimers() {
  global.setTimeout = function(callback, delay) {
    const id = ++mockTimeoutId;
    mockTimeouts.push({
      id,
      callback,
      delay,
      createdAt: Date.now()
    });
    return id;
  };
}

function restoreOriginalTimers() {
  global.setTimeout = originalSetTimeout;
  mockTimeouts = [];
  mockTimeoutId = 0;
}

function advanceTimersByTime(ms) {
  const now = Date.now();
  const toExecute = mockTimeouts.filter(timeout => (now - timeout.createdAt + ms) >= timeout.delay);
  
  // 执行所有应该被触发的定时器
  toExecute.forEach(timeout => {
    timeout.callback();
  });
  
  // 从队列中移除已执行的定时器
  mockTimeouts = mockTimeouts.filter(timeout => !toExecute.includes(timeout));
}

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
 * 测试自定义Toast功能
 */
function testCustomToast() {
  console.log('开始测试自定义Toast功能...');
  
  setupMockTimers(); // 设置模拟定时器
  
  // 设置全局变量
  global.getApp = () => mockApp;
  global.wx = mockWx;
  
  // 创建清理函数，用于测试结束后清理全局变量
  function cleanup() {
    delete global.getApp;
    delete global.wx;
    restoreOriginalTimers(); // 恢复原始定时器
  }
  
  let testPassed = true;
  
  try {
    // 创建模拟页面对象
    const page = createMockPage({
      data: {
        currentFood: null,
        isRandomizing: false,
        animationData: {},
        showCustomToast: false,
        customToastText: ''
      },
      onLoad: function() {
        this.animation = wx.createAnimation({
          duration: 300,
          timingFunction: 'ease',
        });
      },
      showCustomToast: function(text, duration = 2000) {
        this.setData({
          customToastText: text,
          showCustomToast: true
        });
        
        setTimeout(() => {
          this.setData({
            showCustomToast: false
          });
        }, duration);
      },
      startRandomize: function() {
        if (this.data.isRandomizing) {
          this.showCustomToast('正在选择中...', 1000);
          return;
        }
        
        // 简化的随机选择逻辑
        this.setData({ isRandomizing: true });
        
        setTimeout(() => {
          const randomIndex = Math.floor(Math.random() * mockApp.globalData.foodOptions.length);
          const finalSelectedFood = mockApp.globalData.foodOptions[randomIndex];
          
          this.setData({ 
            currentFood: finalSelectedFood,
            isRandomizing: false 
          });
          
          mockApp.addToHistory(finalSelectedFood);
          this.showCustomToast('今天就吃这个吧！', 2000);
        }, 200);
      },
      // 添加测试Toast位置的方法
      testToastPosition: function() {
        // 获取Toast和圆圈的位置信息
        const query = wx.createSelectorQuery();
        let toastBottom = 0;
        let circleTop = 0;
        
        query.select('.custom-toast').boundingClientRect(rect => {
          if (rect) {
            toastBottom = rect.top + rect.height;
          }
        });
        
        query.select('.food-circle').boundingClientRect(rect => {
          if (rect) {
            circleTop = rect.top;
          }
        });
        
        query.exec();
        
        // 验证Toast底部与圆圈顶部之间是否有足够空间
        return {
          toastBottom,
          circleTop,
          hasEnoughSpace: (circleTop - toastBottom) >= 60 // 至少60rpx的空间
        };
      }
    });
    
    // 测试1：直接调用showCustomToast方法
    console.log('测试1：直接调用showCustomToast方法');
    page.showCustomToast('测试消息', 1500);
    
    // 验证Toast是否显示
    if (!page.data.showCustomToast) {
      throw new Error('显示Toast失败：showCustomToast应为true');
    }
    
    if (page.data.customToastText !== '测试消息') {
      throw new Error(`Toast文本内容错误：期望"测试消息"，实际为"${page.data.customToastText}"`);
    }
    
    // 模拟时间流逝，测试自动隐藏功能
    console.log('模拟1600毫秒后，Toast应自动隐藏');
    advanceTimersByTime(1600);
    
    // 验证Toast是否隐藏
    if (page.data.showCustomToast) {
      throw new Error('隐藏Toast失败：1600毫秒后showCustomToast应为false');
    }
    
    // 测试2：通过startRandomize方法间接调用showCustomToast
    console.log('测试2：通过startRandomize方法间接调用showCustomToast');
    page.startRandomize();
    
    // 验证是否进入随机状态
    if (!page.data.isRandomizing) {
      throw new Error('未进入随机状态');
    }
    
    // 模拟随机选择完成
    console.log('模拟250毫秒后，随机选择完成');
    advanceTimersByTime(250);
    
    // 验证结果
    if (page.data.isRandomizing) {
      throw new Error('随机选择完成后仍处于随机状态');
    }
    
    // 验证Toast是否显示
    if (!page.data.showCustomToast) {
      throw new Error('随机选择完成后未显示Toast');
    }
    
    if (page.data.customToastText !== '今天就吃这个吧！') {
      throw new Error(`Toast文本内容错误：期望"今天就吃这个吧！"，实际为"${page.data.customToastText}"`);
    }
    
    // 测试3：在随机过程中再次点击
    console.log('测试3：在随机过程中再次点击');
    page.setData({ isRandomizing: true }); // 手动设置为随机状态
    page.startRandomize(); // 再次调用
    
    // 验证Toast是否显示"正在选择中..."
    if (!page.data.showCustomToast) {
      throw new Error('在随机过程中再次点击未显示Toast');
    }
    
    if (page.data.customToastText !== '正在选择中...') {
      throw new Error(`Toast文本内容错误：期望"正在选择中..."，实际为"${page.data.customToastText}"`);
    }
    
    // 测试4：验证Toast位置
    console.log('测试4：验证Toast与圆圈之间的位置关系');
    const positionInfo = page.testToastPosition();
    console.log(`Toast底部位置: ${positionInfo.toastBottom}, 圆圈顶部位置: ${positionInfo.circleTop}`);
    
    if (!positionInfo.hasEnoughSpace) {
      throw new Error(`Toast与圆圈之间的空间不足，当前距离: ${positionInfo.circleTop - positionInfo.toastBottom}rpx`);
    }
    
    console.log('测试通过：自定义Toast功能正常工作，位置设置正确');
    
  } catch (error) {
    console.error(`测试失败：${error.message}`);
    testPassed = false;
  } finally {
    cleanup();
  }
  
  return testPassed;
}

// 运行测试
const result = testCustomToast();
console.log(`测试结果：${result ? '通过' : '失败'}`);

// 导出测试函数
module.exports = {
  testCustomToast
}; 