/**
 * 个人资料页面逻辑
 * 实现大众点评账号关联功能
 */
const app = getApp();
// 导入大众点评工具模块
const dianpingUtil = require('../../utils/dianping');

Page({
  /**
   * 页面的初始数据
   * isDianpingLinked: 是否已关联大众点评账号
   * userInfo: 用户信息
   * isLoading: 是否正在加载中
   */
  data: {
    isDianpingLinked: false,
    userInfo: null,
    isLoading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function() {
    // 检查是否已关联大众点评账号
    this.checkDianpingLinkStatus();
  },
  
  /**
   * 生命周期函数--监听页面显示
   * 确保每次显示页面时都获取最新的关联状态
   */
  onShow: function() {
    this.checkDianpingLinkStatus();
  },
  
  /**
   * 检查大众点评账号关联状态
   * 从本地存储中获取用户的大众点评账号关联状态和用户信息
   * 并更新页面数据，确保UI显示与实际状态一致
   */
  checkDianpingLinkStatus: function() {
    try {
      // 使用工具模块检查关联状态
      const { isDianpingLinked, userInfo } = dianpingUtil.checkLinkStatus();
      
      // 更新页面数据，触发视图层重新渲染
      this.setData({
        isDianpingLinked,
        userInfo
      });
      
      // 同步更新全局数据
      dianpingUtil.updateFoodOptions(app, isDianpingLinked);
    } catch (error) {
      console.error('检查大众点评关联状态失败:', error);
      wx.showToast({
        title: '获取账号状态失败',
        icon: 'none',
        duration: 2000
      });
    }
  },
  
  /**
   * 关联大众点评账号
   * 实现大众点评授权流程
   */
  linkDianpingAccount: function() {
    // 防止重复点击
    if (this.data.isLoading) return;
    
    // 设置加载状态
    this.setData({ isLoading: true });
    
    // 使用工具模块关联账号
    dianpingUtil.linkAccount()
      .then(({ userInfo, favorites }) => {
        // 更新页面状态
        this.setData({
          isDianpingLinked: true,
          userInfo,
          isLoading: false
        });
        
        // 更新全局食物选项
        dianpingUtil.updateFoodOptions(app, true);
        
        // 显示成功提示
        wx.showToast({
          title: '关联成功',
          icon: 'success',
          duration: 2000
        });
      })
      .catch(error => {
        console.error('关联大众点评账号失败:', error);
        
        // 重置加载状态
        this.setData({ isLoading: false });
        
        // 显示错误提示，除非是用户取消授权
        if (error.message !== '用户取消授权') {
          wx.showToast({
            title: '关联失败，请重试',
            icon: 'none',
            duration: 2000
          });
        }
      });
  },
  
  /**
   * 解除大众点评账号关联
   */
  unlinkDianpingAccount: function() {
    // 防止重复点击
    if (this.data.isLoading) return;
    
    // 设置加载状态
    this.setData({ isLoading: true });
    
    // 使用工具模块解除关联
    dianpingUtil.unlinkAccount()
      .then(confirmed => {
        // 如果用户确认解除关联
        if (confirmed) {
          // 更新页面状态
          this.setData({
            isDianpingLinked: false,
            userInfo: null,
            isLoading: false
          });
          
          // 更新全局食物选项
          dianpingUtil.updateFoodOptions(app, false);
          
          // 显示提示
          wx.showToast({
            title: '已解除关联',
            icon: 'success',
            duration: 2000
          });
        } else {
          // 用户取消操作，重置加载状态
          this.setData({ isLoading: false });
        }
      })
      .catch(error => {
        console.error('解除大众点评账号关联失败:', error);
        
        // 重置加载状态
        this.setData({ isLoading: false });
        
        // 显示错误提示
        wx.showToast({
          title: '解除关联失败，请重试',
          icon: 'none',
          duration: 2000
        });
      });
  }
});