/**
 * 大众点评账号集成测试
 * 测试大众点评账号关联、解除关联等功能
 */

// 导入大众点评工具模块
const dianpingUtil = require('../utils/dianping');

// 模拟微信小程序环境
const mockWx = {
  // 存储模拟
  storageData: {},
  setStorageSync: jest.fn((key, value) => {
    mockWx.storageData[key] = value;
  }),
  getStorageSync: jest.fn((key) => {
    return mockWx.storageData[key];
  }),
  removeStorageSync: jest.fn((key) => {
    delete mockWx.storageData[key];
  }),
  
  // 界面交互模拟
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  showModal: jest.fn(),
  showToast: jest.fn(),
  
  // 导航模拟
  navigateToMiniProgram: jest.fn()
};

// 注入全局wx对象
global.wx = mockWx;

// 模拟app实例
const mockApp = {
  globalData: {
    foodOptions: [
      { name: '海底捞', image: '/images/haidilao.png' },
      { name: '很久以前羊肉串', image: '/images/henjiuyiqian.png' },
      { name: 'KFC', image: '/images/kfc.png' },
      { name: '麦当劳', image: '/images/mcdonald.png' },
      { name: '今日牛事', image: '/images/jinriniushi.png' },
      { name: '烧烤', image: '/images/shaokao.png' }
    ]
  }
};

// 注入全局getApp函数
global.getApp = jest.fn().mockReturnValue(mockApp);

describe('大众点评账号集成测试', () => {
  // 每个测试前重置模拟对象
  beforeEach(() => {
    jest.clearAllMocks();
    mockWx.storageData = {};
    mockApp.globalData.foodOptions = [
      { name: '海底捞', image: '/images/haidilao.png' },
      { name: '很久以前羊肉串', image: '/images/henjiuyiqian.png' },
      { name: 'KFC', image: '/images/kfc.png' },
      { name: '麦当劳', image: '/images/mcdonald.png' },
      { name: '今日牛事', image: '/images/jinriniushi.png' },
      { name: '烧烤', image: '/images/shaokao.png' }
    ];
  });
  
  describe('checkLinkStatus函数', () => {
    test('未关联状态下应返回正确的状态', () => {
      // 未设置任何存储数据，模拟未关联状态
      const result = dianpingUtil.checkLinkStatus();
      
      expect(result).toEqual({
        isDianpingLinked: false,
        userInfo: null
      });
      expect(mockWx.getStorageSync).toHaveBeenCalledWith('dianpingLinked');
      expect(mockWx.getStorageSync).toHaveBeenCalledWith('dianpingUserInfo');
    });
    
    test('已关联状态下应返回正确的状态和用户信息', () => {
      // 模拟已关联状态
      const mockUserInfo = { nickname: '测试用户', avatar: '/images/logo.png', level: '美食家Lv4' };
      mockWx.storageData['dianpingLinked'] = true;
      mockWx.storageData['dianpingUserInfo'] = mockUserInfo;
      
      const result = dianpingUtil.checkLinkStatus();
      
      expect(result).toEqual({
        isDianpingLinked: true,
        userInfo: mockUserInfo
      });
    });
    
    test('发生异常时应返回默认状态', () => {
      // 模拟getStorageSync抛出异常
      mockWx.getStorageSync.mockImplementationOnce(() => {
        throw new Error('存储访问失败');
      });
      
      const result = dianpingUtil.checkLinkStatus();
      
      expect(result).toEqual({
        isDianpingLinked: false,
        userInfo: null
      });
    });
  });
  
  describe('linkAccount函数', () => {
    test('用户确认授权后应正确保存数据并返回结果', async () => {
      // 模拟用户确认授权
      mockWx.showModal.mockImplementationOnce(({ success }) => {
        success({ confirm: true });
      });
      
      const result = await dianpingUtil.linkAccount();
      
      // 验证显示加载提示
      expect(mockWx.showLoading).toHaveBeenCalledWith({
        title: '正在跳转授权...',
        mask: true
      });
      
      // 验证隐藏加载提示
      expect(mockWx.hideLoading).toHaveBeenCalled();
      
      // 验证显示授权弹窗
      expect(mockWx.showModal).toHaveBeenCalled();
      
      // 验证数据保存
      expect(mockWx.setStorageSync).toHaveBeenCalledWith('dianpingLinked', true);
      expect(mockWx.setStorageSync).toHaveBeenCalledWith('dianpingUserInfo', expect.any(Object));
      expect(mockWx.setStorageSync).toHaveBeenCalledWith('dianpingFavorites', expect.any(Array));
      
      // 验证返回结果
      expect(result).toEqual({
        userInfo: expect.any(Object),
        favorites: expect.any(Array)
      });
    });
    
    test('用户取消授权应返回错误', async () => {
      // 模拟用户取消授权
      mockWx.showModal.mockImplementationOnce(({ success }) => {
        success({ confirm: false });
      });
      
      await expect(dianpingUtil.linkAccount()).rejects.toThrow('用户取消授权');
    });
    
    test('授权弹窗显示失败应返回错误', async () => {
      // 模拟授权弹窗显示失败
      mockWx.showModal.mockImplementationOnce(({ fail }) => {
        fail({ errMsg: 'showModal:fail' });
      });
      
      await expect(dianpingUtil.linkAccount()).rejects.toThrow('授权弹窗显示失败');
    });
  });
  
  describe('unlinkAccount函数', () => {
    test('用户确认解除关联后应正确清除数据并返回结果', async () => {
      // 模拟已关联状态
      mockWx.storageData['dianpingLinked'] = true;
      mockWx.storageData['dianpingUserInfo'] = { nickname: '测试用户' };
      mockWx.storageData['dianpingFavorites'] = [{ name: '测试餐厅' }];
      
      // 模拟用户确认解除关联
      mockWx.showModal.mockImplementationOnce(({ success }) => {
        success({ confirm: true });
      });
      
      const result = await dianpingUtil.unlinkAccount();
      
      // 验证显示确认对话框
      expect(mockWx.showModal).toHaveBeenCalledWith({
        title: '解除关联',
        content: '确定要解除与大众点评账号的关联吗？解除后将无法获取个性化餐厅推荐。',
        success: expect.any(Function),
        fail: expect.any(Function)
      });
      
      // 验证数据清除
      expect(mockWx.removeStorageSync).toHaveBeenCalledWith('dianpingLinked');
      expect(mockWx.removeStorageSync).toHaveBeenCalledWith('dianpingUserInfo');
      expect(mockWx.removeStorageSync).toHaveBeenCalledWith('dianpingFavorites');
      
      // 验证返回结果
      expect(result).toBe(true);
    });
    
    test('用户取消解除关联应返回false', async () => {
      // 模拟用户取消解除关联
      mockWx.showModal.mockImplementationOnce(({ success }) => {
        success({ confirm: false });
      });
      
      const result = await dianpingUtil.unlinkAccount();
      
      // 验证未清除数据
      expect(mockWx.removeStorageSync).not.toHaveBeenCalled();
      
      // 验证返回结果
      expect(result).toBe(false);
    });
    
    test('确认对话框显示失败应返回错误', async () => {
      // 模拟确认对话框显示失败
      mockWx.showModal.mockImplementationOnce(({ fail }) => {
        fail({ errMsg: 'showModal:fail' });
      });
      
      await expect(dianpingUtil.unlinkAccount()).rejects.toThrow('解除关联对话框显示失败');
    });
  });
  
  describe('updateFoodOptions函数', () => {
    test('已关联状态下应合并收藏餐厅到食物选项', () => {
      // 模拟用户收藏的餐厅列表
      const favorites = [
        { name: '外婆家', image: '/images/haidilao.png' },
        { name: '西贝莜面村', image: '/images/mcdonald.png' },
        { name: '新餐厅', image: '/images/kfc.png' }
      ];
      mockWx.storageData['dianpingFavorites'] = favorites;
      
      const result = dianpingUtil.updateFoodOptions(mockApp, true);
      
      // 验证获取收藏餐厅列表
      expect(mockWx.getStorageSync).toHaveBeenCalledWith('dianpingFavorites');
      
      // 验证合并结果（只有新餐厅被添加，其他已存在的不重复添加）
      expect(result).toHaveLength(7); // 原有6个 + 新增1个
      expect(result).toContainEqual({ name: '新餐厅', image: '/images/kfc.png' });
    });
    
    test('未关联状态下应恢复到默认食物选项', () => {
      // 先修改食物选项，模拟之前已添加了收藏餐厅
      mockApp.globalData.foodOptions.push({ name: '新餐厅', image: '/images/test.png' });
      
      const result = dianpingUtil.updateFoodOptions(mockApp, false);
      
      // 验证恢复到默认选项
      expect(result).toHaveLength(6);
      expect(result).not.toContainEqual({ name: '新餐厅', image: '/images/test.png' });
    });
    
    test('发生异常时应返回当前食物选项', () => {
      // 模拟getStorageSync抛出异常
      mockWx.getStorageSync.mockImplementationOnce(() => {
        throw new Error('存储访问失败');
      });
      
      const result = dianpingUtil.updateFoodOptions(mockApp, true);
      
      // 验证返回当前食物选项
      expect(result).toBe(mockApp.globalData.foodOptions);
    });
  });
});