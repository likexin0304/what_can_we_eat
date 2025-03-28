/**
 * 首页逻辑
 * 实现基于地理位置的随机餐厅推荐功能
 */
const app = getApp();
const AMapWX = require('../../libs/amap-wx.130.js');

// 高德地图API密钥（餐厅搜索Demo Key）
const AMAP_KEY = 'd21e43a7d4da5d30a0ba8790254cc48b';

// 是否使用模拟数据（测试时可设为true）
const USE_MOCK_DATA = false;

/**
 * 根据餐厅类别获取对应的图片
 * @param {string} category - 餐厅类别
 * @return {string} 图片路径
 */
function getRestaurantImageByCategory(category) {
  // 将类别转换为小写，方便匹配
  const lowerCategory = (category || '').toLowerCase();
  
  // 中餐类
  if (lowerCategory.includes('中餐') || 
      lowerCategory.includes('川菜') || 
      lowerCategory.includes('湘菜') || 
      lowerCategory.includes('粤菜') || 
      lowerCategory.includes('火锅') || 
      lowerCategory.includes('烧烤') || 
      lowerCategory.includes('小吃') || 
      lowerCategory.includes('面馆')) {
    // 根据具体类型细分
    if (lowerCategory.includes('火锅')) {
      return '/images/haidilao.png'; // 火锅
    } else if (lowerCategory.includes('烧烤')) {
      return '/images/shaokao.png'; // 烧烤
    } else {
      return '/images/renheguan.png'; // 通用中餐
    }
  }
  
  // 西餐类
  else if (lowerCategory.includes('西餐') || 
          lowerCategory.includes('意大利') || 
          lowerCategory.includes('法国') || 
          lowerCategory.includes('牛排') || 
          lowerCategory.includes('披萨') || 
          lowerCategory.includes('汉堡')) {
    // 根据具体类型细分
    if (lowerCategory.includes('汉堡') || lowerCategory.includes('快餐')) {
      if (lowerCategory.includes('麦当劳')) {
        return '/images/mcdonald.png'; // 麦当劳
      } else if (lowerCategory.includes('肯德基') || lowerCategory.includes('kfc')) {
        return '/images/kfc.png'; // 肯德基
      } else {
        return '/images/meiguo.png'; // 通用快餐
      }
    } else {
      return '/images/brownstone.png'; // 通用西餐
    }
  }
  
  // 日料类
  else if (lowerCategory.includes('日本') || 
          lowerCategory.includes('寿司') || 
          lowerCategory.includes('生鱼片') || 
          lowerCategory.includes('日料')) {
    return '/images/jinriniushi.png'; // 日料
  }
  
  // 咖啡厅/甜品店
  else if (lowerCategory.includes('咖啡') || 
          lowerCategory.includes('奶茶') || 
          lowerCategory.includes('甜品') || 
          lowerCategory.includes('蛋糕')) {
    return '/images/beilei.png'; // 咖啡甜品
  }
  
  // 其他类型
  else {
    if (lowerCategory.includes('餐厅') || lowerCategory.includes('美食')) {
      return '/images/henjiuyiqian.png'; // 通用餐厅
    } else {
      return '/images/dabaokoufu.png'; // 默认图片
    }
  }
}

// 模拟的餐厅数据（当USE_MOCK_DATA为true时使用）
const MOCK_RESTAURANTS = [
  {
    name: '人和馆·川菜',
    address: '海淀区颐和园路88号',
    distance: '0.5',
    category: '川菜',
    rating: 4.8,
    image: '/images/renheguan.png',
    location: {
      latitude: 39.90842,
      longitude: 116.39745
    }
  },
  {
    name: 'Brown Stone 牛排馆',
    address: '朝阳区建国路甲92号',
    distance: '0.8',
    category: '西餐;牛排',
    rating: 4.5,
    image: '/images/brownstone.png',
    location: {
      latitude: 39.90901,
      longitude: 116.39702
    }
  },
  {
    name: '今日寿司',
    address: '朝阳区光华路9号',
    distance: '1.2',
    category: '日料;寿司',
    rating: 4.3,
    image: '/images/jinriniushi.png',
    location: {
      latitude: 39.91023,
      longitude: 116.39832
    }
  },
  {
    name: '海底捞火锅',
    address: '朝阳区三里屯路19号',
    distance: '1.5',
    category: '中餐;火锅',
    rating: 4.7,
    image: '/images/haidilao.png',
    location: {
      latitude: 39.92011,
      longitude: 116.41032
    }
  },
  {
    name: '很久以前烧烤店',
    address: '海淀区五道口华清嘉园12号',
    distance: '1.8',
    category: '烧烤',
    rating: 4.2,
    image: '/images/henjiuyiqian.png',
    location: {
      latitude: 39.93213,
      longitude: 116.33981
    }
  },
  {
    name: '星巴克咖啡',
    address: '东城区东直门外大街42号',
    distance: '2.0',
    category: '咖啡厅',
    rating: 4.6,
    image: '/images/beilei.png',
    location: {
      latitude: 39.94021,
      longitude: 116.42912
    }
  },
  {
    name: '肯德基(前门餐厅)',
    address: '东城区前门大街1号',
    distance: '2.5',
    category: '快餐',
    rating: 4.1,
    image: '/images/kfc.png',
    location: {
      latitude: 39.89812,
      longitude: 116.39721
    }
  },
  {
    name: '麦当劳(王府井餐厅)',
    address: '东城区王府井大街88号',
    distance: '2.7',
    category: '快餐',
    rating: 4.0,
    image: '/images/mcdonald.png',
    location: {
      latitude: 39.91231,
      longitude: 116.41021
    }
  }
];

Page({
  /**
   * 页面的初始数据
   * currentFood: 当前显示的餐厅
   * isRandomizing: 是否正在随机选择中
   * animationData: 动画数据
   * showCustomToast: 是否显示自定义Toast
   * customToastText: 自定义Toast文本内容
   * userLocation: 用户当前位置
   * searchRadius: 搜索半径（公里）
   * nearbyRestaurants: 附近餐厅列表
   * isLoading: 是否正在加载数据
   * testResults: API测试结果
   * __debug: 调试模式标志
   * useMockData: 使用模拟数据标志，传递到视图
   * showApiKeyModal: 是否显示API密钥设置弹窗
   * tempApiKey: 临时存储用户输入的API密钥
   * showDecisionBanner: 控制决定横幅的显示隐藏
   */
  data: {
    currentFood: null,
    isRandomizing: false,
    animationData: {},
    showCustomToast: false,
    customToastText: '',
    userLocation: null,
    searchRadius: 3,
    nearbyRestaurants: [],
    isLoading: false,
    testResults: {
      amapConnected: false,
      locationAvailable: false,
      restaurantsFound: false
    },
    __debug: false,  // 设置为false，关闭调试模式
    useMockData: false,  // 不使用模拟数据
    showApiKeyModal: false,  // 是否显示API密钥设置弹窗
    tempApiKey: '',  // 临时存储用户输入的API密钥
    showDecisionBanner: false  // 控制决定横幅的显示隐藏
  },

  /**
   * 生命周期函数 - 监听页面加载
   */
  onLoad: function () {
    // 初始化动画
    this.setupAnimation();
    
    // 检查系统信息
    this.checkSystemInfo();
    
    // 自动测试高德地图SDK连接
    console.log('使用的高德地图API密钥:', AMAP_KEY);
    
    // 自动获取位置并搜索餐厅
    setTimeout(() => {
      this.getUserLocation();
    }, 1000);
  },

  /**
   * 检查位置权限状态
   * 根据权限状态决定是否自动获取位置
   */
  checkLocationAuth: function() {
    const that = this;
    // 获取用户的当前设置
    wx.getSetting({
      success: (res) => {
        // 判断是否已授权位置权限
        if (res.authSetting['scope.userLocation']) {
          // 已授权，直接获取位置
          that.getUserLocation();
        } else {
          // 未授权，显示提示
          that.showCustomToast('点击"获取位置"按钮开始', 2000);
        }
      },
      fail: (err) => {
        console.error('获取设置失败:', err);
      }
    });
  },
  
  /**
   * 处理图片加载错误
   * 当餐厅图片加载失败时，使用默认图片替代
   */
  handleImageError: function(e) {
    console.log('图片加载失败:', e);
    // 获取错误的图片路径
    const errorImgSrc = e.target.dataset.src;
    console.log('加载失败的图片:', errorImgSrc);
    
    // 如果当前食物存在
    if (this.data.currentFood) {
      // 克隆当前食物对象
      const updatedFood = {...this.data.currentFood};
      // 替换为默认图片
      updatedFood.image = '/images/dabaokoufu.png';
      // 更新数据
      this.setData({
        currentFood: updatedFood
      });
      
      console.log('已替换为默认图片');
    }
  },

  /**
   * 显示自定义Toast
   * @param {string} text - 要显示的文本内容
   * @param {number} duration - 显示持续时间，单位为毫秒
   */
  showCustomToast: function(text, duration = 2000) {
    this.setData({
      customToastText: text,
      showCustomToast: true
    });
    
    // 设置定时器，在指定时间后隐藏Toast
    setTimeout(() => {
      this.setData({
        showCustomToast: false
      });
    }, duration);
  },
  
  /**
   * 获取用户当前位置
   * 获取用户的地理位置信息，并根据位置搜索附近餐厅
   */
  getUserLocation: function() {
    // 如果正在加载中，避免重复操作
    if (this.data.isLoading) {
      return;
    }
    
    console.log('开始获取位置信息');
    
    // 显示加载中
    this.setData({ isLoading: true });
    
    // 显示loading提示
    wx.showLoading({
      title: '获取位置中...',
      mask: true
    });
    
    // 调用微信API获取用户位置
    wx.getLocation({
      type: 'gcj02', // 使用gcj02坐标系，与高德地图兼容
      success: (res) => {
        console.log('获取位置成功:', res);
        
        // 更新位置信息
        this.setData({
          userLocation: {
            latitude: res.latitude,
            longitude: res.longitude
          }
        });
        
        // 根据位置搜索附近餐厅
        this.fetchNearbyRestaurants();
      },
      fail: (err) => {
        console.error('获取位置失败:', err);
        wx.hideLoading();
        this.setData({ isLoading: false });
        
        // 根据错误类型给出不同提示
        if (err.errMsg.includes('auth deny')) {
          // 用户拒绝授权
          this.showCustomToast('获取位置失败，请授权位置权限', 2000);
          
          // 显示引导授权的模态框
          wx.showModal({
            title: '需要位置权限',
            content: '请在小程序设置中开启位置权限，以便获取附近餐厅信息',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) {
                // 打开设置页面
                wx.openSetting({
                  success: (res) => {
                    if (res.authSetting['scope.userLocation']) {
                      // 用户已授权，重新获取位置
                      setTimeout(() => {
                        this.getUserLocation();
                      }, 500);
                    }
                  }
                });
              }
            }
          });
        } else {
          this.showCustomToast('获取位置失败，请检查GPS是否开启', 2000);
        }
      }
    });
  },
  
  /**
   * 获取附近餐厅数据
   * 使用高德地图SDK根据用户位置和搜索半径获取附近餐馆信息
   */
  fetchNearbyRestaurants: function() {
    // 确保已经获取到用户位置
    if (!this.data.userLocation) {
      this.showCustomToast('请先获取位置', 1500);
      return;
    }
    
    // 设置加载状态
    this.setData({ isLoading: true });
    
    // 显示加载提示
    wx.showLoading({
      title: '搜索附近餐厅...',
      mask: true
    });
    
    // 获取位置和搜索半径
    const { latitude, longitude } = this.data.userLocation;
    const radius = this.data.searchRadius * 1000; // 转换为米
    
    // 添加调试日志
    console.log('开始搜索附近餐厅');
    console.log('用户位置:', latitude, longitude);
    console.log('搜索半径(米):', radius);
    
    // 创建高德地图实例
    const amapInstance = new AMapWX.AMapWX({
      key: AMAP_KEY
    });
    
    // 使用高德SDK获取周边POI
    amapInstance.getPoiAround({
      querykeywords: '餐厅|美食',
      querytypes: '050000', // 餐饮类POI
      location: `${longitude},${latitude}`,
      radius: radius, // 添加搜索半径参数，修改后的SDK会处理此参数
      success: (res) => {
        // 隐藏加载提示
        wx.hideLoading();
        this.setData({ isLoading: false });
        
        console.log('高德SDK返回数据:', res);
        
        // 检查返回结果
        if (res && res.poisData && res.poisData.length > 0) {
          // 成功获取餐厅数据，处理返回的POI数据
          const restaurants = res.poisData.map(item => {
            // 提取评分，如果没有则设置默认值
            let rating = null;
            if (item.biz_ext && item.biz_ext.rating) {
              rating = parseFloat(item.biz_ext.rating);
            }
            
            // 获取距离，转换为公里
            let distance = item.distance ? (parseFloat(item.distance) / 1000).toFixed(1) : null;
            
            // 提取分类
            let category = item.type ? item.type.split(';')[0] : '餐厅';
            
            return {
              name: item.name,
              address: item.address || '地址信息暂无',
              distance: distance,
              category: category,
              rating: rating,
              image: getRestaurantImageByCategory(category), // 根据分类获取餐厅图片
              location: {
                latitude: parseFloat(item.location.split(',')[1]),
                longitude: parseFloat(item.location.split(',')[0])
              }
            };
          });
          
          // 按评分排序（从高到低）
          restaurants.sort((a, b) => {
            if (a.rating === null) return 1;
            if (b.rating === null) return -1;
            return b.rating - a.rating;
          });
          
          console.log('处理后的餐厅数据:', restaurants);
          
          // 更新餐厅列表
          this.setData({
            nearbyRestaurants: restaurants
          });
          
          // 显示获取到的餐厅数量
          this.showCustomToast(`找到${restaurants.length}家餐厅`, 1500);
        } else {
          // 没有找到餐厅
          console.error('周边搜索未找到餐厅');
          this.showCustomToast('附近未找到餐厅，请尝试增大搜索范围', 2000);
          
          // 尝试关键字搜索作为备选方案
          this.searchRestaurantsByKeyword();
        }
      },
      fail: (err) => {
        // 请求失败
        wx.hideLoading();
        this.setData({ isLoading: false });
        console.error('获取餐厅信息失败:', err);
        
        // 显示错误消息
        this.showCustomToast('获取餐厅信息失败，请稍后再试', 2000);
        
        // 提供详细错误信息帮助调试
        if (err.errMsg) {
          console.error('错误详情:', err.errMsg);
          
          // 如果是域名未授权，提示用户
          if (err.errMsg.includes('url not in domain list')) {
            wx.showModal({
              title: '网络请求错误',
              content: '无法连接到地图服务，请确保在开发工具中勾选"不校验合法域名"选项',
              showCancel: false
            });
          }
        }
      }
    });
  },
  
  /**
   * 修改搜索半径
   * @param {Object} e - 滑块事件对象
   */
  radiusChanged: function(e) {
    const radius = e.detail.value;
    
    // 更新UI上的半径值
    this.setData({
      searchRadius: radius
    });
    
    // 添加调试日志
    console.log(`搜索半径已调整为${radius}公里`);
    
    // 显示正在更新的提示
    this.showCustomToast(`搜索半径已调整为${radius}公里`, 1000);
    
    // 清除之前的定时器（防抖处理）
    if (this.radiusChangeTimer) {
      clearTimeout(this.radiusChangeTimer);
      console.log('清除之前的半径更新定时器');
    }
    
    // 设置定时器，延迟执行搜索（防止频繁调用API）
    console.log('设置500毫秒后执行搜索');
    this.radiusChangeTimer = setTimeout(() => {
      // 如果已经获取过位置，则更新搜索结果
      if (this.data.userLocation) {
        console.log(`执行更新操作: 半径调整为${radius}公里，重新搜索餐厅`);
        this.fetchNearbyRestaurants();
      } else {
        console.log('未获取位置，不执行搜索');
        this.showCustomToast('请先获取位置', 1500);
      }
    }, 500); // 500毫秒的延迟
  },
  
  /**
   * 计算两点间的距离（使用Haversine公式）
   * @param {number} lat1 - 第一点纬度
   * @param {number} lon1 - 第一点经度
   * @param {number} lat2 - 第二点纬度
   * @param {number} lon2 - 第二点经度
   * @return {number} 距离，单位为公里
   */
  calculateDistance: function(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球半径，单位为千米
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return parseFloat(distance.toFixed(1)); // 保留一位小数
  },
  
  /**
   * 角度转弧度
   * @param {number} degrees - 角度
   * @return {number} 弧度
   */
  toRadians: function(degrees) {
    return degrees * Math.PI / 180;
  },

  /**
   * 基于地理位置开始随机选择餐厅
   * 核心功能：在附近餐厅中随机选择并展示
   * 实现方式：
   * 1. 检查是否已获取位置和餐厅数据
   * 2. 设置随机时间（3-5秒）
   * 3. 在随机时间内快速切换不同餐厅选项
   * 4. 结束后停留在随机选中的餐厅上
   * 5. 将选中的餐厅添加到历史记录
   */
  startRandomizeWithLocation: function() {
    // 如果正在加载数据，不执行随机
    if (this.data.isLoading) {
      this.showCustomToast('正在加载数据，请稍候...', 1000);
      return;
    }
    
    // 检查是否有位置信息
    if (!this.data.userLocation) {
      this.getUserLocation();
      return;
    }
    
    // 如果已经在随机选择过程中，直接返回
    if (this.data.isRandomizing) {
      this.showCustomToast('正在选择中...', 1000);
      return;
    }
    
    // 检查是否有餐厅数据
    const restaurants = this.data.nearbyRestaurants;
    if (restaurants.length === 0) {
      // 记录搜索尝试次数
      this.searchAttempts = this.searchAttempts || 0;
      this.searchAttempts++;
      
      if (this.searchAttempts === 1) {
        // 第一次尝试，使用周边搜索
        console.log('没有餐厅数据，尝试周边搜索');
        this.showCustomToast('没有找到附近餐厅，正在搜索...', 2000);
        this.fetchNearbyRestaurants();
      } else if (this.searchAttempts === 2) {
        // 第二次尝试，使用关键字搜索
        console.log('周边搜索无结果，尝试关键字搜索');
        this.showCustomToast('尝试城市范围搜索餐厅...', 2000);
        this.searchRestaurantsByKeyword();
      } else {
        // 多次尝试都失败
        console.log('多次搜索都无结果');
        this.showCustomToast('抱歉，未能找到餐厅数据，请更换位置或检查网络', 2500);
        // 重置搜索计数
        this.searchAttempts = 0;
      }
      return;
    }
    
    // 重置搜索尝试计数
    this.searchAttempts = 0;
    
    // 设置为随机选择状态
    this.setData({ isRandomizing: true });
    
    // 随机时间，3-5秒
    const randomTime = Math.floor(Math.random() * 2000) + 3000;
    const intervalTime = 100; // 切换间隔时间
    let elapsedTime = 0;
    let intervalId;
    
    // 创建淡入淡出动画
    const fadeAnimation = () => {
      this.animation.opacity(0).step();
      this.setData({ animationData: this.animation.export() });
      
      setTimeout(() => {
        // 随机选择一个餐厅
        const randomIndex = Math.floor(Math.random() * restaurants.length);
        this.setData({ currentFood: restaurants[randomIndex] });
        
        // 淡入动画
        this.animation.opacity(1).step();
        this.setData({ animationData: this.animation.export() });
      }, 150);
    };
    
    // 开始随机切换餐厅
    fadeAnimation();
    intervalId = setInterval(() => {
      elapsedTime += intervalTime;
      
      // 随机切换餐厅
      fadeAnimation();
      
      // 达到随机时间后停止
      if (elapsedTime >= randomTime) {
        clearInterval(intervalId);
        
        // 停止随机选择，但等待最后一次动画完成后再记录最终结果
        setTimeout(() => {
          // 停止随机选择，确保当前餐厅不再变化
          const finalSelectedRestaurant = {...this.data.currentFood};
          
          // 添加到历史记录
          if (app.addToHistory) {
            app.addToHistory(finalSelectedRestaurant);
          }
          
          // 设置为非随机选择状态，不再显示决定横幅
          this.setData({ 
            isRandomizing: false
          });
          
          // 不再显示底部Toast提示
          // this.showCustomToast('今天就吃这个吧！', 2000);
          
          // 不再需要隐藏横幅的定时器
          /*
          setTimeout(() => {
            this.setData({
              showDecisionBanner: false
            });
          }, 5000);
          */
        }, 200); // 等待时间略大于fadeAnimation中的setTimeout时间(150ms)
      }
    }, intervalTime);
  },

  /**
   * 通过关键字搜索餐厅
   * 当周边搜索无结果时，可以使用此备选方案
   * 使用高德地图SDK的关键字搜索
   */
  searchRestaurantsByKeyword: function() {
    // 确保已经获取到用户位置
    if (!this.data.userLocation) {
      this.showCustomToast('请先获取位置', 1500);
      return;
    }
    
    // 设置加载状态
    this.setData({ isLoading: true });
    
    // 显示加载提示
    wx.showLoading({
      title: '尝试关键字搜索...',
      mask: true
    });
    
    console.log('开始关键字搜索餐厅');
    
    // 获取城市编码（默认使用附近的城市）
    const { latitude, longitude } = this.data.userLocation;
    
    // 创建高德地图实例
    const amapInstance = new AMapWX.AMapWX({
      key: AMAP_KEY
    });
    
    // 使用高德SDK的关键字搜索
    amapInstance.getInputtips({
      keywords: '餐厅',
      location: `${longitude},${latitude}`,
      success: (res) => {
        // 隐藏加载提示
        wx.hideLoading();
        this.setData({ isLoading: false });
        
        console.log('关键字搜索返回结果:', res);
        
        // 检查返回结果
        if (res && res.tips && res.tips.length > 0) {
          // 过滤出餐厅类型的结果
          const restaurants = res.tips
            .filter(item => item.address && (
              item.typecode.startsWith('050') || // 餐饮类
              item.category && item.category.includes('餐饮') || 
              item.category && item.category.includes('美食')
            ))
            .map(item => {
              // 如果有位置信息
              let latitude = null, longitude = null;
              if (item.location) {
                const location = item.location.split(',');
                longitude = parseFloat(location[0]);
                latitude = parseFloat(location[1]);
              }
              
              // 计算距离
              let distance = null;
              if (latitude && longitude) {
                distance = this.calculateDistance(
                  this.data.userLocation.latitude, 
                  this.data.userLocation.longitude, 
                  latitude, 
                  longitude
                );
              }
              
              return {
                name: item.name,
                address: item.address || '地址信息暂无',
                distance: distance,
                category: item.category || '餐厅',
                rating: null, // 关键字搜索没有评分
                image: getRestaurantImageByCategory(item.category), // 根据分类获取餐厅图片
                location: latitude && longitude ? {
                  latitude: latitude,
                  longitude: longitude
                } : null
              };
            })
            .filter(item => item.location !== null); // 只保留有位置信息的
          
          // 按距离排序（从近到远）
          restaurants.sort((a, b) => {
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return parseFloat(a.distance) - parseFloat(b.distance);
          });
          
          console.log('关键字搜索处理后餐厅数据:', restaurants);
          
          if (restaurants.length > 0) {
            // 更新餐厅列表
            this.setData({
              nearbyRestaurants: restaurants
            });
            
            // 显示获取到的餐厅数量
            this.showCustomToast(`关键字搜索找到${restaurants.length}家餐厅`, 1500);
          } else {
            // 虽然有结果，但没有餐厅
            this.showCustomToast('未找到餐厅，请更换位置或尝试更大搜索范围', 2000);
            console.log('关键字搜索结果中没有餐厅类型的POI');
          }
        } else {
          console.error('关键字搜索未找到餐厅');
          
          // 处理错误情况
          this.showCustomToast('未找到餐厅，请更换位置或尝试更大搜索范围', 2000);
        }
      },
      fail: (err) => {
        // 请求失败
        wx.hideLoading();
        this.setData({ isLoading: false });
        console.error('关键字搜索餐厅失败:', err);
        
        // 显示错误消息
        this.showCustomToast('搜索餐厅失败，请稍后再试', 2000);
        
        // 提供详细错误信息
        if (err.errMsg) {
          console.error('错误详情:', err.errMsg);
        }
      }
    });
  },

  /**
   * 显示API密钥设置弹窗
   */
  showApiKeyInput: function() {
    this.setData({
      showApiKeyModal: true,
      tempApiKey: AMAP_KEY || ''
    });
  },
  
  /**
   * 处理API密钥输入
   */
  onApiKeyInput: function(e) {
    this.setData({
      tempApiKey: e.detail.value
    });
  },
  
  /**
   * 取消API密钥设置
   */
  cancelApiKey: function() {
    this.setData({
      showApiKeyModal: false,
      tempApiKey: ''
    });
  },
  
  /**
   * 保存API密钥设置
   * 由于JavaScript的限制，无法直接修改常量AMAP_KEY的值
   * 这里使用全局变量进行替代
   */
  saveApiKey: function() {
    const newKey = this.data.tempApiKey.trim();
    
    // 如果输入为空，显示提示
    if (!newKey) {
      this.showCustomToast('API密钥不能为空', 1500);
      return;
    }
    
    // 设置全局变量以存储API密钥
    getApp().globalData = getApp().globalData || {};
    getApp().globalData.amapKey = newKey;
    
    // 隐藏弹窗
    this.setData({
      showApiKeyModal: false
    });
    
    // 显示成功提示
    this.showCustomToast('API密钥设置成功，重新测试中...', 1500);
    
    // 关闭模拟数据模式
    this.setData({
      useMockData: false
    });
    
    // 重新测试连接
    setTimeout(() => {
      this.fetchNearbyRestaurants();
    }, 1500);
  },
  
  /**
   * 设置动画效果
   * 初始化动画实例，设置动画参数
   */
  setupAnimation: function() {
    // 创建动画实例，设置动画持续时间和缓动函数
    this.animation = wx.createAnimation({
      duration: 300, // 动画持续时间，单位为毫秒
      timingFunction: 'ease', // 动画缓动函数，使动画更自然
    });
    
    // 初始化导航标志，防止重复导航操作
    this.navigating = false;
  },
  
  /**
   * 检查系统信息
   * 检查用户系统和权限设置
   */
  checkSystemInfo: function() {
    // 初始化导航标志，防止重复导航操作
    this.navigating = false;
    
    // 页面加载后自动检查位置权限
    this.checkLocationAuth();
  }
});