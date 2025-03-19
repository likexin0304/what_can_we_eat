/**
 * 历史记录导航测试
 * 测试从首页到历史记录页面的导航功能
 */

// 模拟微信小程序环境
const mockApp = {
  globalData: {
    foodHistory: []
  },
  addToHistory: function(food) {
    this.globalData.foodHistory.unshift(food);
  }
};

// 模拟wx对象
const mockWx = {
  navigateToSuccess: true,
  navigateToCallCount: 0,
  redirectToCallCount: 0,
  showToastCallCount: 0,
  lastToastConfig: null,
  lastNavigateToError: null,
  navigateTo: function(config) {
    this.navigateToCallCount++;
    console.log('wx.navigateTo 被调用，参数:', JSON.stringify(config));
    
    if (this.navigateToSuccess) {
      if (config.complete) config.complete();
      if (config.success) config.success();
    } else {
      // 创建一个带有errMsg的错误对象，模拟真实的微信小程序错误
      const error = new Error('导航失败');
      error.errMsg = this.lastNavigateToError || 'navigateTo:fail';
      if (config.fail) config.fail(error);
      if (config.complete) config.complete();
    }
  },
  redirectTo: function(config) {
    this.redirectToCallCount++;
    console.log('wx.redirectTo 被调用，参数:', JSON.stringify(config));
    
    if (config.success) config.success();
    if (config.complete) config.complete();
  },
  showToast: function(config) {
    this.showToastCallCount++;
    this.lastToastConfig = config;
    console.log('wx.showToast 被调用，参数:', JSON.stringify(config));
  },
  navigateBack: function() {
    console.log('wx.navigateBack 被调用');
  }
};

// 测试goToHistory函数
function testGoToHistory() {
  console.log('开始测试历史记录导航功能...');
  
  // 模拟Page实例
  const page = {
    navigating: false,
    data: {},
    setData: function(data) {
      Object.assign(this.data, data);
    }
  };
  
  // 导入goToHistory函数
  const goToHistory = function() {
    // 防止快速点击或动画过程中的问题
    if (this.navigating) return;
    this.navigating = true;
    
    // 检查是否有历史记录
    if (mockApp.globalData.foodHistory.length === 0) {
      // 如果没有历史记录，显示提示信息
      mockWx.showToast({
        title: '暂无历史记录，请先进行随机选择尝试哦',
        icon: 'none',
        duration: 2000
      });
      
      // 重置导航标志
      setTimeout(() => {
        this.navigating = false;
      }, 500);
      return;
    }
    
    mockWx.navigateTo({
      url: '/pages/history/history',
      success: function() {
        console.log('成功导航到历史记录页面');
      },
      fail: function(err) {
        console.error('导航到历史记录页面失败:', err);
        
        // 检查是否是登录或授权相关错误
        const errMsg = err.errMsg || '';
        
        if (errMsg.indexOf('Login is required') !== -1 || 
            errMsg.indexOf('access_token missing') !== -1) {
          // 尝试使用redirectTo作为备选方案
          mockWx.redirectTo({
            url: '/pages/history/history',
            success: function() {
              console.log('使用redirectTo成功导航到历史记录页面');
            },
            fail: function(redirectErr) {
              console.error('redirectTo也失败了:', redirectErr);
              // 如果redirectTo也失败，显示更具体的错误提示
              mockWx.showToast({
                title: '页面跳转失败，可能需要重新登录',
                icon: 'none',
                duration: 2000
              });
            }
          });
        } else {
          // 其他类型的错误，显示一般错误提示
          mockWx.showToast({
            title: '页面跳转失败，请重试',
            icon: 'none',
            duration: 2000
          });
        }
      },
      complete: () => {
        // 导航完成后重置标志，无论成功与否
        setTimeout(() => {
          this.navigating = false;
        }, 500);
      }
    });
  };
  
  // 绑定函数到page对象
  page.goToHistory = goToHistory;
  
  // 测试场景1: 没有历史记录时
  console.log('测试场景1: 没有历史记录时');
  mockApp.globalData.foodHistory = [];
  page.navigating = false;
  page.goToHistory();
  
  // 验证结果
  console.log('navigating标志:', page.navigating);
  console.log('showToast调用次数:', mockWx.showToastCallCount);
  console.log('navigateTo调用次数:', mockWx.navigateToCallCount);
  
  // 等待500ms后检查navigating标志是否重置
  setTimeout(() => {
    console.log('500ms后navigating标志:', page.navigating);
    
    // 测试场景2: 有历史记录时
    console.log('\n测试场景2: 有历史记录时');
    mockApp.globalData.foodHistory = [{ name: '测试食物', timestamp: new Date().toLocaleString() }];
    page.navigating = false;
    mockWx.navigateToCallCount = 0;
    page.goToHistory();
    
    // 验证结果
    console.log('navigating标志:', page.navigating);
    console.log('navigateTo调用次数:', mockWx.navigateToCallCount);
    
    // 等待500ms后检查navigating标志是否重置
    setTimeout(() => {
      console.log('500ms后navigating标志:', page.navigating);
      
      // 测试场景3: 快速连续点击
      console.log('\n测试场景3: 快速连续点击');
      page.navigating = false;
      mockWx.navigateToCallCount = 0;
      
      // 第一次点击
      page.goToHistory();
      console.log('第一次点击后navigating标志:', page.navigating);
      console.log('第一次点击后navigateTo调用次数:', mockWx.navigateToCallCount);
      
      // 立即第二次点击
      page.goToHistory();
      console.log('第二次点击后navigating标志:', page.navigating);
      console.log('第二次点击后navigateTo调用次数:', mockWx.navigateToCallCount);
      
      // 等待500ms后测试场景4: 登录授权错误
      setTimeout(() => {
        console.log('\n测试场景4: 登录授权错误');
        page.navigating = false;
        mockWx.navigateToSuccess = false;
        mockWx.lastNavigateToError = 'navigateTo:fail Error: Login is required,access_token missing';
        mockWx.navigateToCallCount = 0;
        mockWx.redirectToCallCount = 0;
        
        // 触发导航
        page.goToHistory();
        
        // 验证结果
        console.log('navigateTo调用次数:', mockWx.navigateToCallCount);
        console.log('redirectTo调用次数:', mockWx.redirectToCallCount);
        
        // 重置为成功状态，以便后续测试
        mockWx.navigateToSuccess = true;
        
        console.log('\n测试完成');
      }, 500);
    }, 500);
  }, 500);
}

// 运行测试
testGoToHistory();

// 导出测试函数，以便在其他地方使用
module.exports = {
  testGoToHistory
};