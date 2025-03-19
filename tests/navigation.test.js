/**
 * 导航功能测试
 * 测试从首页到历史记录页面的导航功能
 */

// 模拟微信小程序环境
const mockWx = {
  navigateTo: jest.fn(),
  redirectTo: jest.fn(),
  showToast: jest.fn(),
  createAnimation: jest.fn().mockReturnValue({
    opacity: jest.fn().mockReturnThis(),
    step: jest.fn().mockReturnThis(),
    export: jest.fn()
  })
};

global.wx = mockWx;

// 模拟getCurrentPages函数
global.getCurrentPages = jest.fn();

// 模拟app实例
const mockApp = {
  globalData: {
    foodHistory: [],
    foodOptions: [
      { name: '测试食物1', image: '/images/test1.png' },
      { name: '测试食物2', image: '/images/test2.png' }
    ]
  },
  addToHistory: jest.fn()
};

// 模拟getApp函数
global.getApp = jest.fn().mockReturnValue(mockApp);

// 导入页面逻辑
const indexPage = require('../pages/index/index.js');

describe('导航功能测试', () => {
  let page;
  
  beforeEach(() => {
    // 重置所有模拟函数
    jest.clearAllMocks();
    
    // 创建页面实例
    page = {};
    Page.call(page, indexPage);
    
    // 调用onLoad初始化页面
    page.onLoad();
  });
  
  test('当没有历史记录时，应显示提示信息而不导航', () => {
    // 确保历史记录为空
    mockApp.globalData.foodHistory = [];
    
    // 调用导航函数
    page.goToHistory();
    
    // 验证显示了提示信息
    expect(mockWx.showToast).toHaveBeenCalledWith({
      title: '暂无历史记录，请先进行随机选择尝试哦',
      icon: 'none',
      duration: 2000
    });
    
    // 验证没有调用导航函数
    expect(mockWx.navigateTo).not.toHaveBeenCalled();
  });
  
  test('当有历史记录时，应正常导航到历史页面', () => {
    // 添加一些历史记录
    mockApp.globalData.foodHistory = [
      { name: '测试食物1', image: '/images/test1.png', timestamp: '2023-01-01 12:00:00' }
    ];
    
    // 模拟当前页面是首页
    global.getCurrentPages.mockReturnValue([{
      route: 'pages/index/index'
    }]);
    
    // 模拟导航成功
    mockWx.navigateTo.mockImplementation(({ success }) => {
      if (success) success();
    });
    
    // 调用导航函数
    page.goToHistory();
    
    // 验证调用了navigateTo
    expect(mockWx.navigateTo).toHaveBeenCalledWith({
      url: '/pages/history/history',
      success: expect.any(Function),
      fail: expect.any(Function),
      complete: expect.any(Function)
    });
  });
  
  test('当navigateTo失败时，应尝试使用redirectTo', () => {
    // 添加一些历史记录
    mockApp.globalData.foodHistory = [
      { name: '测试食物1', image: '/images/test1.png', timestamp: '2023-01-01 12:00:00' }
    ];
    
    // 模拟当前页面是首页
    global.getCurrentPages.mockReturnValue([{
      route: 'pages/index/index'
    }]);
    
    // 模拟navigateTo失败
    mockWx.navigateTo.mockImplementation(({ fail }) => {
      if (fail) fail({ errMsg: 'navigateTo:fail Login is required' });
    });
    
    // 模拟redirectTo成功
    mockWx.redirectTo.mockImplementation(({ success }) => {
      if (success) success();
    });
    
    // 调用导航函数
    page.goToHistory();
    
    // 验证调用了navigateTo
    expect(mockWx.navigateTo).toHaveBeenCalled();
    
    // 验证调用了redirectTo作为备选方案
    expect(mockWx.redirectTo).toHaveBeenCalledWith({
      url: '/pages/history/history',
      success: expect.any(Function),
      fail: expect.any(Function)
    });
  });
  
  test('防止重复导航', () => {
    // 添加一些历史记录
    mockApp.globalData.foodHistory = [
      { name: '测试食物1', image: '/images/test1.png', timestamp: '2023-01-01 12:00:00' }
    ];
    
    // 设置navigating为true，模拟正在导航中
    page.navigating = true;
    
    // 调用导航函数
    page.goToHistory();
    
    // 验证没有调用导航函数
    expect(mockWx.navigateTo).not.toHaveBeenCalled();
    expect(mockWx.showToast).not.toHaveBeenCalled();
  });
});