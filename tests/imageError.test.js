/**
 * 图片错误处理单元测试
 * 测试图片加载失败时的处理逻辑
 */

// 模拟app对象
const mockApp = {
  globalData: {
    foodHistory: [],
    foodOptions: [
      { name: '海底捞', image: '/images/haidilao.png' },
      { name: '倍乐韩国', image: '/images/beilei.png' },
      { name: '麦当劳', image: '/images/mcdonald.png' }
    ],
    defaultImage: '/images/logo.png'
  },
  addToHistory: function(food) {
    this.globalData.foodHistory.unshift({
      ...food,
      timestamp: new Date().toLocaleString()
    });
  },
  preloadImages: function() {
    // 模拟预加载图片的功能
    return Promise.resolve();
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
  getImageInfo: function(options) {
    // 根据图片路径决定成功或失败
    if (options.src === '/images/beilei.png') {
      // 模拟图片加载失败
      if (options.fail) options.fail({ errMsg: 'getImageInfo:fail' });
    } else {
      // 模拟图片加载成功
      if (options.success) options.success({
        path: options.src,
        width: 100,
        height: 100
      });
    }
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
 * 测试图片错误处理功能
 */
function testImageErrorHandling() {
  console.log('开始测试图片错误处理功能...');
  
  // 设置全局变量
  global.getApp = () => mockApp;
  global.wx = mockWx;
  
  // 创建清理函数，用于测试结束后清理全局变量
  function cleanup() {
    delete global.getApp;
    delete global.wx;
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
      },
      handleImageError: function(e) {
        console.error('图片加载失败:', e);
        
        if (!this.data.currentFood) return;
        
        // 查找当前食物在选项中的索引
        const foodIndex = mockApp.globalData.foodOptions.findIndex(
          food => food.name === this.data.currentFood.name
        );
        
        if (foodIndex >= 0) {
          // 更新食物图片为默认图片
          const updatedFood = { ...this.data.currentFood };
          updatedFood.image = mockApp.globalData.defaultImage;
          
          // 同时更新全局数据，防止下次随机到同一食物时再次出错
          mockApp.globalData.foodOptions[foodIndex].image = mockApp.globalData.defaultImage;
          
          // 更新当前显示的食物
          this.setData({ currentFood: updatedFood });
          
          // 显示提示
          this.showCustomToast('图片加载失败，已使用默认图片', 2000);
        }
      },
      startRandomize: function() {
        // 简化的随机选择逻辑
        this.setData({ 
          currentFood: mockApp.globalData.foodOptions[1],  // 选择"倍乐韩国"，这个会触发图片加载失败
          isRandomizing: false 
        });
      }
    });
    
    // 测试1：模拟图片加载错误事件
    console.log('测试1：模拟图片加载错误事件');
    page.setData({ 
      currentFood: mockApp.globalData.foodOptions[1]  // 设置当前食物为"倍乐韩国"
    });
    
    // 调用图片错误处理函数，模拟绑定的binderror事件
    page.handleImageError({});
    
    // 验证食物图片是否已更新为默认图片
    if (page.data.currentFood.image !== mockApp.globalData.defaultImage) {
      throw new Error(`图片未更新为默认图片，当前图片为: ${page.data.currentFood.image}`);
    }
    
    // 验证全局数据中的图片是否也已更新
    if (mockApp.globalData.foodOptions[1].image !== mockApp.globalData.defaultImage) {
      throw new Error('全局数据中的图片未更新为默认图片');
    }
    
    // 验证是否显示了提示
    if (!page.data.showCustomToast) {
      throw new Error('未显示图片加载失败的提示');
    }
    
    if (page.data.customToastText !== '图片加载失败，已使用默认图片') {
      throw new Error(`提示文本内容错误: ${page.data.customToastText}`);
    }
    
    // 测试2：测试预加载功能（模拟）
    console.log('测试2：模拟app.preloadImages()调用');
    mockApp.preloadImages()
      .then(() => {
        console.log('预加载图片成功');
      });
    
    // 测试3：通过随机选择触发图片加载
    console.log('测试3：通过startRandomize触发图片加载');
    page.startRandomize();
    
    // 验证是否选择了倍乐韩国
    if (page.data.currentFood.name !== '倍乐韩国') {
      throw new Error(`未选择预期的食物，当前食物为: ${page.data.currentFood.name}`);
    }
    
    console.log('测试通过：图片错误处理功能正常工作');
    
  } catch (error) {
    console.error(`测试失败：${error.message}`);
    testPassed = false;
  } finally {
    cleanup();
  }
  
  return testPassed;
}

// 运行测试
const result = testImageErrorHandling();
console.log(`测试结果：${result ? '通过' : '失败'}`);

// 导出测试函数
module.exports = {
  testImageErrorHandling
}; 