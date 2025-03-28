/**
 * 地理位置功能单元测试
 * 测试基于高德地图API的地理位置相关功能
 */

// 模拟wx对象
const wx = {
  getLocation: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  showModal: jest.fn(),
  request: jest.fn(),
  getSetting: jest.fn()
};

// 模拟Page构造函数
global.Page = jest.fn((config) => {
  return config;
});

// 模拟getApp函数
global.getApp = jest.fn(() => {
  return {
    addToHistory: jest.fn(),
    globalData: {
      foodHistory: []
    }
  };
});

// 在测试前导入页面文件
const indexPage = require('../../pages/index/index.js');

describe('高德地图位置服务功能测试', () => {
  let page;
  
  // 每个测试前初始化页面对象
  beforeEach(() => {
    // 重置所有模拟函数的调用记录
    jest.clearAllMocks();
    
    // 创建页面实例
    page = Page.mock.calls[0][0];
    page.setData = jest.fn();
    page.showCustomToast = jest.fn();
    page.animation = {
      opacity: jest.fn().mockReturnThis(),
      step: jest.fn().mockReturnThis(),
      export: jest.fn()
    };
  });
  
  /**
   * 测试权限检查功能
   */
  test('页面加载时应检查位置权限状态', () => {
    // 模拟已授权
    wx.getSetting.mockImplementation(({ success }) => {
      success({
        authSetting: {
          'scope.userLocation': true
        }
      });
    });
    
    // 模拟getUserLocation
    page.getUserLocation = jest.fn();
    
    // 调用onLoad方法
    page.onLoad();
    
    // 调用检查权限方法
    page.checkLocationAuth();
    
    // 验证是否检查了权限
    expect(wx.getSetting).toHaveBeenCalledTimes(1);
    
    // 验证是否自动获取位置
    expect(page.getUserLocation).toHaveBeenCalledTimes(1);
  });
  
  /**
   * 测试获取用户位置功能
   */
  test('获取用户位置成功时应更新位置数据并获取附近餐厅', () => {
    // 模拟成功获取位置
    wx.getLocation.mockImplementation(({ success }) => {
      success({
        latitude: 39.90469,
        longitude: 116.40717
      });
    });
    
    // 模拟fetchNearbyRestaurants方法
    page.fetchNearbyRestaurants = jest.fn();
    
    // 调用获取位置方法
    page.getUserLocation();
    
    // 验证是否正确调用了wx.getLocation
    expect(wx.getLocation).toHaveBeenCalledTimes(1);
    expect(wx.getLocation.mock.calls[0][0].type).toBe('gcj02');
    
    // 验证是否更新了页面数据
    expect(page.setData).toHaveBeenCalledWith({
      userLocation: {
        latitude: 39.90469,
        longitude: 116.40717
      },
      isLoading: false
    });
    
    // 验证是否显示和隐藏了加载提示
    expect(wx.showLoading).toHaveBeenCalledTimes(1);
    expect(wx.hideLoading).toHaveBeenCalledTimes(1);
    
    // 验证是否调用了获取餐厅的方法
    expect(page.fetchNearbyRestaurants).toHaveBeenCalledTimes(1);
  });
  
  /**
   * 测试获取用户位置失败的情况
   */
  test('获取用户位置失败时应显示提示', () => {
    // 模拟获取位置失败
    wx.getLocation.mockImplementation(({ fail }) => {
      fail({
        errMsg: 'getLocation:fail error'
      });
    });
    
    // 调用获取位置方法
    page.getUserLocation();
    
    // 验证是否正确调用了wx.getLocation
    expect(wx.getLocation).toHaveBeenCalledTimes(1);
    
    // 验证是否更新了加载状态
    expect(page.setData).toHaveBeenCalledWith({ isLoading: false });
    
    // 验证是否显示了提示消息
    expect(page.showCustomToast).toHaveBeenCalledWith('获取位置失败，请检查GPS是否打开', 2000);
  });
  
  /**
   * 测试权限被拒绝的情况
   */
  test('用户拒绝位置权限时应弹出授权提示', () => {
    // 模拟权限被拒绝
    wx.getLocation.mockImplementation(({ fail }) => {
      fail({
        errMsg: 'getLocation:fail auth deny'
      });
    });
    
    // 模拟确认提示框
    wx.showModal.mockImplementation(({ success }) => {
      success({
        confirm: true
      });
    });
    
    // 调用获取位置方法
    page.getUserLocation();
    
    // 验证是否显示了授权提示框
    expect(wx.showModal).toHaveBeenCalledTimes(1);
    expect(wx.showModal.mock.calls[0][0].title).toBe('提示');
    expect(wx.showModal.mock.calls[0][0].content).toContain('需要位置权限');
  });
  
  /**
   * 测试计算距离的函数
   */
  test('calculateDistance函数应正确计算两点之间的距离', () => {
    // 北京天安门坐标
    const lat1 = 39.90469;
    const lon1 = 116.40717;
    
    // 上海东方明珠坐标
    const lat2 = 31.23993;
    const lon2 = 121.49994;
    
    // 调用计算距离函数
    const distance = page.calculateDistance(lat1, lon1, lat2, lon2);
    
    // 验证距离计算是否在合理范围内 (约1067公里)
    expect(distance).toBeGreaterThan(1060);
    expect(distance).toBeLessThan(1080);
    expect(typeof distance).toBe('number');
  });
  
  /**
   * 测试获取附近餐厅功能
   */
  test('通过高德地图API成功获取附近餐厅时应更新餐厅列表', () => {
    // 设置用户位置
    page.setData({
      userLocation: {
        latitude: 39.90469,
        longitude: 116.40717
      },
      searchRadius: 3
    });
    
    // 模拟高德地图API返回结果
    const mockRestaurants = {
      status: '1',
      pois: [
        {
          name: '测试餐厅1',
          address: '测试地址1',
          distance: '500',
          type: '中餐;火锅',
          biz_ext: {
            rating: '4.8'
          },
          location: '116.40817,39.90569'
        },
        {
          name: '测试餐厅2',
          address: '测试地址2',
          distance: '800',
          type: '西餐;牛排',
          biz_ext: {
            rating: '4.5'
          },
          location: '116.40917,39.90669'
        }
      ]
    };
    
    // 模拟API请求成功
    wx.request.mockImplementation(({ success }) => {
      success({
        data: mockRestaurants
      });
    });
    
    // 调用获取餐厅方法
    page.fetchNearbyRestaurants();
    
    // 验证是否发送了正确的请求
    expect(wx.request).toHaveBeenCalledTimes(1);
    expect(wx.request.mock.calls[0][0].url).toContain('restapi.amap.com');
    expect(wx.request.mock.calls[0][0].data.radius).toBe(3000); // 3公里 = 3000米
    expect(wx.request.mock.calls[0][0].data.key).toBe('d21e43a7d4da5d30a0ba8790254cc48b');
    
    // 验证是否正确处理返回数据
    expect(page.setData).toHaveBeenCalledWith({
      nearbyRestaurants: [
        {
          name: '测试餐厅1',
          address: '测试地址1',
          distance: '0.5',
          category: '中餐',
          rating: 4.8,
          image: '/images/restaurant.png',
          location: {
            latitude: 39.90569,
            longitude: 116.40817
          }
        },
        {
          name: '测试餐厅2',
          address: '测试地址2',
          distance: '0.8',
          category: '西餐',
          rating: 4.5,
          image: '/images/restaurant.png',
          location: {
            latitude: 39.90669,
            longitude: 116.40917
          }
        }
      ]
    });
    
    // 验证是否显示了正确的提示
    expect(page.showCustomToast).toHaveBeenCalledWith('找到2家餐厅', 1500);
  });
  
  /**
   * 测试搜索半径修改功能
   */
  test('修改搜索半径后应重新获取餐厅数据', () => {
    // 设置用户位置
    page.setData({
      userLocation: {
        latitude: 39.90469,
        longitude: 116.40717
      }
    });
    
    // 模拟fetchNearbyRestaurants方法
    page.fetchNearbyRestaurants = jest.fn();
    
    // 模拟滑块事件
    const event = {
      detail: {
        value: 5 // 新的半径值
      }
    };
    
    // 调用半径修改方法
    page.radiusChanged(event);
    
    // 验证是否更新了半径值
    expect(page.setData).toHaveBeenCalledWith({
      searchRadius: 5
    });
    
    // 验证是否重新获取餐厅数据
    expect(page.fetchNearbyRestaurants).toHaveBeenCalledTimes(1);
  });
  
  /**
   * 测试随机餐厅功能
   */
  test('startRandomizeWithLocation应正确随机选择餐厅', () => {
    // 设置用户位置和餐厅列表
    page.setData({
      userLocation: {
        latitude: 39.90469,
        longitude: 116.40717
      },
      nearbyRestaurants: [
        {
          name: '测试餐厅1',
          distance: '0.5',
          category: '中餐'
        },
        {
          name: '测试餐厅2',
          distance: '0.8',
          category: '西餐'
        }
      ],
      isRandomizing: false,
      isLoading: false
    });
    
    // 模拟全局定时器
    jest.useFakeTimers();
    
    // 调用随机选择方法
    page.startRandomizeWithLocation();
    
    // 验证是否设置了随机状态
    expect(page.setData).toHaveBeenCalledWith({ isRandomizing: true });
    
    // 模拟动画效果
    expect(page.animation.opacity).toHaveBeenCalledWith(0);
    expect(page.animation.step).toHaveBeenCalled();
    
    // 快进超过随机时间（至少5秒）
    jest.advanceTimersByTime(6000);
    
    // 模拟最后一次的setTimeout回调
    jest.runAllTimers();
    
    // 验证是否还原随机状态
    expect(page.setData).toHaveBeenCalledWith({ isRandomizing: false });
    
    // 验证是否显示了最终提示
    expect(page.showCustomToast).toHaveBeenCalledWith('今天就吃这个吧！', 2000);
    
    // 恢复真实的定时器
    jest.useRealTimers();
  });
  
  /**
   * 测试正在加载时不允许随机
   */
  test('数据加载过程中不应允许随机选择', () => {
    // 设置加载状态
    page.setData({
      isLoading: true,
      userLocation: {
        latitude: 39.90469,
        longitude: 116.40717
      }
    });
    
    // 调用随机选择方法
    page.startRandomizeWithLocation();
    
    // 验证是否显示了加载中提示
    expect(page.showCustomToast).toHaveBeenCalledWith('正在加载数据，请稍候...', 1000);
    
    // 验证没有设置随机状态
    expect(page.setData).not.toHaveBeenCalledWith({ isRandomizing: true });
  });
  
  /**
   * 测试无餐厅数据时重新搜索
   */
  test('无餐厅数据时应重新获取附近餐厅', () => {
    // 设置用户位置但无餐厅数据
    page.setData({
      userLocation: {
        latitude: 39.90469,
        longitude: 116.40717
      },
      nearbyRestaurants: [],
      isLoading: false
    });
    
    // 模拟fetchNearbyRestaurants方法
    page.fetchNearbyRestaurants = jest.fn();
    
    // 调用随机选择方法
    page.startRandomizeWithLocation();
    
    // 验证是否尝试重新获取餐厅数据
    expect(page.fetchNearbyRestaurants).toHaveBeenCalledTimes(1);
    
    // 验证是否显示了提示
    expect(page.showCustomToast).toHaveBeenCalledWith('没有找到附近餐厅，正在重新搜索', 2000);
  });
}); 