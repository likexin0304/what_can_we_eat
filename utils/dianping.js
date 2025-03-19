/**
 * 大众点评账号集成工具
 * 提供大众点评账号关联、解除关联、状态检查等功能
 */

/**
 * 检查大众点评账号关联状态
 * @returns {Object} 包含关联状态和用户信息的对象
 */
function checkLinkStatus() {
  try {
    // 从本地存储中获取关联状态和用户信息
    const isDianpingLinked = wx.getStorageSync('dianpingLinked') || false;
    const userInfo = wx.getStorageSync('dianpingUserInfo') || null;
    
    return {
      isDianpingLinked,
      userInfo
    };
  } catch (error) {
    console.error('检查大众点评关联状态失败:', error);
    return {
      isDianpingLinked: false,
      userInfo: null
    };
  }
}

/**
 * 关联大众点评账号
 * @returns {Promise} 返回一个Promise，成功时返回用户信息，失败时返回错误信息
 */
function linkAccount() {
  return new Promise((resolve, reject) => {
    // 显示加载提示
    wx.showLoading({
      title: '正在跳转授权...',
      mask: true
    });
    
    // 模拟网络请求延迟
    setTimeout(() => {
      wx.hideLoading();
      
      try {
        // 模拟跳转到大众点评授权页面
        // 实际项目中需要使用wx.navigateToMiniProgram或其他方式跳转到大众点评授权页面
        wx.showModal({
          title: '授权提示',
          content: '这里将跳转到大众点评授权页面，用户登录并授权后返回小程序。由于这是演示版本，点击确定将模拟授权成功。',
          success: (res) => {
            if (res.confirm) {
              // 模拟获取用户信息
              const userInfo = {
                nickname: '用户' + Math.floor(Math.random() * 1000),
                avatar: '/images/logo.png',
                level: '美食家Lv4'
              };
              
              // 模拟用户收藏的餐厅列表
              const favorites = [
                { name: '外婆家', image: '/images/haidilao.png' },
                { name: '西贝莜面村', image: '/images/mcdonald.png' },
                { name: '必胜客', image: '/images/kfc.png' }
              ];
              
              // 保存到本地存储
              wx.setStorageSync('dianpingLinked', true);
              wx.setStorageSync('dianpingUserInfo', userInfo);
              wx.setStorageSync('dianpingFavorites', favorites);
              
              // 返回成功结果
              resolve({
                userInfo,
                favorites
              });
            } else {
              // 用户取消授权
              reject(new Error('用户取消授权'));
            }
          },
          fail: (error) => {
            reject(new Error('授权弹窗显示失败: ' + error.errMsg));
          }
        });
      } catch (error) {
        console.error('关联大众点评账号失败:', error);
        reject(new Error('关联大众点评账号失败: ' + error.message));
      }
    }, 1000);
  });
}

/**
 * 解除大众点评账号关联
 * @returns {Promise} 返回一个Promise，成功时返回true，失败时返回错误信息
 */
function unlinkAccount() {
  return new Promise((resolve, reject) => {
    try {
      // 显示确认对话框
      wx.showModal({
        title: '解除关联',
        content: '确定要解除与大众点评账号的关联吗？解除后将无法获取个性化餐厅推荐。',
        success: (res) => {
          if (res.confirm) {
            // 清除关联状态和数据
            wx.removeStorageSync('dianpingLinked');
            wx.removeStorageSync('dianpingUserInfo');
            wx.removeStorageSync('dianpingFavorites');
            
            // 返回成功结果
            resolve(true);
          } else {
            // 用户取消操作
            resolve(false);
          }
        },
        fail: (error) => {
          reject(new Error('解除关联对话框显示失败: ' + error.errMsg));
        }
      });
    } catch (error) {
      console.error('解除大众点评账号关联失败:', error);
      reject(new Error('解除大众点评账号关联失败: ' + error.message));
    }
  });
}

/**
 * 更新全局食物选项
 * @param {Object} app - 小程序实例
 * @param {Boolean} isLinked - 是否已关联大众点评账号
 * @returns {Array} 更新后的食物选项列表
 */
function updateFoodOptions(app, isLinked) {
  try {
    if (isLinked) {
      // 获取用户收藏的餐厅列表
      const favorites = wx.getStorageSync('dianpingFavorites') || [];
      
      // 合并现有选项和收藏餐厅，避免重复
      const existingNames = app.globalData.foodOptions.map(item => item.name);
      const newOptions = favorites.filter(item => !existingNames.includes(item.name));
      
      // 更新全局数据
      app.globalData.foodOptions = [...app.globalData.foodOptions, ...newOptions];
      
      return app.globalData.foodOptions;
    } else {
      // 恢复到默认的食物选项 (精简版)
      app.globalData.foodOptions = [
        { name: '海底捞', image: '/images/haidilao.png' },
        { name: 'KFC', image: '/images/kfc.png' },
        { name: '麦当劳', image: '/images/mcdonald.png' },
        { name: '烧烤', image: '/images/shaokao.png' }
      ];
      
      return app.globalData.foodOptions;
    }
  } catch (error) {
    console.error('更新食物选项失败:', error);
    return app.globalData.foodOptions;
  }
}

module.exports = {
  checkLinkStatus,
  linkAccount,
  unlinkAccount,
  updateFoodOptions
};